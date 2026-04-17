#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h>

// ================= PIN CONFIG =================
#define RFID_CS_PIN 5
#define RFID_SCK_PIN 18
#define RFID_MOSI_PIN 23
#define RFID_MISO_PIN 19
#define RFID_RST_PIN 4

#define LCD_SDA_PIN 21
#define LCD_SCL_PIN 22

#define RED_LED_PIN 25
#define GREEN_LED_PIN 26
#define BUZZER_PIN 27

// ================= WIFI =================
const char* SSID = "Jishnu";
const char* PASSWORD = "12345678";

// ================= SUPABASE =================
const char* SUPABASE_URL = "https://epenxgiyrlpldneatddc.supabase.co/rest/v1/card_data";
const char* SUPABASE_LOG_URL = "https://epenxgiyrlpldneatddc.supabase.co/rest/v1/logs";
const char* SUPABASE_SCAN_REQUEST_URL = "https://epenxgiyrlpldneatddc.supabase.co/rest/v1/scan_requests";
const char* SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwZW54Z2l5cmxwbGRuZWF0ZGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTY5ODgsImV4cCI6MjA5MTY5Mjk4OH0.Hi1Z0ZwUMEuIT879BxfYwdAp7cq3vdhXhaLTViujBCU";

const char* NTP_SERVER = "pool.ntp.org";
const long GMT_OFFSET_SEC = 19800; // IST
const int DAYLIGHT_OFFSET_SEC = 0;

// ================= OBJECTS =================
LiquidCrystal_I2C lcd(0x27, 16, 2);
MFRC522 rfid(RFID_CS_PIN, RFID_RST_PIN);
MFRC522::MIFARE_Key key;

// ================= GLOBALS =================
unsigned long lastScanTime = 0;
const unsigned long SCAN_DEBOUNCE = 800;

unsigned long lastControlPoll = 0;
const unsigned long CONTROL_POLL_INTERVAL = 2000;
unsigned long lastAssignmentPoll = 0;
const unsigned long ASSIGNMENT_POLL_INTERVAL = 2000;

bool scanModeActive = false;
String activeRequestId = "";
String lastAssignmentNoticeId = "";
unsigned long scanSessionStartedAt = 0;
const unsigned long SCAN_SESSION_TIMEOUT = 60000;

unsigned long ledOnTime = 0;
bool ledActive = false;
const unsigned long LED_DURATION = 3000;

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  SPI.begin(RFID_SCK_PIN, RFID_MISO_PIN, RFID_MOSI_PIN, RFID_CS_PIN);
  rfid.PCD_Init();

  for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF;

  Wire.begin(LCD_SDA_PIN, LCD_SCL_PIN);
  lcd.init();
  lcd.backlight();

  displayOnLCD("WAPP-MATE", "Connecting WiFi");

  WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
  }

  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
  waitForTimeSync();

  displayOnLCD("Press Scan Btn", "");
}

// ================= LOOP =================
void loop() {
  pollScanRequest();
  pollAssignedNotice();

  if (scanModeActive && (millis() - scanSessionStartedAt > SCAN_SESSION_TIMEOUT)) {
    abortScanSession();
  }

  if (scanModeActive) {
    scanCard();
  }

  handleLEDTimeout();
}

// ================= RFID SCAN =================
void scanCard() {

  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  if (millis() - lastScanTime < SCAN_DEBOUNCE) return;
  lastScanTime = millis();

  // UID
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();

  Serial.println("UID: " + uid);

  // Check server
  String id="", name="", upi="", timeStr="";
  String jobStatus = "";
  bool allowed = checkWithSupabase(uid, id, name, upi, timeStr);

  if (allowed) {
    jobStatus = resolveNextJobStatus(uid);

    lightGreenLED();
    soundBuzzer(1);

    displayOnLCD(id, name);
    delay(2000);

    displayOnLCD("UPI ID", upi);
    delay(2000);

    String timeOnly = timeStr;
    if (timeStr.length() >= 19) {
      timeOnly = timeStr.substring(11, 19);
    }

    displayOnLCD("SCAN TIME", timeOnly);
    delay(2000);

    displayOnLCD("Scan Card", "");

    logToSupabase(activeRequestId, uid, name, timeStr, "granted", jobStatus);

    Serial.println("JOB STATUS: " + jobStatus);

  } else {
    jobStatus = "denied";

    lightRedLED();
    soundBuzzer(3);

    displayOnLCD("ACCESS DENIED", uid);
    delay(3000);

    displayOnLCD("Scan Card", "");

    logToSupabase(activeRequestId, uid, "", getCurrentTimestamp(), "denied", "none");
  }

  if (activeRequestId.length() > 0) {
    markScanRequestProcessed(activeRequestId);
  }

  endScanSession();
  displayOnLCD("Press Scan Btn", "");

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

// ================= SUPABASE CHECK =================
bool checkWithSupabase(String uid, String &id, String &name, String &upi, String &timeStr) {

  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  String url = String(SUPABASE_URL) + "?uid=eq." + uid;

  http.begin(url);
  http.addHeader("apikey", SUPABASE_API_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_API_KEY));

  int httpCode = http.GET();

  if (httpCode == 200) {

    String payload = http.getString();
    Serial.println("SUPABASE RAW: " + payload);

    if (payload == "[]") {
      http.end();
      return false;
    }

    id = extractJsonString(payload, "wid");
    name = extractJsonString(payload, "full_name");
    upi = extractJsonString(payload, "upi");

    if (id.length() == 0 && name.length() == 0 && upi.length() == 0) {
      http.end();
      return false;
    }

    timeStr = getCurrentTimestamp();

    http.end();
    return true;
  }

  http.end();
  return false;
}

// ================= LOGGING =================
void logToSupabase(String requestId, String uid, String name, String scanTime, String accessStatus, String jobStatus) {

  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(SUPABASE_LOG_URL);

  http.addHeader("apikey", SUPABASE_API_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_API_KEY));
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");

  String body = "{\"request_id\":\"" + requestId + "\",\"uid\":\"" + uid + "\",\"name\":\"" + name + "\",\"scan_time\":\"" + scanTime + "\",\"access_status\":\"" + accessStatus + "\",\"job_status\":\"" + jobStatus + "\"}";
  http.POST(body);

  http.end();
}

// ================= SCAN REQUEST CONTROL =================
void pollScanRequest() {
  if (millis() - lastControlPoll < CONTROL_POLL_INTERVAL) return;
  lastControlPoll = millis();

  if (scanModeActive) return;

  String requestId = "";
  if (fetchLatestPendingScanRequest(requestId)) {
    if (claimScanRequest(requestId)) {
      activeRequestId = requestId;
      scanModeActive = true;
      scanSessionStartedAt = millis();
      displayOnLCD("SCAN MODE ON", "Tap Card");
      Serial.println("SCAN REQUEST: " + activeRequestId);
    }
  }
}

void pollAssignedNotice() {
  if (millis() - lastAssignmentPoll < ASSIGNMENT_POLL_INTERVAL) return;
  lastAssignmentPoll = millis();

  if (scanModeActive || WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SUPABASE_SCAN_REQUEST_URL) + "?select=id,status&or=(status.like.assigned%3A%25,status.like.completed%3A%25)&order=id.desc&limit=1";

  http.begin(url);
  http.addHeader("apikey", SUPABASE_API_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_API_KEY));

  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    if (payload != "[]") {
      String noticeId = extractJsonValue(payload, "id");
      String status = extractJsonString(payload, "status");
      bool isAssigned = status.startsWith("assigned:");
      bool isCompleted = status.startsWith("completed:");
      if (noticeId.length() > 0 && noticeId != lastAssignmentNoticeId && (isAssigned || isCompleted)) {
        String uid = status.substring(isCompleted ? 10 : 9);
        if (uid.length() > 0) {
          displayOnLCD(isCompleted ? "Completed by" : "Assigned to", uid);
          delay(2000);
          displayOnLCD("Press Scan Btn", "");
          markScanRequestProcessed(noticeId);
          lastAssignmentNoticeId = noticeId;
        }
      }
    }
  }

  http.end();
}

bool fetchLatestPendingScanRequest(String &requestId) {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  String url = String(SUPABASE_SCAN_REQUEST_URL) + "?select=id,status&status=eq.pending&order=id.desc&limit=1";

  http.begin(url);
  http.addHeader("apikey", SUPABASE_API_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_API_KEY));

  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();

    if (payload != "[]") {
      requestId = extractJsonValue(payload, "id");
      http.end();
      return requestId.length() > 0;
    }
  }

  http.end();
  return false;
}

bool claimScanRequest(String requestId) {
  if (WiFi.status() != WL_CONNECTED || requestId.length() == 0) return false;

  HTTPClient http;
  String url = String(SUPABASE_SCAN_REQUEST_URL) + "?id=eq." + requestId + "&status=eq.pending";
  http.begin(url);
  http.addHeader("apikey", SUPABASE_API_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_API_KEY));
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");

  String body = "{\"status\":\"in_progress\"}";
  int code = http.PATCH(body);
  http.end();

  return code >= 200 && code < 300;
}

void markScanRequestProcessed(String requestId) {
  if (WiFi.status() != WL_CONNECTED || requestId.length() == 0) return;

  HTTPClient http;
  String url = String(SUPABASE_SCAN_REQUEST_URL) + "?id=eq." + requestId;
  http.begin(url);
  http.addHeader("apikey", SUPABASE_API_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_API_KEY));
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=minimal");

  String body = "{\"status\":\"processed\"}";
  http.PATCH(body);

  http.end();
}

String resolveNextJobStatus(String uid) {
  String previousJobStatus = fetchLatestJobStatus(uid);
  if (previousJobStatus == "assigned") return "completed";
  return "assigned";
}

String fetchLatestJobStatus(String uid) {
  if (WiFi.status() != WL_CONNECTED) return "";

  HTTPClient http;
  String url = String(SUPABASE_LOG_URL) + "?select=job_status&uid=eq." + uid + "&access_status=eq.granted&order=scan_time.desc&limit=1";

  http.begin(url);
  http.addHeader("apikey", SUPABASE_API_KEY);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_API_KEY));

  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    if (payload != "[]") {
      String jobStatus = extractJsonString(payload, "job_status");
      http.end();
      return jobStatus;
    }
  }

  http.end();
  return "";
}

void endScanSession() {
  scanModeActive = false;
  scanSessionStartedAt = 0;
  activeRequestId = "";
}

void abortScanSession() {
  if (activeRequestId.length() > 0) {
    markScanRequestProcessed(activeRequestId);
  }

  displayOnLCD("Press Scan Btn", "");
  endScanSession();
}

// ================= DISPLAY =================
void displayOnLCD(String l1, String l2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(l1.substring(0, 16));
  lcd.setCursor(0, 1);
  lcd.print(l2.substring(0, 16));
}

// ================= BUZZER =================
void soundBuzzer(int b) {
  for (int i = 0; i < b; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(120);
    digitalWrite(BUZZER_PIN, LOW);
    delay(120);
  }
}

// ================= TIME / JSON HELPERS =================
void waitForTimeSync() {
  struct tm timeinfo;
  for (int i = 0; i < 20; i++) {
    if (getLocalTime(&timeinfo)) return;
    delay(500);
  }
}

String getCurrentTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return String(millis() / 1000);
  }

  char buffer[24];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buffer);
}

String extractJsonValue(const String &payload, const String &key) {
  String token = "\"" + key + "\":";
  int start = payload.indexOf(token);
  if (start == -1) return "";

  start += token.length();
  while (start < payload.length() && payload[start] == ' ') {
    start++;
  }

  if (start >= payload.length()) return "";

  if (payload[start] == '"') {
    start++;
    int end = payload.indexOf('"', start);
    if (end == -1) return "";
    return payload.substring(start, end);
  }

  int end = start;
  while (end < payload.length() && payload[end] != ',' && payload[end] != '}' && payload[end] != ']') {
    end++;
  }
  return payload.substring(start, end);
}

String extractJsonString(const String &payload, const String &key) {
  return extractJsonValue(payload, key);
}

// ================= LED =================
void lightGreenLED() {
  digitalWrite(GREEN_LED_PIN, HIGH);
  digitalWrite(RED_LED_PIN, LOW);
  ledOnTime = millis();
  ledActive = true;
}

void lightRedLED() {
  digitalWrite(RED_LED_PIN, HIGH);
  digitalWrite(GREEN_LED_PIN, LOW);
  ledOnTime = millis();
  ledActive = true;
}

void handleLEDTimeout() {
  if (ledActive && millis() - ledOnTime >= LED_DURATION) {
    digitalWrite(RED_LED_PIN, LOW);
    digitalWrite(GREEN_LED_PIN, LOW);
    ledActive = false;
  }
}
