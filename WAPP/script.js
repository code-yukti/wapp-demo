// ── State ──────────────────────────────────────────────────────────
const S = {
  role: null, user: null, job: null, prev: null,
  type: 'farm', dur: 'instant', ctype: 'individual', lang: 'en', isFetchingLocation: false, isFetchingSignupLocation: false,
  postLocationPin: null,
  assigns: [],
  applicantView: null,
  appsReturnPage: null,
  rateJobId: null,
  rateTarget: null,
  offlineJoinType: 'upi',
  offlineWorkerQuery: '',
  mateScanTarget: null,
  browseQuery: '',
  browseFilters: {
    type: 'all',
    dur: 'all',
    maxDist: '',
    openOnly: false
  },
  dataReady: false
};

const OTP_LOGIN_BLOCKED = true;
const AVATAR_COLORS = ['#3F9AAE', '#79C9C5', '#FFE2AF', '#F96E5B'];
const OFFLINE_WORKER_STORAGE_KEY = 'wapp-offline-workers';
const AUTH_SESSION_STORAGE_KEY = 'wapp-auth-session';
const AUTH_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function clearStoredAuthSession() {
  try { localStorage.removeItem(AUTH_SESSION_STORAGE_KEY); } catch (e) {}
  try { sessionStorage.removeItem('wappRole'); } catch (e) {}
  try { sessionStorage.removeItem('wappUser'); } catch (e) {}
}

function persistAuthSession() {
  if (!S.role || !S.user) {
    clearStoredAuthSession();
    return;
  }
  const payload = {
    role: S.role,
    user: S.user,
    expiresAt: Date.now() + AUTH_SESSION_TTL_MS
  };
  try { localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(payload)); } catch (e) {}
  try { sessionStorage.setItem('wappRole', S.role); } catch (e) {}
  try { sessionStorage.setItem('wappUser', JSON.stringify(S.user)); } catch (e) {}
}

function readStoredAuthSession() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.role && parsed?.user && Number(parsed.expiresAt) > Date.now()) {
        return { role: parsed.role, user: parsed.user };
      }
      clearStoredAuthSession();
    }
  } catch (e) {
    clearStoredAuthSession();
  }

  try {
    const role = sessionStorage.getItem('wappRole');
    const user = sessionStorage.getItem('wappUser');
    if (role && user) {
      const parsedUser = JSON.parse(user);
      S.role = role;
      S.user = parsedUser;
      persistAuthSession();
      return { role, user: parsedUser };
    }
  } catch (e) {}

  return null;
}

// ── i18n ───────────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    'meta.title': 'Wapp – The Work Access Platform',
    'language.english': 'English',
    'language.hindi': 'Hindi',
    'language.bengali': 'Bengali',
    'language.changed': 'Language: {language}',
    'splash.subtitle': 'Find work near you',
    'role.subtitle': 'The Work Access Platform',
    'role.worker.title': 'I want work',
    'role.worker.desc': 'Find daily jobs & gigs near you',
    'role.employer.title': 'I need workers',
    'role.employer.desc': 'Post jobs & hire reliable locals',
    'role.mate.badge': 'Moderator',
    'role.mate.desc': 'Community moderator - secure wapp code access',
    'login.changeRole': 'Back to roles',
    'login.signIn': 'Sign In',
    'login.logIn': 'Log In',
    'login.sendOtp': 'Send OTP',
    'login.otpBlockedHint': 'OTP verification is temporarily blocked.',
    'login.createAccount': 'Create New Account',
    'login.demoMode': 'Hackathon demo mode',
    'login.demoLogin': 'Demo Login',
    'auth.asWorker': 'as Worker',
    'auth.asClient': 'as Client',
    'field.phoneNumber': 'Phone Number',
    'field.fullName': 'Full Name',
    'field.contactName': 'Contact Name',
    'field.organizationName': 'Organization Name',
    'field.email': 'Email Address',
    'field.location': 'Location',
    'field.primarySkill': 'Primary Skill',
    'field.hiringNeed': 'Hiring Need',
    'field.orgHiringNeed': 'Organization Hiring Need',
    'field.registration': 'GST / Registration ID',
    'field.password': 'Password',
    'field.jobTitle': 'Job Title',
    'field.jobType': 'Job Type',
    'field.duration': 'Duration',
    'field.timeDuration': 'Time Duration',
    'field.pay': 'Pay (Rs)',
    'field.workLocation': 'Work Location',
    'field.description': 'Description',
    'placeholder.phone': '+91 98765 43210',
    'placeholder.fullName': 'Enter your full name',
    'placeholder.organizationName': 'Enter org name',
    'placeholder.email': 'name@example.com',
    'placeholder.location': 'Area, city, state',
    'placeholder.primarySkill': 'Construction, delivery, farm work',
    'placeholder.hiringNeed': 'What kind of workers?',
    'placeholder.registration': 'Optional registration ID',
    'placeholder.password': 'Create a password',
    'placeholder.jobTitle': 'e.g. Farm helper needed',
    'placeholder.timeDuration': 'e.g. 9:00 AM - 5:00 PM or 4 hours',
    'placeholder.pay': '500',
    'placeholder.description': 'Describe the work, timing, requirements...',
    'otp.title': 'Enter OTP',
    'otp.verify': 'Verify OTP',
    'otp.changeNumber': 'Change number',
    'otp.sentToYourNumber': 'OTP sent to your number',
    'otp.sentToNumber': 'OTP sent to {phone}',
    'signup.backToLogin': 'Back to login',
    'signup.title': 'Create Account',
    'signup.clientType': 'Client Type',
    'signup.individual': 'Individual',
    'signup.organization': 'Organization',
    'signup.createAccount': 'Create Account',
    'signup.haveAccount': 'Already have an account?',
    'signup.loginHere': 'Login here',
    'signup.fetchLocation': 'Use Current',
    'signup.fetchingLocation': 'Locating...',
    'signup.locationHint': 'Tap the pin to fetch your current location or type it manually.',
    'signup.locationFilledHint': 'Location: {location}',
    'mate.access': 'wapp-mate Access',
    'mate.portal': 'Moderator Command Portal',
    'mate.secretCode': 'Secret Wapp Code',
    'mate.codeHint': '6-char code issued by your coordinator',
    'mate.verifyEnter': 'Verify & Enter',
    'mate.demoUseCode': 'Demo: use code',
    'mate.demoAsMate': 'Demo as Mate',
    'mate.brand': 'wapp-mate',
    'mate.hi': 'Hi,',
    'mate.commandTitle': 'Volunteer Command',
    'mate.online': 'ESP32-NFC online',
    'mate.assigned': 'Assigned',
    'mate.completed': 'Completed',
    'mate.incentives': 'Incentives',
    'mate.assignDesk': 'NFC Assign Desk',
    'mate.assignHelp': "Select an open job and tap a worker's NFC card to assign them.",
    'mate.selectJob': 'Select Job to Assign',
    'mate.selectJobOption': 'Select a job',
    'mate.activeChain': 'Active Volunteer Chain',
    'mate.selectAbove': 'Select a job above',
    'mate.workersTap': 'Workers - Tap NFC',
    'mate.tapAssign': 'Tap & Assign',
    'mate.reading': 'Reading',
    'mate.assignedLabel': 'Assigned',
    'mate.noAssignmentsYet': 'No assignments yet',
    'mate.noAssignmentsHint': "Pick a job and tap a worker's NFC",
    'mate.workerLabel': 'Worker',
    'mate.active': 'Active',
    'mate.done': 'Done',
    'mate.nfcAssigned': 'NFC assigned',
    'mate.verifyInApp': 'Verify in app',
    'mate.confirmDone': 'Confirm done',
    'mate.payoutPending': 'Worker payout Rs{payout} - Incentive Rs20 pending',
    'payment.incentiveProgram': 'Incentive Program',
    'payment.volunteersEarn': 'Volunteers earn incentives for community service',
    'payment.earned': 'Earned',
    'payment.pending': 'Pending',
    'payment.perJob': 'Per Job',
    'payment.recentIncentives': 'Recent Incentives',
    'payment.history': 'Payment History',
    'payment.earningsHistory': 'Earnings History',
    'payment.upiApps': 'UPI Payment Apps',
    'mate.assignedViaNfc': '{name} assigned via NFC',
    'browse.greeting': 'Good day',
    'browse.title': 'Find Jobs',
    'browse.searchPlaceholder': 'Search jobs, skills...',
    'browse.jobsNear': 'Jobs near you',
    'myjobs.title': 'My Jobs',
    'myjobs.applied': 'Applied',
    'myjobs.saved': 'Saved',
    'myjobs.noApplications': 'No applications yet',
    'myjobs.noApplicationsHint': 'Browse jobs and apply',
    'myjobs.noSaved': 'No saved jobs',
    'myjobs.noSavedHint': 'Tap bookmark icon to save',
    'myjobs.rate': 'Rate',
    'employer.label': 'Employer',
    'employer.postedJobs': 'Your Posted Jobs',
    'employer.inProgress': 'In Progress',
    'post.title': 'Post a Job',
    'post.subtitle': 'Find workers near you',
    'post.postJob': 'Post Job',
    'post.fetchLocation': 'Use Current',
    'post.fetchingLocation': 'Locating...',
    'post.locationHint': 'Tap the pin to fetch your current location or type it manually.',
    'post.locationFilledHint': 'Job location: {location}',
    'post.fillTitleAndPay': 'Fill in title and pay',
    'post.jobPosted': 'Job posted!',
    'post.noDescription': 'No description.',
    'applicants.title': 'Applicants',
    'applicants.noApplicants': 'No applicants yet',
    'applicants.for': 'For: {title}',
    'applicants.hire': 'Hire',
    'applicants.viewProfile': 'View Profile',
    'applicants.hired': 'Hired',
    'applicants.cancelHire': 'Cancel Hire',
    'applicants.hireCanceled': 'Hiring canceled',
    'applicants.cancelWindow': 'Cancel available for {time}',
    'applicants.hireLocked': '{name} is selected for this job',
    'nav.browse': 'Browse',
    'nav.myJobs': 'My Jobs',
    'nav.profile': 'Profile',
    'nav.dashboard': 'Dashboard',
    'nav.postJob': 'Post Job',
    'nav.command': 'Command',
    'nav.payment': 'Payment',
    'job.empty': 'No jobs found',
    'job.emptyHint': 'Try a different search',
    'job.statusApplied': 'Applied',
    'job.statusOpen': 'Open',
    'job.about': 'About',
    'job.details': 'Details',
    'job.employer': 'Employer',
    'job.workLocation': 'Work Location',
    'job.locationShared': 'Exact job location shared by the employer',
    'job.viewMap': 'View on Map',
    'job.noLocation': 'Location not added by the employer',
    'job.appliedCount': '{count} applied',
    'job.jobsPosted': '12 jobs posted',
    'job.viewApplicants': 'View Applicants ({count})',
    'job.applyNow': 'Apply Now',
    'job.back': 'Back',
    'job.nfcAssign': 'NFC Assign',
    'job.unknown': 'Unknown',
    'job.selected': '{name} selected!',
    'job.appliedToast': 'Applied!',
    'job.markedComplete': 'Job marked complete!',
    'profile.account': 'Account',
    'profile.phone': 'Phone',
    'profile.location': 'Location',
    'profile.wappCode': 'Wapp Code',
    'profile.deviceId': 'Device ID',
    'profile.language': 'Language',
    'profile.darkMode': 'Dark Mode',
    'profile.logout': 'Logout',
    'profile.rating': 'rating',
    'profile.trustScore': 'Trust Score',
    'profile.jobsDone': 'Jobs Done',
    'common.back': 'Back',
    'common.cancel': 'Cancel',
    'common.worker': 'Worker',
    'common.employer': 'Employer',
    'common.volunteer': 'wapp-mate Volunteer',
    'common.justNow': 'just now',
    'jobType.farm': 'Farm',
    'jobType.shop': 'Shop',
    'jobType.home': 'Home',
    'jobType.construction': 'Build',
    'jobType.delivery': 'Delivery',
    'jobType.other': 'Other',
    'duration.instant': 'One-time',
    'duration.daily': 'Daily',
    'duration.weekly': 'Weekly',
    'duration.fullTime': 'Full-time',
    'rate.title': 'Rate this Job',
    'rate.placeholder': 'Share your experience (optional)...',
    'rate.submit': 'Submit Rating',
    'rate.pick': 'Pick a rating',
    'rate.submitted': 'Rating submitted!',
    'rate.rated': 'Rated',
    'rate.alreadySubmitted': 'You already rated this job',
    'rate.missingJob': 'Select a job to rate first',
    'rate.saveError': 'Could not save rating. Please try again.',
    'toast.enterValidPhone': 'Enter a valid phone number',
    'toast.enterOtp': 'Enter the 6-digit OTP',
    'toast.enterName': 'Enter your name',
    'toast.enterEmail': 'Enter your email',
    'toast.enterValidEmail': 'Enter a valid email address',
    'toast.emailAlreadyUsed': 'This email is already registered. Please login instead.',
    'toast.phoneAlreadyUsed': 'This phone number is already registered. Please login instead.',
    'toast.otpTemporarilyBlocked': 'OTP verification is temporarily blocked',
    'toast.addLocation': 'Add your location',
    'toast.locationFetched': 'Current location added',
    'toast.locationPermissionDenied': 'Allow location access to fill the work location',
    'toast.locationUnavailable': 'Could not fetch your current location',
    'toast.locationUnsupported': 'This device does not support location access',
    'toast.passwordShort': 'Password must be 6 to 8 characters',
    'toast.accountCreated': 'Account created!',
    'toast.invalidCode': 'Invalid code',
    'toast.welcome': 'Welcome, {name}!',
    // dynamic data translations (job titles, descriptions, ago, worker fields)
    'data.Farm helper needed': 'Farm helper needed',
    'data.Shop assistant – Kirana': 'Shop assistant – Kirana',
    'data.House cleaning (3BHK)': 'House cleaning (3BHK)',
    'data.Delivery rider needed': 'Delivery rider needed',
    'data.Construction labor': 'Construction labor',
    'data.Need 2 workers for harvesting wheat. Morning shift 6am–2pm. Meals provided.': 'Need 2 workers for harvesting wheat. Morning shift 6am–2pm. Meals provided.',
    'data.Help at grocery store. Stocking shelves, billing assistance. 8am to 5pm.': 'Help at grocery store. Stocking shelves, billing assistance. 8am to 5pm.',
    'data.Deep cleaning of 3BHK flat. One-time job. All supplies provided.': 'Deep cleaning of 3BHK flat. One-time job. All supplies provided.',
    'data.Parcel delivery in local area. Own bicycle/bike needed. Rs800/day + fuel.': 'Parcel delivery in local area. Own bicycle/bike needed. Rs800/day + fuel.',
    'data.Brick laying work at new building site. Experience preferred. Safety gear provided.': 'Brick laying work at new building site. Experience preferred. Safety gear provided.',
    'data.Need 2 workers for harvesting.': 'Need 2 workers for harvesting.',
    'data.Local delivery work.': 'Local delivery work.',
    'data.1h ago': '1h ago',
    'data.2h ago': '2h ago',
    'data.30m ago': '30m ago',
    'data.1.5h ago': '1.5h ago',
    'data.3h ago': '3h ago',
    'data.1d ago': '1d ago',
    'data.just now': 'just now',
    'data.Farm - Construction': 'Farm - Construction',
    'data.Home - Shop': 'Home - Shop',
    'data.Delivery - Other': 'Delivery - Other',
    'data.Home - Farm': 'Home - Farm',
    'data.Available now': 'Available now',
    'data.Busy till 2pm': 'Busy till 2pm',
  },
  hi: {
  'meta.title': 'Wapp – The Work Access Platform',
  'language.english': 'अंग्रेज़ी',
  'language.hindi': 'हिंदी',
  'language.bengali': 'বাংলা',
  'language.changed': 'भाषा: {language}',
  'splash.subtitle': 'अपने पास काम ढूंढो',
  'role.subtitle': 'The Work Access Platform',
  'role.worker.title': 'मुझे काम चाहिए',
  'role.worker.desc': 'रोज़ के जॉब और गिग्स पास में ढूंढो',
  'role.employer.title': 'मुझे वर्कर्स चाहिए',
  'role.employer.desc': 'जॉब पोस्ट करो और भरोसेमंद लोकल लोगों को हायर करो',
  'role.mate.badge': 'स्वयंसेवक',
  'role.mate.desc': 'कम्युनिटी स्वयंसेवक - सुरक्षित वप्प कोड एक्सेस',

  'login.changeRole': 'रोल पर वापस',
  'login.signIn': 'साइन इन',
  'login.logIn': 'लॉग इन',
  'login.sendOtp': 'OTP भेजो',
  'login.otpBlockedHint': 'OTP वेरिफिकेशन अभी अस्थायी रूप से ब्लॉक है।',
  'login.createAccount': 'नया अकाउंट बनाओ',
  'login.demoMode': 'हैकाथॉन डेमो मोड',
  'login.demoLogin': 'डेमो लॉगिन',

  'auth.asWorker': 'वर्कर के रूप में',
  'auth.asClient': 'क्लाइंट के रूप में',

  'field.phoneNumber': 'फोन नंबर',
  'field.fullName': 'पूरा नाम',
  'field.contactName': 'संपर्क नाम',
  'field.organizationName': 'संगठन का नाम',
  'field.email': 'ईमेल पता',
  'field.location': 'लोकेशन',
  'field.primarySkill': 'प्राथमिक कौशल',
  'field.hiringNeed': 'भर्ती की ज़रूरत',
  'field.orgHiringNeed': 'संगठन की भर्ती ज़रूरत',
  'field.registration': 'GST / रजिस्ट्रेशन ID',
  'field.password': 'पासवर्ड',

  'field.jobTitle': 'जॉब शीर्षक',
  'field.jobType': 'जॉब प्रकार',
  'field.duration': 'अवधि',
  'field.timeDuration': 'समय अवधि',
  'field.pay': 'भुगतान (रु)',
  'field.workLocation': 'काम की लोकेशन',
  'field.description': 'विवरण',

  'placeholder.phone': '+91 98765 43210',
  'placeholder.fullName': 'अपना पूरा नाम लिखें',
  'placeholder.organizationName': 'संगठन का नाम लिखें',
  'placeholder.email': 'name@example.com',
  'placeholder.location': 'क्षेत्र, शहर, राज्य',
  'placeholder.primarySkill': 'कंस्ट्रक्शन, डिलीवरी, खेती',
  'placeholder.hiringNeed': 'किस तरह के वर्कर्स चाहिए?',
  'placeholder.registration': 'वैकल्पिक रजिस्ट्रेशन ID',
  'placeholder.password': 'पासवर्ड बनाएं',
  'placeholder.jobTitle': 'जैसे: फार्म हेल्पर चाहिए',
  'placeholder.timeDuration': 'जैसे 9:00 AM - 5:00 PM या 4 घंटे',
  'placeholder.pay': '500',
  'placeholder.description': 'काम, समय और आवश्यकताएँ लिखें...',

  'otp.title': 'OTP दर्ज करें',
  'otp.verify': 'OTP वेरिफाई करें',
  'otp.changeNumber': 'नंबर बदलें',
  'otp.sentToYourNumber': 'OTP आपके नंबर पर भेजा गया है',
  'otp.sentToNumber': 'OTP {phone} पर भेजा गया है',

  'signup.backToLogin': 'लॉगिन पर वापस',
  'signup.title': 'अकाउंट बनाएं',
  'signup.clientType': 'क्लाइंट प्रकार',
  'signup.individual': 'व्यक्तिगत',
  'signup.organization': 'संगठन',
  'signup.createAccount': 'अकाउंट बनाएं',
  'signup.haveAccount': 'क्या आपका अकाउंट पहले से है?',
  'signup.loginHere': 'यहाँ लॉगिन करें',

  'browse.title': 'जॉब्स ढूंढो',
  'browse.searchPlaceholder': 'जॉब्स, स्किल्स खोजें...',
  'browse.jobsNear': 'आपके पास के जॉब्स',

  'myjobs.title': 'मेरे काम',
  'myjobs.applied': 'अप्लाइड',
  'myjobs.saved': 'सेव्ड',

  'nav.browse': 'ब्राउज़',
  'nav.myJobs': 'मेरे काम',
  'nav.profile': 'प्रोफाइल',
  'nav.dashboard': 'डैशबोर्ड',
  'nav.postJob': 'जॉब पोस्ट करें',

  'post.title': 'जॉब पोस्ट करें',
  'post.subtitle': 'पास के वर्कर्स ढूंढो',
  'post.postJob': 'जॉब पोस्ट करें',

  'job.empty': 'कोई जॉब नहीं मिला',
  'job.emptyHint': 'कुछ और खोज कर देखें',
  'job.applyNow': 'अभी आवेदन करें',
  'applicants.title': 'आवेदक',
  'applicants.noApplicants': 'अभी कोई आवेदक नहीं है',
  'applicants.for': 'जॉब: {title}',
  'applicants.hire': 'हायर करें',
  'applicants.viewProfile': 'प्रोफाइल देखें',
  'applicants.hired': 'हायर किया गया',
  'applicants.cancelHire': 'हायरिंग रद्द करें',
  'applicants.hireCanceled': 'हायरिंग रद्द की गई',
  'applicants.cancelWindow': '{time} तक रद्द कर सकते हैं',
  'applicants.hireLocked': '{name} इस जॉब के लिए चुना गया है',

  'profile.account': 'अकाउंट',
  'profile.phone': 'फोन',
  'profile.location': 'लोकेशन',
  'profile.language': 'भाषा',
  'profile.logout': 'लॉगआउट',

  'common.back': 'वापस',
  'common.cancel': 'रद्द करें',
  'common.worker': 'वर्कर',
  'common.employer': 'एम्प्लॉयर',

  'toast.enterValidPhone': 'सही फोन नंबर दें',
  'toast.enterOtp': '6 अंकों का OTP दें',
  'toast.enterName': 'अपना नाम दें',
  'toast.enterEmail': 'अपना ईमेल दें',
  'toast.enterValidEmail': 'सही ईमेल पता दें',
  'toast.emailAlreadyUsed': 'यह ईमेल पहले से रजिस्टर्ड है। कृपया लॉगिन करें।',
  'toast.phoneAlreadyUsed': 'यह फोन नंबर पहले से रजिस्टर्ड है। कृपया लॉगिन करें।',
  'toast.accountCreated': 'अकाउंट बन गया!',
  'toast.welcome': 'स्वागत है, {name}!',
  'rate.title': 'इस जॉब को रेट करें',
  'rate.placeholder': 'अपना अनुभव साझा करें (वैकल्पिक)...',
  'rate.pick': 'एक रेटिंग चुनें',
  'rate.submitted': 'रेटिंग सबमिट हो गई!',
  'rate.rated': 'रेट किया गया',
  'rate.alreadySubmitted': 'आप इस जॉब को पहले ही रेट कर चुके हैं',
  'rate.missingJob': 'पहले रेट करने के लिए जॉब चुनें',
  'rate.saveError': 'रेटिंग सेव नहीं हो सकी। फिर से कोशिश करें।',

  // dynamic
  'data.Farm helper needed': 'खेती के लिए हेल्पर चाहिए',
  'data.Shop assistant – Kirana': 'किराना दुकान सहायक',
  'data.House cleaning (3BHK)': 'घर की सफाई (3BHK)',
  'data.Delivery rider needed': 'डिलीवरी राइडर चाहिए',
  'data.Construction labor': 'निर्माण मजदूर',
},
  bn: {
  'meta.title': 'Wapp – The Work Access Platform',
  'language.english': 'ইংরেজি',
  'language.hindi': 'হিন্দি',
  'language.bengali': 'বাংলা',
  'language.changed': 'ভাষা: {language}',

  'splash.subtitle': 'The Work Access Platform',
  'role.subtitle': 'দ্য ওয়ার্ক অ্যাপ',

  'role.worker.title': 'আমি কাজ চাই',
  'role.worker.desc': 'দৈনিক জব ও গিগ কাছাকাছি খুঁজুন',
  'role.employer.title': 'আমার কর্মী দরকার',
  'role.employer.desc': 'জব পোস্ট করুন এবং বিশ্বস্ত স্থানীয়দের নিয়োগ করুন',

  'role.mate.badge': 'স্বেচ্ছাসেবক',
  'role.mate.desc': 'কমিউনিটি স্বেচ্ছাসেবক - নিরাপদ ওয়াপ কোড অ্যাক্সেস',

  'login.changeRole': 'রোলে ফিরে যান',
  'login.signIn': 'সাইন ইন',
  'login.logIn': 'লগ ইন',
  'login.sendOtp': 'OTP পাঠান',
  'login.otpBlockedHint': 'OTP যাচাইকরণ বর্তমানে সাময়িকভাবে বন্ধ আছে।',
  'login.createAccount': 'নতুন অ্যাকাউন্ট খুলুন',
  'login.demoMode': 'হ্যাকাথন ডেমো মোড',
  'login.demoLogin': 'ডেমো লগইন',

  'auth.asWorker': 'কর্মী হিসেবে',
  'auth.asClient': 'ক্লায়েন্ট হিসেবে',

  'field.phoneNumber': 'ফোন নম্বর',
  'field.fullName': 'পূর্ণ নাম',
  'field.contactName': 'যোগাযোগের নাম',
  'field.organizationName': 'সংস্থার নাম',
  'field.email': 'ইমেইল ঠিকানা',
  'field.location': 'লোকেশন',
  'field.primarySkill': 'প্রাথমিক দক্ষতা',
  'field.hiringNeed': 'নিয়োগের প্রয়োজন',
  'field.orgHiringNeed': 'সংস্থার নিয়োগ প্রয়োজন',
  'field.registration': 'GST / রেজিস্ট্রেশন আইডি',
  'field.password': 'পাসওয়ার্ড',

  'field.jobTitle': 'জব শিরোনাম',
  'field.jobType': 'জবের ধরন',
  'field.duration': 'সময়কাল',
  'field.timeDuration': 'সময়ের পরিধি',
  'field.pay': 'পারিশ্রমিক (৳)',
  'field.workLocation': 'কাজের লোকেশন',
  'field.description': 'বিবরণ',

  'placeholder.fullName': 'আপনার পূর্ণ নাম লিখুন',
  'placeholder.organizationName': 'সংস্থার নাম লিখুন',
  'placeholder.location': 'এলাকা, শহর, রাজ্য',
  'placeholder.primarySkill': 'নির্মাণ, ডেলিভারি, কৃষিকাজ',
  'placeholder.hiringNeed': 'কেমন কর্মী দরকার?',
  'placeholder.password': 'পাসওয়ার্ড তৈরি করুন',
  'placeholder.jobTitle': 'যেমন: ফার্ম হেল্পার দরকার',
  'placeholder.timeDuration': 'যেমন ৯:০০ AM - ৫:০০ PM বা ৪ ঘণ্টা',
  'placeholder.description': 'কাজ, সময় এবং প্রয়োজনীয়তা লিখুন...',

  'otp.title': 'OTP দিন',
  'otp.verify': 'OTP যাচাই করুন',
  'otp.changeNumber': 'নম্বর পরিবর্তন করুন',
  'otp.sentToYourNumber': 'আপনার নম্বরে OTP পাঠানো হয়েছে',
  'otp.sentToNumber': '{phone} নম্বরে OTP পাঠানো হয়েছে',

  'signup.title': 'অ্যাকাউন্ট খুলুন',
  'signup.clientType': 'ক্লায়েন্টের ধরন',
  'signup.individual': 'ব্যক্তিগত',
  'signup.organization': 'সংস্থা',
  'signup.createAccount': 'অ্যাকাউন্ট খুলুন',
  'signup.haveAccount': 'আপনার কি আগে থেকেই অ্যাকাউন্ট আছে?',
  'signup.loginHere': 'এখানে লগইন করুন',

  'browse.title': 'জব খুঁজুন',
  'browse.searchPlaceholder': 'জব, স্কিল সার্চ করুন...',
  'browse.jobsNear': 'আপনার কাছাকাছি জব',

  'myjobs.title': 'আমার কাজ',
  'myjobs.applied': 'আবেদন করা হয়েছে',
  'myjobs.saved': 'সংরক্ষিত',

  'nav.browse': 'ব্রাউজ',
  'nav.myJobs': 'আমার কাজ',
  'nav.profile': 'প্রোফাইল',
  'nav.dashboard': 'ড্যাশবোর্ড',
  'nav.postJob': 'জব পোস্ট করুন',

  'post.title': 'জব পোস্ট করুন',
  'post.subtitle': 'কাছাকাছি কর্মী খুঁজুন',
  'post.postJob': 'জব পোস্ট করুন',

  'job.empty': 'কোনো জব পাওয়া যায়নি',
  'job.emptyHint': 'অন্য কিছু খুঁজে দেখুন',
  'job.applyNow': 'এখনই আবেদন করুন',
  'applicants.title': 'আবেদনকারী',
  'applicants.noApplicants': 'এখনও কোনো আবেদনকারী নেই',
  'applicants.for': 'কাজ: {title}',
  'applicants.hire': 'নিয়োগ করুন',
  'applicants.viewProfile': 'প্রোফাইল দেখুন',
  'applicants.hired': 'নিয়োগ হয়েছে',
  'applicants.cancelHire': 'নিয়োগ বাতিল করুন',
  'applicants.hireCanceled': 'নিয়োগ বাতিল হয়েছে',
  'applicants.cancelWindow': '{time} পর্যন্ত বাতিল করা যাবে',
  'applicants.hireLocked': '{name} এই কাজের জন্য নির্বাচিত',
  'rate.title': 'এই কাজটি রেট করুন',
  'rate.placeholder': 'আপনার অভিজ্ঞতা লিখুন (ঐচ্ছিক)...',
  'rate.pick': 'একটি রেটিং বাছুন',
  'rate.submitted': 'রেটিং জমা হয়েছে!',
  'rate.rated': 'রেট করা হয়েছে',
  'rate.alreadySubmitted': 'আপনি এই কাজটি আগেই রেট করেছেন',
  'rate.missingJob': 'রেট করার জন্য আগে একটি কাজ বেছে নিন',
  'rate.saveError': 'রেটিং সেভ করা যায়নি। আবার চেষ্টা করুন।',

  'profile.account': 'অ্যাকাউন্ট',
  'profile.phone': 'ফোন',
  'profile.location': 'লোকেশন',
  'profile.language': 'ভাষা',
  'profile.logout': 'লগআউট',

  'common.back': 'ফিরে যান',
  'common.cancel': 'বাতিল করুন',
  'common.worker': 'কর্মী',
  'common.employer': 'নিয়োগকর্তা',

  'toast.enterValidPhone': 'সঠিক ফোন নম্বর দিন',
  'toast.enterOtp': '৬ সংখ্যার OTP দিন',
  'toast.enterName': 'আপনার নাম দিন',
  'toast.enterEmail': 'আপনার ইমেইল দিন',
  'toast.enterValidEmail': 'সঠিক ইমেইল ঠিকানা দিন',
  'toast.emailAlreadyUsed': 'এই ইমেইল আগে থেকেই রেজিস্টার করা আছে। অনুগ্রহ করে লগইন করুন।',
  'toast.phoneAlreadyUsed': 'এই ফোন নম্বর আগে থেকেই রেজিস্টার করা আছে। অনুগ্রহ করে লগইন করুন।',
  'toast.accountCreated': 'অ্যাকাউন্ট তৈরি হয়েছে!',
  'toast.welcome': 'স্বাগতম, {name}!',

  // dynamic
  'data.Farm helper needed': 'খামারের জন্য সহকারী দরকার',
  'data.Shop assistant – Kirana': 'কিরানা দোকানের সহকারী',
  'data.House cleaning (3BHK)': 'বাড়ি পরিষ্কার (৩BHK)',
  'data.Delivery rider needed': 'ডেলিভারি রাইডার দরকার',
  'data.Construction labor': 'নির্মাণ শ্রমিক',
}
};

const RUNTIME_LOCALE_TEXT = {
  hi: {
    'nav.payment': 'पेमेंट',
    'payment.roleWorker': 'कर्मी',
    'payment.roleEmployer': 'नियोक्ता',
    'payment.titleEarnings': 'कमाई',
    'payment.totalEarned': 'कुल कमाई',
    'payment.nextPayout': 'अगला भुगतान: जॉब पूरा होने के 24 घंटे के भीतर',
    'payment.paidOut': 'भुगतान किया गया',
    'payment.jobsDone': 'काम पूरे',
    'payment.tabBankAccount': 'बैंक खाता',
    'payment.receiveUpi': 'UPI के जरिए प्राप्त करें',
    'payment.upiTransferDesc': 'जॉब पूरा होने के बाद आपकी UPI ID पर कमाई भेजी जाती है।',
    'payment.savedUpiId': 'सेव की गई UPI ID',
    'payment.yourUpiId': 'आपकी UPI ID',
    'payment.saveUpiId': 'UPI ID सेव करें',
    'payment.supportedUpiApps': 'समर्थित UPI ऐप्स',
    'payment.receiveBank': 'बैंक ट्रांसफर से प्राप्त करें',
    'payment.bankNfcHint': 'जिन कर्मियों के पास स्मार्टफोन नहीं है — उनका NFC कार्ड इस बैंक खाते से लिंक है।',
    'payment.accountHolderName': 'खाताधारक का नाम',
    'payment.accountNumber': 'खाता संख्या',
    'payment.confirmAccountNumber': 'खाता संख्या की पुष्टि करें',
    'payment.ifscCode': 'IFSC कोड',
    'payment.bankName': 'बैंक का नाम',
    'payment.placeholderAsPerBank': 'बैंक रिकॉर्ड के अनुसार',
    'payment.placeholderEnterAccount': 'खाता संख्या दर्ज करें',
    'payment.placeholderReEnterAccount': 'खाता संख्या फिर से दर्ज करें',
    'payment.placeholderIfsc': 'जैसे SBIN0001234',
    'payment.placeholderBankName': 'जैसे भारतीय स्टेट बैंक',
    'payment.saveBankAccount': 'बैंक खाता सेव करें',
    'payment.earningsHistoryHeading': 'कमाई का इतिहास',
    'payment.noEarningsYet': 'अभी कोई कमाई नहीं',
    'payment.processedHint': 'पेमेंट जॉब पूरा होने के 24–48 घंटे के भीतर आपकी सेव की गई UPI या बैंक खाते में प्रोसेस होता है।'
  },
  bn: {
    'nav.payment': 'পেমেন্ট',
    'payment.roleWorker': 'কর্মী',
    'payment.roleEmployer': 'নিয়োগকর্তা',
    'payment.titleEarnings': 'আয়',
    'payment.totalEarned': 'মোট আয়',
    'payment.nextPayout': 'পরবর্তী পেমেন্ট: কাজ শেষের ২৪ ঘণ্টার মধ্যে',
    'payment.paidOut': 'পরিশোধ হয়েছে',
    'payment.jobsDone': 'কাজ সম্পন্ন',
    'payment.tabBankAccount': 'ব্যাংক অ্যাকাউন্ট',
    'payment.receiveUpi': 'UPI এর মাধ্যমে গ্রহণ করুন',
    'payment.upiTransferDesc': 'কাজ শেষ হলে আপনার UPI ID তে আয় পাঠানো হয়।',
    'payment.savedUpiId': 'সেভ করা UPI ID',
    'payment.yourUpiId': 'আপনার UPI ID',
    'payment.saveUpiId': 'UPI ID সেভ করুন',
    'payment.supportedUpiApps': 'সমর্থিত UPI অ্যাপ',
    'payment.receiveBank': 'ব্যাংক ট্রান্সফারে গ্রহণ করুন',
    'payment.bankNfcHint': 'যাদের স্মার্টফোন নেই — তাদের NFC কার্ড এই ব্যাংক অ্যাকাউন্টের সাথে লিঙ্ক করা থাকে।',
    'payment.accountHolderName': 'অ্যাকাউন্ট হোল্ডারের নাম',
    'payment.accountNumber': 'অ্যাকাউন্ট নম্বর',
    'payment.confirmAccountNumber': 'অ্যাকাউন্ট নম্বর নিশ্চিত করুন',
    'payment.ifscCode': 'IFSC কোড',
    'payment.bankName': 'ব্যাংকের নাম',
    'payment.placeholderAsPerBank': 'ব্যাংক রেকর্ড অনুযায়ী',
    'payment.placeholderEnterAccount': 'অ্যাকাউন্ট নম্বর লিখুন',
    'payment.placeholderReEnterAccount': 'আবার অ্যাকাউন্ট নম্বর লিখুন',
    'payment.placeholderIfsc': 'যেমন SBIN0001234',
    'payment.placeholderBankName': 'যেমন স্টেট ব্যাংক অফ ইন্ডিয়া',
    'payment.saveBankAccount': 'ব্যাংক অ্যাকাউন্ট সেভ করুন',
    'payment.earningsHistoryHeading': 'আয়ের ইতিহাস',
    'payment.noEarningsYet': 'এখনও কোনো আয় নেই',
    'payment.processedHint': 'কাজ শেষের ২৪–৪৮ ঘণ্টার মধ্যে আপনার সেভ করা UPI বা ব্যাংক অ্যাকাউন্টে পেমেন্ট পাঠানো হয়।'
  }
};

function lt(key, fallback) {
  return (RUNTIME_LOCALE_TEXT[S.lang] && RUNTIME_LOCALE_TEXT[S.lang][key]) || fallback;
}

// ── Translation helpers ─────────────────────────────────────────────
function t(key, vars = {}) {
  const pack = TRANSLATIONS[S.lang] || TRANSLATIONS.en;
  const fallback = TRANSLATIONS.en;
  let text = pack[key] || fallback[key] || key;
  return text.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? '');
}

// Translate dynamic data strings (job titles, descriptions, worker fields, ago)
// Normalises unicode dash variants then looks up in the data.* namespace
function td(raw) {
  const norm = String(raw ?? '')
    .replace(/[\u2013\u2014\u00e2\u20ac\u201c\u201d]/g, '-')
    .replace(/\u20b9|Rs/g, 'Rs')
    .replace(/\s+/g, ' ')
    .trim();
  const key = 'data.' + norm;
  const pack = TRANSLATIONS[S.lang] || TRANSLATIONS.en;
  const fallback = TRANSLATIONS.en;
  if (Object.prototype.hasOwnProperty.call(pack, key)) return pack[key];
  if (Object.prototype.hasOwnProperty.call(fallback, key)) return fallback[key];
  return norm;
}

function getDurationLabel(duration) {
  return duration ? t('duration.' + duration) : '';
}

function formatPay(pay, duration) {
  const dl = getDurationLabel(duration);
  return dl ? `Rs${pay} / ${dl}` : `Rs${pay}`;
}

function getJobTitle(job)        { return td(job?.title || ''); }
function getJobDescription(job)  { return td(job?.desc  || ''); }
function getJobAgo(job)          { return td(job?.ago   || ''); }
function getJobTime(job)         { return td(job?.time  || ''); }
function getJobLocation(job)     { return td(job?.loc   || ''); }
function getWorkerSkill(worker)  { return td(worker?.skill || ''); }
function getWorkerAvailability(w){ return td(w?.avail   || ''); }
function getJobPin(job) {
  const lat = Number(job?.pin?.lat);
  const lon = Number(job?.pin?.lon);
  if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
  return null;
}
function isLatLngLocation(value) {
  return /^-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?$/.test(String(value || '').trim());
}
function buildJobMapUrl(job) {
  const pin = getJobPin(job);
  if (pin) {
    return `https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lon}`;
  }
  const location = String(getJobLocation(job) || '').trim();
  if (!location) return '';
  if (/^https?:\/\//i.test(location)) return location;
  if (isLatLngLocation(location)) {
    return `https://www.google.com/maps?q=${encodeURIComponent(location)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}
function openJobLocationMap(jobId) {
  const job = [...JOBS, ...EJOBS].find(x => x.id === jobId);
  const location = getJobLocation(job);
  const mapUrl = buildJobMapUrl(job);
  if (!location || !mapUrl) {
    toast(t('job.noLocation'));
    return;
  }
  window.open(mapUrl, '_blank', 'noopener,noreferrer');
}

// ── Runtime Data ───────────────────────────────────────────────────
let JOBS = [];
let EJOBS = [];
let WORKERS = [];
let RATINGS = [];
let PROFILES = [];
const RATING_STORAGE_KEY = 'wapp-local-ratings';
const MATE_DEVICE_ID = 'WMD001';

function createEmptyUser(role, overrides = {}) {
  const isMate = role === 'mate';
  const isEmployer = role === 'employer';
  const name = isMate ? 'Volunteer' : isEmployer ? 'Employer' : 'Worker';
  const loc = '';
  return {
    role,
    name,
    phone: '',
    jobs: 0,
    rating: 0,
    score: 0,
    av: name.charAt(0),
    loc,
    code: '',
    device: isMate ? MATE_DEVICE_ID : '',
    ...overrides
  };
}

let USERS = {
  worker: createEmptyUser('worker'),
  employer: createEmptyUser('employer'),
  mate: createEmptyUser('mate')
};

let OFFLINE_WORKERS = loadStoredOfflineWorkers();
purgePlaceholderOfflineWorkers();

const CODES = [];
const ICONS = { farm:'<i class="bi bi-tree"></i>', shop:'<i class="bi bi-shop"></i>', home:'<i class="bi bi-house-door"></i>', construction:'<i class="bi bi-hammer"></i>', delivery:'<i class="bi bi-box-seam"></i>', other:'<i class="bi bi-briefcase"></i>' };

const BACKEND = window.WappBackend || {
  enabled: false,
  async loadSnapshot() { return null; },
  async upsertProfile() { return null; },
  async saveJob() { return null; },
  async deleteJob() { return false; },
  async saveApplication() { return null; },
  async saveAssignment() { return null; },
  async updateAssignmentStatus() { return null; },
  async saveRating() { return null; },
  async savePaymentMethod() { return null; },
  async saveOfflineWorker() { return null; },
  async clearPaymentMethod() { return null; },
  async loadProfileByPhone() { return null; },
  async loadProfileByEmail() { return null; }
};

const MATE_SCAN_TIMEOUT_MS = 60000;
const MATE_SCAN_POLL_MS = 1500;
let mateScanTimer = null;
let mateScanRequestId = null;
let mateScanState = 'idle';
let mateScanResult = {
  uid: '',
  wappId: '',
  name: '',
  access: '',
  job: '',
  time: '',
  registered: false
};

function mergeUserProfile(base, incoming) {
  if (!incoming) return base;
  return {
    ...(base || {}),
    ...incoming,
    av: incoming.av || base?.av || (incoming.name ? incoming.name.charAt(0) : '?')
  };
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value) {
  return normalizePhoneInput(value || '');
}

function getAvatarSeed(profile = {}) {
  if (typeof profile === 'string') return profile.trim() || 'WAPP';
  const parts = [profile.phone, profile.email, profile.name, profile.code, profile.role]
    .map(value => String(value || '').trim())
    .filter(Boolean);
  return parts.length ? parts.join('|') : 'WAPP';
}

function getAvatarPalette(seed) {
  let hash = 0;
  const text = String(seed || 'WAPP');
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash) + text.charCodeAt(i);
  const fill = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  const luminance = (() => {
    const hex = fill.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const srgb = [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  })();
  return {
    c1: fill,
    c2: fill,
    c3: fill,
    c4: fill,
    text: luminance > 0.62 ? '#0f172a' : '#ffffff'
  };
}

function applyAvatarPalette(el, profileOrSeed) {
  if (!el) return null;
  const pal = getAvatarPalette(getAvatarSeed(profileOrSeed));
  el.style.setProperty('--avatar-c1', pal.c1);
  el.style.setProperty('--avatar-c2', pal.c2);
  el.style.setProperty('--avatar-c3', pal.c3);
  el.style.setProperty('--avatar-c4', pal.c4);
  el.style.color = pal.text;
  return pal;
}

function getAvatarStyle(profileOrSeed) {
  const pal = getAvatarPalette(getAvatarSeed(profileOrSeed));
  return `--avatar-c1:${pal.c1};--avatar-c2:${pal.c2};--avatar-c3:${pal.c3};--avatar-c4:${pal.c4};color:${pal.text};`;
}

function getKnownProfileByPhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return PROFILES.find(profile => normalizePhone(profile.phone) === normalized)
    || Object.values(USERS).find(profile => normalizePhone(profile.phone) === normalized)
    || null;
}

function getKnownProfileByName(name, role = '') {
  const normalizedName = normalizeName(name);
  if (!normalizedName) return null;
  return PROFILES.find(profile =>
    normalizeName(profile.name) === normalizedName &&
    (!role || profile.role === role)
  ) || Object.values(USERS).find(profile =>
    normalizeName(profile.name) === normalizedName &&
    (!role || profile.role === role)
  ) || WORKERS.find(profile =>
    normalizeName(profile.name) === normalizedName &&
    (!role || profile.role === role)
  ) || null;
}

function upsertKnownProfile(profile) {
  if (!profile?.phone) return;
  const normalized = normalizePhone(profile.phone);
  const index = PROFILES.findIndex(item => normalizePhone(item.phone) === normalized);
  if (index >= 0) PROFILES[index] = mergeUserProfile(PROFILES[index], profile);
  else PROFILES.push(profile);
  const role = profile.role;
  if (role && USERS[role]) USERS[role] = mergeUserProfile(USERS[role], profile);
  if (S.user?.phone && normalizePhone(S.user.phone) === normalized) {
    S.user = mergeUserProfile(S.user, profile);
    persistAuthSession();
  }
  refreshWorkerRoster();
}

function normalizeWorkerCode(value) {
  return String(value || '').trim().replace(/\s+/g, '').toUpperCase();
}

function buildOfflineWorkerCode(seed = '') {
  const cleanSeed = String(seed || 'WAPP').replace(/[^a-z0-9]/ig, '').toUpperCase().slice(0, 4) || 'WAPP';
  const stamp = `${Date.now().toString(36).toUpperCase().slice(-4)}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  return `OW-${cleanSeed}-${stamp}`;
}

function normalizeWorkerRecord(worker = {}, index = 0, offline = false) {
  if (!worker) return null;
  const name = String(worker.name || '').trim();
  if (!name) return null;
  const workerCode = normalizeWorkerCode(
    worker.workerCode ||
    worker.code ||
    worker.nfc ||
    (worker.phone ? `W-${String(worker.phone).replace(/\D/g, '').slice(-4)}` : '') ||
    buildOfflineWorkerCode(name)
  );
  const now = worker.createdAt || worker.created_at || new Date().toISOString();
  const bankAccount = worker.bankAccount || worker.bank_account || null;
  return {
    id: String(worker.id || workerCode || `worker-${index}`),
    workerCode,
    code: workerCode,
    role: 'worker',
    offline: Boolean(offline || worker.offline),
    name,
    phone: String(worker.phone || '').trim(),
    email: String(worker.email || '').trim(),
    loc: String(worker.loc || worker.location || 'Nearby area').trim() || 'Nearby area',
    av: String(worker.av || name.charAt(0).toUpperCase() || '?'),
    jobs: Number.isFinite(Number(worker.jobs ?? worker.jobs_done)) ? Number(worker.jobs ?? worker.jobs_done) : 0,
    rating: Number.isFinite(Number(worker.rating)) ? Number(worker.rating) : 0,
    score: Number.isFinite(Number(worker.score)) ? Number(worker.score) : 0,
    ctype: worker.ctype || 'individual',
    organizationName: worker.organizationName || worker.organization_name || '',
    skill: String(worker.skill || worker.primary_skill || worker.primarySkill || 'General work').trim() || 'General work',
    need: String(worker.need || '').trim(),
    reg: String(worker.reg || '').trim(),
    device: String(worker.device || '').trim(),
    upiId: String(worker.upiId || worker.upi_id || '').trim(),
    bankAccount,
    matePayout: worker.matePayout || null,
    availability: String(worker.avail || worker.availability || 'Available').trim() || 'Available',
    payoutMethod: String(worker.payoutMethod || worker.payout_method || (worker.upiId || worker.upi_id ? 'upi' : bankAccount ? 'bank' : 'upi')).trim().toLowerCase(),
    notes: String(worker.notes || '').trim(),
    createdBy: String(worker.createdBy || worker.created_by || '').trim(),
    createdAt: now,
    updatedAt: worker.updatedAt || worker.updated_at || now,
    nfc: workerCode
  };
}

function loadStoredOfflineWorkers() {
  try {
    const raw = localStorage.getItem(OFFLINE_WORKER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed
        .map((worker, index) => normalizeWorkerRecord(worker, index, true))
        .filter(Boolean)
        .filter(worker => !isPlaceholderWorkerRecord(worker))
      : [];
  } catch (error) {
    return [];
  }
}

function persistStoredOfflineWorkers() {
  try {
    localStorage.setItem(OFFLINE_WORKER_STORAGE_KEY, JSON.stringify(OFFLINE_WORKERS));
  } catch (error) {}
}

function refreshWorkerRoster() {
  const profileWorkers = PROFILES
    .filter(profile => profile?.role === 'worker')
    .map((profile, index) => normalizeWorkerRecord(profile, index, false))
    .filter(Boolean);
  const localWorkers = OFFLINE_WORKERS
    .map((worker, index) => normalizeWorkerRecord(worker, index, true))
    .filter(Boolean)
    .filter(worker => !isPlaceholderWorkerRecord(worker));
  const merged = [...profileWorkers, ...localWorkers];
  const seen = new Set();
  WORKERS = merged.filter(worker => {
    if (isPlaceholderWorkerRecord(worker)) return false;
    const key = worker.workerCode || worker.phone || worker.id || worker.name;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  WORKERS = dedupeWorkersByName(WORKERS);
  reconcileAssignmentsForWorkerDedupe(WORKERS);
}

function isCardRegisteredWorker(worker = {}) {
  const code = normalizeWorkerCode(worker.workerCode || worker.code || worker.nfc || worker.id);
  const notes = normalizeName(worker.notes || '');
  const loc = normalizeName(worker.loc || worker.location || '');
  return worker.createdBy === 'card_data'
    || loc === 'nfc registered worker'
    || notes.includes('nfc')
    || /^WID[A-Z0-9-]+$/.test(code);
}

function getWorkerDedupePriority(worker = {}) {
  const code = normalizeWorkerCode(worker.workerCode || worker.code || worker.nfc || worker.id);
  let score = 0;
  if (isCardRegisteredWorker(worker)) score += 100;
  if (worker.offline) score += 25;
  if (String(worker.phone || '').trim()) score -= 6;
  if (/^W-\d{4,}$/.test(code)) score -= 12;
  return score;
}

function dedupeWorkersByName(workers = []) {
  const preferredByName = new Map();
  workers.forEach(worker => {
    const key = normalizeName(worker?.name || '');
    if (!key) return;
    const current = preferredByName.get(key);
    if (!current) {
      preferredByName.set(key, worker);
      return;
    }
    const currentScore = getWorkerDedupePriority(current);
    const nextScore = getWorkerDedupePriority(worker);
    if (nextScore > currentScore) {
      preferredByName.set(key, worker);
      return;
    }
    if (nextScore === currentScore) {
      const currentUpdated = Date.parse(current.updatedAt || current.createdAt || 0) || 0;
      const nextUpdated = Date.parse(worker.updatedAt || worker.createdAt || 0) || 0;
      if (nextUpdated > currentUpdated) preferredByName.set(key, worker);
    }
  });

  return workers.filter(worker => {
    const key = normalizeName(worker?.name || '');
    return key && preferredByName.get(key) === worker;
  });
}

function reconcileAssignmentsForWorkerDedupe(workers = []) {
  if (!Array.isArray(S.assigns) || !S.assigns.length) return;
  const preferredByName = new Map(
    workers.map(worker => [
      normalizeName(worker.name),
      normalizeWorkerCode(worker.id || worker.workerCode || worker.nfc)
    ])
  );

  const normalized = S.assigns.map(assign => {
    const preferredCode = preferredByName.get(normalizeName(assign.name || ''));
    if (!preferredCode) return assign;
    return { ...assign, wid: preferredCode };
  });

  const latestByJobWorker = new Map();
  normalized.forEach(assign => {
    const key = `${assign.jid}::${normalizeWorkerCode(assign.wid)}`;
    const prev = latestByJobWorker.get(key);
    const prevTs = Number(prev?.ts || 0);
    const nextTs = Number(assign?.ts || 0);
    if (!prev || nextTs >= prevTs) latestByJobWorker.set(key, assign);
  });

  S.assigns = Array.from(latestByJobWorker.values());
}

function upsertOfflineWorkerLocal(worker, persist = true) {
  const next = normalizeWorkerRecord(worker, OFFLINE_WORKERS.length, true);
  if (!next || isPlaceholderWorkerRecord(next)) return null;
  const index = OFFLINE_WORKERS.findIndex(item => normalizeWorkerCode(item.workerCode) === normalizeWorkerCode(next.workerCode));
  if (index >= 0) {
    OFFLINE_WORKERS[index] = { ...OFFLINE_WORKERS[index], ...next, offline: true };
  } else {
    OFFLINE_WORKERS.unshift(next);
  }
  if (persist) persistStoredOfflineWorkers();
  refreshWorkerRoster();
  return next;
}

function isPlaceholderCardName(value) {
  const normalized = normalizeName(value);
  const compact = normalized.replace(/[^a-z0-9]/g, '');
  return !normalized || [
    'worker',
    'volunteer',
    'employer',
    'demo',
    'demo user',
    'test user',
    'card user',
    'mishraji',
    'mishra ji'
  ].includes(normalized) || [
    'mishraji'
  ].includes(compact);
}

function isPlaceholderWorkerRecord(worker) {
  if (!worker) return true;
  return isPlaceholderCardName(worker.name);
}

function purgePlaceholderOfflineWorkers() {
  const cleaned = OFFLINE_WORKERS.filter(worker => !isPlaceholderWorkerRecord(worker));
  if (cleaned.length === OFFLINE_WORKERS.length) return false;
  OFFLINE_WORKERS = cleaned;
  persistStoredOfflineWorkers();
  return true;
}

function findRegisteredWorkerByCode(workerCode = '') {
  const normalizedCode = normalizeWorkerCode(workerCode);
  if (!normalizedCode) return null;
  return WORKERS.find(worker =>
    normalizeWorkerCode(worker.workerCode) === normalizedCode ||
    normalizeWorkerCode(worker.code) === normalizedCode ||
    normalizeWorkerCode(worker.id) === normalizedCode ||
    normalizeWorkerCode(worker.nfc) === normalizedCode
  ) || PROFILES.find(profile =>
    profile?.role === 'worker' && (
      normalizeWorkerCode(profile.code) === normalizedCode ||
      normalizeWorkerCode(profile.id) === normalizedCode
    )
  ) || null;
}

function resolveScanDisplayName(cardData, fallbackName = '') {
  const linkedWorker = findRegisteredWorkerByCode(cardData?.wid);
  if (linkedWorker?.name && !isPlaceholderCardName(linkedWorker.name)) return linkedWorker.name;
  if (cardData?.full_name && !isPlaceholderCardName(cardData.full_name)) return cardData.full_name;
  if (fallbackName && !isPlaceholderCardName(fallbackName)) return fallbackName;
  return linkedWorker?.name || cardData?.full_name || fallbackName || '-';
}

function resolveScanBankLabel(cardData, linkedWorker) {
  if (cardData?.upi) return cardData.upi;
  if (linkedWorker?.upiId) return linkedWorker.upiId;
  if (linkedWorker?.bankAccount?.last4) return `Bank ••••${linkedWorker.bankAccount.last4}`;
  return 'Registered worker';
}

function getSelectedMateJobId() {
  return document.getElementById('mate-job-sel')?.value || '';
}

function filterOfflineWorkers(workers = []) {
  const query = normalizeName(S.offlineWorkerQuery || '');
  if (!query) return workers;
  return workers.filter(worker => {
    const fields = [
      worker.name,
      worker.workerCode,
      worker.nfc,
      worker.notes,
      worker.loc,
      worker.skill
    ].map(value => normalizeName(value));
    return fields.some(value => value.includes(query));
  });
}

function buildCardRegistryWorkerRecord(card = {}) {
  const workerCode = normalizeWorkerCode(card?.wid);
  const name = String(card?.full_name || '').trim();
  if (!workerCode || !name || isPlaceholderCardName(name)) return null;
  return {
    id: workerCode,
    workerCode,
    name,
    loc: 'NFC registered worker',
    skill: 'Assigned via NFC',
    avail: 'Available',
    payoutMethod: card?.upi ? 'upi' : 'upi',
    upiId: String(card?.upi || '').trim(),
    bankAccount: null,
    notes: card?.uid ? `NFC UID ${card.uid}` : 'Registered NFC card',
    createdBy: 'card_data',
    offline: true,
    nfc: workerCode
  };
}

async function syncOfflineWorkersFromCardRegistry() {
  if (!BACKEND.enabled || !BACKEND.client) return;
  try {
    const { data, error } = await BACKEND.client
      .from('card_data')
      .select('uid,wid,full_name,upi');
    if (error) throw error;
    (data || [])
      .map(buildCardRegistryWorkerRecord)
      .filter(Boolean)
      .forEach(record => upsertOfflineWorkerLocal(record));
  } catch (error) {}
}

function registerScannedOfflineWorker(cardData, uid, fallbackName = '') {
  const workerCode = normalizeWorkerCode(cardData?.wid);
  const displayName = resolveScanDisplayName(cardData, fallbackName);
  if (!workerCode || isPlaceholderCardName(displayName)) return null;
  return upsertOfflineWorkerLocal({
    id: workerCode,
    workerCode,
    name: displayName,
    loc: 'NFC registered worker',
    skill: 'Assigned via NFC',
    avail: 'Available',
    payoutMethod: cardData?.upi ? 'upi' : 'upi',
    upiId: String(cardData?.upi || '').trim(),
    bankAccount: null,
    notes: uid ? `Scanned NFC UID ${uid}` : 'Scanned from registered NFC card',
    createdBy: S.user?.name || 'mate',
    offline: true,
    nfc: workerCode
  });
}

function startWorkerScanAssignment(jid, wid, name) {
  const jobId = String(jid || getSelectedMateJobId() || '').trim();
  if (!jobId) {
    toast('Select a job before scanning a worker card');
    return;
  }
  openMateScanModal();
  S.mateScanTarget = {
    jid: jobId,
    wid: normalizeWorkerCode(wid),
    name: String(name || '').trim() || 'Worker'
  };
  resetMateScan(false);
  setMateScanStatus(`Waiting to scan ${S.mateScanTarget.name}'s NFC card...`, 'busy');
  void startMateScan();
}

async function syncAssignmentFromMateScan() {
  const scannedId = normalizeWorkerCode(mateScanResult.wappId);
  if (!scannedId) {
    setMateScanStatus('No worker ID found in scanned card.', 'error');
    setMateScanButtonState('idle');
    return false;
  }

  let target = S.mateScanTarget;
  if (!target?.jid || !target?.wid) {
    const selectedJobId = getSelectedMateJobId();
    if (!selectedJobId) {
      setMateScanStatus('Select a job before scanning a worker card.', 'error');
      setMateScanButtonState('idle');
      return false;
    }
    const registeredWorker = findRegisteredWorkerByCode(scannedId);
    target = {
      jid: selectedJobId,
      wid: scannedId,
      name: mateScanResult.name || registeredWorker?.name || 'Worker'
    };
  }

  if (S.mateScanTarget?.wid && scannedId !== normalizeWorkerCode(target.wid)) {
    setMateScanStatus(`Scanned card does not match ${target.name}.`, 'error');
    setMateScanButtonState('idle');
    return false;
  }

  S.mateScanTarget = target;

  const nextStatus = String(mateScanResult.job || '').trim().toLowerCase() === 'completed' ? 'done' : 'assigned';
  const existing = S.assigns.find(item => item.jid === target.jid && normalizeWorkerCode(item.wid) === normalizeWorkerCode(target.wid));

  if (existing) {
    existing.status = nextStatus;
    existing.ts = Date.now();
    existing.name = mateScanResult.name || target.name;
  } else {
    S.assigns.push({
      jid: target.jid,
      wid: target.wid,
      name: mateScanResult.name || target.name,
      status: nextStatus,
      ts: Date.now()
    });
  }

  const job = JOBS.find(item => item.id === target.jid);
  if (job && !job.apps.includes(mateScanResult.name || target.name)) {
    job.apps.push(mateScanResult.name || target.name);
  }

  try {
    await BACKEND.saveAssignment(target.jid, target.wid, mateScanResult.name || target.name, S.user?.name || 'mate');
    if (nextStatus === 'done') {
      await BACKEND.updateAssignmentStatus(target.jid, target.wid, 'done');
    }
  } catch (error) {}

  renderMateWorkers();
  renderMateActive();
  document.getElementById('m-assigned').textContent = S.assigns.filter(a => a.status === 'assigned').length;
  if (S.role === 'mate' && S.user) syncUserDerivedStats(S.user);
  return true;
}

function getCurrentUserRatingForJob(jobId, targetPhone = '', targetRole = '') {
  const phone = getCurrentUserPhone();
  if (!jobId || !phone) return null;
  const normalizedTargetPhone = normalizePhone(targetPhone);
  return RATINGS.find(rating =>
    rating.jobId === jobId &&
    normalizePhone(rating.raterPhone) === phone &&
    (!normalizedTargetPhone || normalizePhone(rating.targetPhone) === normalizedTargetPhone) &&
    (!targetRole || rating.targetRole === targetRole)
  ) || null;
}

function loadStoredRatings() {
  try {
    const raw = localStorage.getItem(RATING_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function persistStoredRatings() {
  try {
    localStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(RATINGS));
  } catch (error) {}
}

function upsertLocalRating(rating) {
  if (!rating?.jobId || !rating?.raterPhone) return;
  const targetPhone = normalizePhone(rating.targetPhone);
  const index = RATINGS.findIndex(item =>
    item.jobId === rating.jobId &&
    normalizePhone(item.raterPhone) === normalizePhone(rating.raterPhone) &&
    normalizePhone(item.targetPhone) === targetPhone
  );
  if (index >= 0) RATINGS[index] = { ...RATINGS[index], ...rating };
  else RATINGS.unshift(rating);
  persistStoredRatings();
}

function getRatingStats(targetPhone = '', targetName = '', targetRole = '') {
  const normalizedPhone = normalizePhone(targetPhone);
  const normalizedName = normalizeName(targetName);
  const relevantRatings = RATINGS.filter(rating => {
    if (normalizedPhone) return normalizePhone(rating.targetPhone) === normalizedPhone;
    if (normalizedName) {
      return normalizeName(rating.targetName) === normalizedName &&
        (!targetRole || rating.targetRole === targetRole);
    }
    return false;
  });
  const average = relevantRatings.length
    ? Number((relevantRatings.reduce((sum, rating) => sum + Number(rating.stars || 0), 0) / relevantRatings.length).toFixed(2))
    : 0;
  return { average, count: relevantRatings.length };
}

function getDisplayRating(targetPhone = '', fallback = 0, targetName = '', targetRole = '') {
  const { average, count } = getRatingStats(targetPhone, targetName, targetRole);
  if (count > 0) return average.toFixed(1);
  return String(fallback);
}

function getComputedJobsDone(profile = S.user) {
  if (!profile) return 0;
  if (profile.role === 'mate') {
    return S.assigns.filter(a => a.status === 'done').length || Number(profile.jobs || 0);
  }
  return Number(profile.jobs || 0);
}

function getProfileCompleteness(profile = S.user) {
  if (!profile) return 0;
  const fields = [
    profile.name,
    profile.phone,
    profile.email,
    profile.loc
  ];
  if (profile.role === 'worker') fields.push(profile.skill);
  if (profile.role === 'employer') fields.push(profile.need);
  if (profile.role === 'mate') fields.push(profile.code || profile.device);
  const filled = fields.filter(value => String(value || '').trim()).length;
  return fields.length ? filled / fields.length : 0;
}

function calculateTrustScore(profile = S.user) {
  if (!profile) return 0;
  const jobsDone = getComputedJobsDone(profile);
  const ratingStats = getRatingStats(profile.phone, profile.name, profile.role);
  const ratingAverage = ratingStats.average || 0;
  const completeness = getProfileCompleteness(profile);
  const completionScore = Math.round(completeness * 20);
  if (jobsDone <= 0 && ratingStats.count <= 0) {
    return Math.max(0, Math.min(100, completionScore));
  }
  const jobsScore = Math.min(jobsDone * 8, 40);
  const ratingScore = Math.round((Math.min(ratingAverage, 5) / 5) * 40);
  return Math.max(0, Math.min(100, completionScore + jobsScore + ratingScore));
}

function syncUserDerivedStats(target = S.user) {
  if (!target) return null;
  const next = {
    ...target,
    jobs: getComputedJobsDone(target),
    score: calculateTrustScore(target)
  };
  const ratingValue = Number(getDisplayRating(next.phone, next.rating || 0, next.name, next.role));
  next.rating = Number.isFinite(ratingValue) ? ratingValue : 0;
  if (S.user && target === S.user) {
    S.user = next;
    persistAuthSession();
  }
  if (next.phone) upsertKnownProfile(next);
  return next;
}

function refreshLocalProfileRating(targetPhone, targetName = '', targetRole = '') {
  const normalizedPhone = normalizePhone(targetPhone);
  const { average } = getRatingStats(targetPhone, targetName, targetRole);
  const profile = normalizedPhone
    ? getKnownProfileByPhone(normalizedPhone)
    : getKnownProfileByName(targetName, targetRole);
  if (profile) syncUserDerivedStats({ ...profile, rating: average });
}

function currentApplicantName() {
  return String(S.user?.name || '').trim() || 'You';
}

function isCurrentUserApplicant(name) {
  return normalizeName(name) === normalizeName(currentApplicantName());
}

function getCurrentUserPhone() {
  const phone = normalizePhoneInput(S.user?.phone || S.pendingPhone || '');
  return isValidPhoneInput(phone) ? phone : '';
}

const HIRE_CANCEL_WINDOW_MS = 30 * 60 * 1000;
const HIRE_STATE_STORAGE_KEY = 'wapp-hire-states';

function loadHireStateMap() {
  try {
    const raw = localStorage.getItem(HIRE_STATE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

function saveHireStateMap(map) {
  try {
    localStorage.setItem(HIRE_STATE_STORAGE_KEY, JSON.stringify(map || {}));
  } catch (error) {}
}

function syncStoredHireState(job) {
  if (!job?.id) return null;
  const map = loadHireStateMap();
  const state = map[job.id];
  if (!state) {
    delete job.hireState;
    return null;
  }
  if (Number(state.expiresAt) <= Date.now()) {
    delete map[job.id];
    saveHireStateMap(map);
    delete job.hireState;
    return null;
  }
  job.hireState = state;
  return state;
}

function setJobHireState(job, state) {
  if (!job?.id) return;
  const map = loadHireStateMap();
  if (state) {
    map[job.id] = state;
    job.hireState = state;
  } else {
    delete map[job.id];
    delete job.hireState;
  }
  saveHireStateMap(map);
}

function getActiveHireState(job) {
  const state = syncStoredHireState(job);
  return state && Number(state.expiresAt) > Date.now() ? state : null;
}

function formatRemainingHireTime(expiresAt) {
  const remainingMs = Math.max(0, Number(expiresAt) - Date.now());
  const totalMinutes = Math.ceil(remainingMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${Math.max(minutes, 1)}m`;
}

function getApplicantProfileData(name, index = 0) {
  const known = getKnownProfileByName(name, 'worker');
  const worker = WORKERS.find(w => normalizeName(w.name) === normalizeName(name));
  const rating = Number(getDisplayRating(known?.phone || worker?.phone || '', 0, known?.name || worker?.name || name, 'worker'));
  if (worker) {
    return {
      name: known?.name || worker.name,
      av: known?.av || worker.name.charAt(0).toUpperCase(),
      phone: known?.phone || worker.phone || '+91 9XXXX XXXXX',
      loc: known?.loc || worker.loc || 'Nearby area',
      skill: known?.skill || getWorkerSkill(worker),
      jobs: known?.jobs ?? worker.jobs ?? index,
      rating
    };
  }
  return {
    name: known?.name || name,
    av: known?.av || String(name || '?').charAt(0).toUpperCase(),
    phone: known?.phone || '+91 9XXXX XXXXX',
    loc: known?.loc || 'Nearby area',
    skill: known?.skill || 'General work',
    jobs: known?.jobs ?? index,
    rating
  };
}

function syncEmployerJobs() {
  if (!S.user?.phone && !S.user?.name) {
    EJOBS = [];
    return;
  }
  EJOBS = JOBS.filter(job => {
    if (S.user?.phone && job.ownerPhone && job.ownerPhone === S.user.phone) return true;
    return normalizeName(job.ownerName) && normalizeName(job.ownerName) === normalizeName(S.user?.name);
  });
}

function buildProfileFromForm(role) {
  const isWorker = role === 'worker';
  const isMate = role === 'mate';
  const name = (document.getElementById('s-name')?.value || '').trim();
  const phone = composePhoneWithCountry('s-phone', 'signup-country-code');
  const email = (document.getElementById('s-email')?.value || '').trim();
  const location = (document.getElementById('s-loc')?.value || '').trim();
  const profile = {
    role,
    name,
    phone,
    email,
    loc: location,
    av: name ? name.charAt(0).toUpperCase() : '?',
    jobs: 0,
    rating: 0,
    score: 0,
    ctype: isWorker ? 'individual' : S.ctype,
    organizationName: (document.getElementById('s-orgname')?.value || '').trim(),
    skill: isWorker ? (document.getElementById('s-skillval')?.value || '').trim() : '',
    need: !isWorker ? (document.getElementById('s-needval')?.value || '').trim() : '',
    reg: !isWorker ? (document.getElementById('s-regval')?.value || '').trim() : '',
    code: '',
    device: isMate ? MATE_DEVICE_ID : '',
    upiId: '',
    bankAccount: null,
    matePayout: null
  };
  if (!isWorker && profile.organizationName) profile.name = profile.organizationName;
  return profile;
}

async function hydrateBackendState() {
  RATINGS = loadStoredRatings();
  S.dataReady = false;
  try {
    const snapshot = await BACKEND.loadSnapshot();
    if (!snapshot) return;
    JOBS = Array.isArray(snapshot.jobs) ? snapshot.jobs.slice() : [];
    JOBS.forEach(syncStoredHireState);
    syncEmployerJobs();
    if (Array.isArray(snapshot.assignments) && snapshot.assignments.length) {
      S.assigns = snapshot.assignments.map(a => ({
        jid: a.job_id,
        wid: a.worker_id,
        name: a.worker_name,
        status: a.status || 'assigned',
        ts: a.created_at ? Date.parse(a.created_at) || Date.now() : Date.now()
      }));
      S.assigns.forEach(a => {
        const job = JOBS.find(item => item.id === a.jid) || EJOBS.find(item => item.id === a.jid);
        if (job && !job.apps.includes(a.name)) job.apps.push(a.name);
      });
    }
    const profiles = snapshot.profiles || [];
    PROFILES = profiles.slice();
    const workerProfile = profiles.find(p => p.role === 'worker');
    const employerProfile = profiles.find(p => p.role === 'employer');
    const mateProfile = profiles.find(p => p.role === 'mate');
    const storedOfflineWorkers = loadStoredOfflineWorkers();
    const backendOfflineWorkers = Array.isArray(snapshot.offlineWorkers) ? snapshot.offlineWorkers : [];
    const mergedOfflineWorkers = [...backendOfflineWorkers, ...storedOfflineWorkers]
      .map((worker, index) => normalizeWorkerRecord(worker, index, true))
      .filter(Boolean)
      .filter(worker => !isPlaceholderWorkerRecord(worker));
    const seenOffline = new Set();
    OFFLINE_WORKERS = mergedOfflineWorkers.filter(worker => {
      if (isPlaceholderWorkerRecord(worker)) return false;
      const key = worker.workerCode || worker.id || worker.name;
      if (!key || seenOffline.has(key)) return false;
      seenOffline.add(key);
      return true;
    });
    purgePlaceholderOfflineWorkers();
    persistStoredOfflineWorkers();
    USERS = {
      worker: mergeUserProfile(USERS.worker, workerProfile),
      employer: mergeUserProfile(USERS.employer, employerProfile),
      mate: mergeUserProfile(USERS.mate, mateProfile)
    };
    if (!USERS.mate.device) USERS.mate.device = MATE_DEVICE_ID;
    await syncOfflineWorkersFromCardRegistry();
    refreshWorkerRoster();
    if (S.role && S.user?.phone) {
      const remote = await BACKEND.loadProfileByPhone(S.user.phone);
      if (remote) {
        S.user = mergeUserProfile(S.user, remote);
        if (S.role === 'mate' && !S.user.device) S.user.device = MATE_DEVICE_ID;
        upsertKnownProfile(remote);
        persistAuthSession();
      }
    }
  } finally {
    S.dataReady = true;
  }
}

// ── Language ───────────────────────────────────────────────────────
function syncLangButtons() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === S.lang);
  });
}

function updatePostOptionLabels() {
  const typeKeys = ['farm','shop','home','construction','delivery','other'];
  document.querySelectorAll('#page-post .tb').forEach((btn, i) => {
    const icon = btn.querySelector('.te')?.outerHTML || '';
    btn.innerHTML = `${icon}<span>${t('jobType.' + typeKeys[i])}</span>`;
  });
  const durKeys = ['instant','daily','weekly','fullTime'];
  document.querySelectorAll('#page-post .dur-row .db2:not(.ctbtn)').forEach((btn, i) => {
    btn.textContent = t('duration.' + durKeys[i]);
  });
}

function updateProfileStatsLabels() {
  const labels = document.querySelectorAll('#page-profile .sl');
  if (labels[0]) labels[0].textContent = t('profile.trustScore');
  if (labels[1]) labels[1].textContent = t('profile.jobsDone');
  if (labels[2]) labels[2].textContent = t('profile.rating');
}

function updateOtpHint() {
  const hint = document.getElementById('otp-hint');
  if (!hint) return;
  const phone = S.pendingPhone || '';
  hint.textContent = phone ? t('otp.sentToNumber', { phone }) : t('otp.sentToYourNumber');
}

function refreshHeaderLabels() {
  const browseGreet = document.getElementById('browse-greet');
  const empGreet    = document.getElementById('emp-greet');
  if (browseGreet) browseGreet.textContent = S.role === 'worker'   && S.user ? S.user.name : t('browse.title');
  if (empGreet)    empGreet.textContent    = S.role === 'employer' && S.user ? S.user.name : t('nav.dashboard');
}

function applyStaticTranslations() {
  document.title = t('meta.title');
  document.documentElement.lang = S.lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  updatePostOptionLabels();
  updateProfileStatsLabels();
  updateOtpHint();
  syncSignupLocationUI();
  syncPostLocationUI();
  document.querySelectorAll('[data-i18n="nav.payment"]').forEach(el => {
    el.textContent = lt('nav.payment', t('nav.payment'));
  });
}

// Master refresh — called after every language change
function refreshLanguageUI() {
  applyStaticTranslations();
  syncLangButtons();
  syncSignupUI();
  refreshHeaderLabels();
  if (S.user) applyUser();
  if (S.job) renderJobDetail(S.job.id);
  renderApplicants();
  filterJobs(document.querySelector('#page-browse .si')?.value || '');
  if (document.getElementById('tab-saved')?.classList.contains('active')) switchTab('saved');
  else renderMyJobs();
  renderEmp();
  if (S.role === 'mate') renderMate();
}

function initLanguage() {
  let lang = 'en';
  try { lang = localStorage.getItem('wapp-language') || 'en'; } catch (e) {}
  S.lang = TRANSLATIONS[lang] ? lang : 'en';
  // Bind all lang buttons (including any added later)
  document.querySelectorAll('.lang-btn[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
  applyStaticTranslations();
  syncLangButtons();
}

function setLang(lang) {
  if (!TRANSLATIONS[lang] || S.lang === lang) return;
  S.lang = lang;
  try { localStorage.setItem('wapp-language', lang); } catch (e) {}
  // Smooth transition — brief fade
  document.getElementById('app').style.transition = 'opacity .15s';
  document.getElementById('app').style.opacity = '0.6';
  setTimeout(() => {
    refreshLanguageUI();
    document.getElementById('app').style.opacity = '1';
    const nameKey = lang === 'hi' ? 'language.hindi' : lang === 'bn' ? 'language.bengali' : 'language.english';
    toast(t('language.changed', { language: t(nameKey) }), 'ok');
  }, 120);
}

// ── Navigation ─────────────────────────────────────────────────────
function pg(id, options = {}) {
  if (!options.skipPrev) S.prev = document.querySelector('.page.active')?.id || null;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('active');
  el.scrollTop = 0;
  window.scrollTo(0, 0);
  navSync(id);
  if (id === 'page-browse')   filterJobs('');
  if (id === 'page-myjobs')   renderMyJobs();
  if (id === 'page-employer') renderEmp();
  if (id === 'page-mate')     renderMate();
  if (id === 'page-mate-form') renderMateOfflineSection();
  if (id === 'page-apps')     renderApplicants();
  if (id === 'page-applicant-profile') renderApplicantProfile();
  if (id === 'page-payment')  renderPayment();
  if (id === 'page-signup')   syncSignupLocationUI();
  if (id === 'page-post')     syncPostLocationUI();
  requestAnimationFrame(() => {
    triggerMotion(el, 'page-enter');
    animateCollection(el, '.role-card, .fg, .btn, .wapp-code-wrap, .ic, .jc, .war, .aac, .ar, .upi-app, .pr, .sb, .tabs');
  });
}

function navSync(id) {
  const noNav = ['page-splash','page-role','page-login','page-signup','page-wm-login','page-otp','page-detail','page-post','page-apps','page-applicant-profile'];
  const app = document.getElementById('app');
  ['worker-nav','employer-nav','mate-nav'].forEach(n => document.getElementById(n)?.classList.remove('on'));
  if (noNav.includes(id)) {
    app?.classList.remove('desktop-nav-active');
    return;
  }

  let navVisible = false;
  if (S.role === 'worker') {
    document.getElementById('worker-nav')?.classList.add('on');
    navVisible = true;
  }
  if (S.role === 'employer') {
    document.getElementById('employer-nav')?.classList.add('on');
    navVisible = true;
  }
  if (S.role === 'mate') {
    document.getElementById('mate-nav')?.classList.add('on');
    navVisible = true;
  }
  app?.classList.toggle('desktop-nav-active', navVisible);
}

function getDefaultHomePage() {
  if (S.role === 'employer') return 'page-employer';
  if (S.role === 'mate') return 'page-mate';
  return 'page-browse';
}

function back() {
  const active = document.querySelector('.page.active')?.id || null;
  if (active === 'page-applicant-profile') {
    pg('page-apps', { skipPrev: true });
    return;
  }
  if (active === 'page-apps') {
    pg(S.appsReturnPage || getDefaultHomePage(), { skipPrev: true });
    return;
  }
  if (S.prev) pg(S.prev, { skipPrev: true });
  else pg(getDefaultHomePage(), { skipPrev: true });
}

function nav(navId, pageId, btn) {
  document.querySelectorAll('#' + navId + ' .ni').forEach(n => n.classList.remove('active'));
  btn.classList.add('active');
  triggerMotion(btn, 'pulse-pop');
  pg(pageId);
}

function triggerMotion(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

function animateCollection(root, selector) {
  if (!root) return;
  root.querySelectorAll(selector).forEach((node, index) => {
    node.style.setProperty('--enter-delay', `${Math.min(index * 70, 420)}ms`);
    triggerMotion(node, 'motion-in');
  });
}

function initInteractiveMotion() {
  document.addEventListener('click', e => {
    const target = e.target.closest('.btn, .role-card, .tb, .db2, .tab, .upi-app, .tap-btn, .hdr-a, .pay-type-btn');
    if (target) triggerMotion(target, 'pulse-pop');
  });
}

function runSplashIntro() {
  const splash = document.getElementById('page-splash');
  if (!splash) return;
  const brand = splash.querySelector('.splash-brand');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage1 = reducedMotion ? 150 : 650;
  const stage2 = reducedMotion ? 300 : 1200;
  const stage3 = reducedMotion ? 650 : 2000;

  splash.classList.remove('splash-reveal');
  brand?.classList.remove('is-ready');

  setTimeout(() => {
    splash.classList.add('splash-reveal');
  }, stage1);
  setTimeout(() => {
    brand?.classList.add('is-ready');
  }, stage2);
  setTimeout(() => {
    if (S.role && S.user) {
      syncEmployerJobs();
      applyUser();
      if (S.role === 'mate') {
        renderMate();
        pg('page-mate');
      } else if (S.role === 'employer') {
        document.getElementById('emp-greet').textContent = S.user.name;
        pg('page-employer');
      } else {
        document.getElementById('browse-greet').textContent = S.user.name;
        pg('page-browse');
      }
      return;
    }
    pg('page-role');
  }, stage3);
}

// ── Role & Auth ────────────────────────────────────────────────────
function getRoleAuthLabel() {
  return S.role === 'worker' ? t('auth.asWorker') : t('auth.asClient');
}
function getRoleTitle() {
  if (S.role === 'mate') return t('common.volunteer');
  if (S.role === 'employer') return t('common.employer');
  return t('common.worker');
}

function selectRole(r) {
  S.role = r;
  sessionStorage.setItem('wappRole', r);
  pg(r === 'mate' ? 'page-wm-login' : 'page-login');
  if (r !== 'mate') {
    const lbl = r === 'worker' ? t('auth.asWorker') : t('auth.asClient');
    document.getElementById('auth-role-label').textContent = lbl;
    document.getElementById('signup-role-label').textContent = lbl;
    syncSignupUI();
  }
}

function syncSignupUI() {
  const isW = S.role === 'worker';
  const isOrg = !isW && S.ctype === 'org';
  document.getElementById('s-client-type').style.display = isW ? 'none' : 'block';
  document.getElementById('s-org').style.display         = isOrg ? 'block' : 'none';
  document.getElementById('s-orgreg').style.display      = isOrg ? 'block' : 'none';
  document.getElementById('s-skill').style.display       = isW ? 'block' : 'none';
  document.getElementById('s-need').style.display        = isW ? 'none' : 'block';
  document.getElementById('signup-role-label').textContent = isW ? t('auth.asWorker') : t('auth.asClient');
  document.getElementById('auth-role-label').textContent   = isW ? t('auth.asWorker') : t('auth.asClient');
  document.getElementById('s-name-lbl').textContent        = isW ? t('field.fullName') : t('field.contactName');
  document.getElementById('s-need-lbl').textContent        = isOrg ? t('field.orgHiringNeed') : t('field.hiringNeed');
}

function setCtype(btn, ct) {
  S.ctype = ct;
  document.querySelectorAll('.ctbtn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  syncSignupUI();
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon = btn?.querySelector('i');
  if (!input || !icon) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  icon.className = isHidden ? 'bi bi-eye-slash' : 'bi bi-eye';
  btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
}

function closeCountryDropdowns() {
  document.querySelectorAll('.cc-dropdown.open').forEach(dropdown => {
    dropdown.classList.remove('open');
    const trigger = dropdown.querySelector('.cc-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
}

function toggleCountryDropdown(prefix) {
  const dropdown = document.getElementById(`${prefix}-dd`);
  if (!dropdown) return;
  const trigger = document.getElementById(`${prefix}-trigger`);
  const isOpen = dropdown.classList.contains('open');
  closeCountryDropdowns();
  if (!isOpen) {
    dropdown.classList.add('open');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  }
}

function setCountryCode(prefix, code, country) {
  const hidden = document.getElementById(`${prefix}-code`);
  const label = document.getElementById(`${prefix}-label`);
  const menu = document.getElementById(`${prefix}-menu`);
  if (hidden) hidden.value = code;
  if (label) label.textContent = `${code} ${country}`;
  if (menu) {
    menu.querySelectorAll('.cc-option').forEach(option => {
      option.classList.toggle('active', option.dataset.code === code);
    });
  }
  closeCountryDropdowns();
}

function initCountryCodeDropdowns() {
  ['phone-country', 'signup-country', 'mate-country'].forEach(prefix => {
    const hidden = document.getElementById(`${prefix}-code`);
    const menu = document.getElementById(`${prefix}-menu`);
    if (!hidden || !menu) return;
    const active = menu.querySelector(`.cc-option[data-code="${hidden.value}"]`) || menu.querySelector('.cc-option');
    if (!active) return;
    const [code, country = 'IN'] = active.textContent.trim().split(/\s+/, 2);
    setCountryCode(prefix, hidden.value || code, country);
  });

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) {
      closeCountryDropdowns();
      return;
    }
    if (!event.target.closest('.cc-dropdown')) closeCountryDropdowns();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeCountryDropdowns();
  });
}

function normalizePhoneInput(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('+')) return `+${raw.slice(1).replace(/\D/g, '')}`;
  return raw.replace(/\D/g, '');
}

function getDigitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeDialCode(value) {
  const digits = getDigitsOnly(value);
  return digits ? `+${digits}` : '+91';
}

function composePhoneWithCountry(inputId, codeId) {
  const input = document.getElementById(inputId);
  const code = document.getElementById(codeId);
  const raw = String(input?.value || '').trim();
  if (!raw) return '';

  if (raw.startsWith('+')) return normalizePhoneInput(raw);

  const digits = getDigitsOnly(raw);
  if (!digits) return '';

  return `${normalizeDialCode(code?.value)}${digits}`;
}

function isValidPhoneInput(value) {
  const raw = normalizePhoneInput(value);
  if (!raw || !raw.startsWith('+')) return false;
  const digits = raw.slice(1).replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

async function sendOTP() {
  const email = document.getElementById('login-email-input')?.value?.trim() || '';
  const p = composePhoneWithCountry('phone-input', 'phone-country-code');
  if (!email) { toast(t('toast.enterEmail')); return; }
  if (!/^\S+@\S+\.\S+$/.test(email)) { toast(t('toast.enterValidEmail')); return; }
  if (!isValidPhoneInput(p)) { toast(t('toast.enterValidPhone')); return; }
  
  // OTP is blocked, so bypass it and login directly
  if (OTP_LOGIN_BLOCKED) {
    try {
      const remote = await BACKEND.loadProfileByPhone(p);
      if (!remote) {
        toast('Account not found. Please create account first.');
        const signupPhone = document.getElementById('s-phone');
        if (signupPhone) signupPhone.value = p;
        const signupEmail = document.getElementById('s-email');
        if (signupEmail) signupEmail.value = email;
        pg('page-signup');
        return;
      }

      if (remote.role && S.role && remote.role !== S.role) {
        toast(`This phone is registered as ${remote.role}. Please select that role.`);
        pg('page-role');
        return;
      }

      login(remote.role || S.role || 'worker', null, remote);
    } catch (error) {
      toast('Login failed. Please try again.');
    }
    return;
  }

  // If OTP is enabled in future, use this flow
  S.pendingEmail = email;
  S.pendingPhone = p;
  document.getElementById('otp-hint').textContent = t('otp.sentToNumber', { phone: p });
  pg('page-otp');
  setTimeout(() => document.getElementById('o0').focus(), 120);
}

async function verifyOTP() {
  if (OTP_LOGIN_BLOCKED) {
    toast(t('toast.otpTemporarilyBlocked'));
    return;
  }
  const otp = [0,1,2,3,4,5].map(i => document.getElementById('o'+i).value).join('');
  if (otp.length < 6) { toast(t('toast.enterOtp')); return; }

  const phone = normalizePhoneInput(S.pendingPhone);
  if (!isValidPhoneInput(phone)) { toast(t('toast.enterValidPhone')); return; }

  try {
    const remote = await BACKEND.loadProfileByPhone(phone);
    if (!remote) {
      toast('Account not found. Please create account first.');
      const signupPhone = document.getElementById('s-phone');
      if (signupPhone) signupPhone.value = phone;
      pg('page-signup');
      return;
    }

    if (remote.role && S.role && remote.role !== S.role) {
      toast(`This phone is registered as ${remote.role}. Please select that role.`);
      pg('page-role');
      return;
    }

    login(remote.role || S.role || 'worker', null, remote);
  } catch (error) {
    toast('Login failed. Please try again.');
  }
}

function otpNext(el, i) {
  if (el.value.length === 1 && i < 5) document.getElementById('o'+(i+1)).focus();
  if (!OTP_LOGIN_BLOCKED && el.value.length === 1 && i === 5) setTimeout(verifyOTP, 100);
}

function syncOtpVerificationState() {
  const btn = document.getElementById('otp-verify-btn');
  if (!btn) return;
  btn.disabled = OTP_LOGIN_BLOCKED;
  btn.style.opacity = OTP_LOGIN_BLOCKED ? '.6' : '1';
  btn.style.cursor = OTP_LOGIN_BLOCKED ? 'not-allowed' : 'pointer';
}

async function signup() {
  const n  = document.getElementById('s-name').value.trim();
  const p  = composePhoneWithCountry('s-phone', 'signup-country-code');
  const eRaw  = document.getElementById('s-email').value.trim();
  const e  = eRaw.toLowerCase();
  const l  = document.getElementById('s-loc').value.trim();
  const pw = document.getElementById('s-pass').value.trim();
  if (!n)           { toast(t('toast.enterName'));        return; }
  if (!isValidPhoneInput(p)) { toast(t('toast.enterValidPhone')); return; }
  if (!e)           { toast(t('toast.enterEmail'));        return; }
  if (!/^\S+@\S+\.\S+$/.test(e)) { toast(t('toast.enterValidEmail')); return; }
  if (!l)           { toast(t('toast.addLocation'));       return; }
  if (!pw || pw.length < 6 || pw.length > 8) { toast(t('toast.passwordShort')); return; }

  try {
    const existingByPhone = await BACKEND.loadProfileByPhone(p);
    if (existingByPhone && normalizePhoneInput(existingByPhone.phone) === p) {
      toast(t('toast.phoneAlreadyUsed'));
      return;
    }

    const existingByEmail = await BACKEND.loadProfileByEmail(e);
    if (existingByEmail && normalizePhoneInput(existingByEmail.phone) !== p) {
      toast(t('toast.emailAlreadyUsed'));
      return;
    }
  } catch (error) {
    // Ignore transient lookup error and continue with signup flow.
  }

  let profile = buildProfileFromForm(S.role || 'worker');
  profile.name = n;
  profile.phone = p;
  profile.email = e;
  profile.loc = l;
  if (S.role === 'worker') profile.skill = document.getElementById('s-skillval').value.trim();
  if (S.role !== 'worker') profile.need = document.getElementById('s-needval').value.trim();
  if (S.role !== 'worker') profile.reg = document.getElementById('s-regval').value.trim();
  try {
    const saved = await BACKEND.upsertProfile(profile);
    if (saved) profile = saved;
  } catch (error) {}
  toast(t('toast.accountCreated'), 'ok');
  login(S.role || 'worker', null, profile);
}

function demoLogin() { login(S.role); }

function wappNext(el, i) {
  el.value = el.value.toUpperCase();
  if (el.value.length === 1 && i < 5) document.getElementById('wc'+(i+1))?.focus();
  const code = [0,1,2,3,4,5].map(j => document.getElementById('wc'+j)?.value||'').join('');
  if (code.length === 6) setTimeout(mateLogin, 300);
}
function wappBack(e, i) {
  if (e.key === 'Backspace' && !e.target.value && i > 0) document.getElementById('wc'+(i-1))?.focus();
}
function getCode() { return [0,1,2,3,4,5].map(i => document.getElementById('wc'+i)?.value||'').join('').toUpperCase(); }

function mateLogin() {
  const code = getCode().replace('-','');
  const ph   = composePhoneWithCountry('mate-phone', 'mate-country-code');
  if (!code || code.length < 6 || (CODES.length && !CODES.some(c => c.replace('-','') === code))) {
    toast(t('toast.invalidCode'));
    document.querySelectorAll('.wapp-code-box').forEach(b => {
      b.style.borderColor = 'var(--danger)';
      setTimeout(() => b.style.borderColor = '', 1200);
    });
    return;
  }
  if (!isValidPhoneInput(ph)) { toast(t('toast.enterValidPhone')); return; }
  login('mate', code);
}

function login(role, code, profile) {
  S.role = role;
  const key = role === 'worker' ? 'worker' : role === 'employer' ? 'employer' : 'mate';
  const defaults = createEmptyUser(role, {
    name: role === 'worker' ? 'Worker' : role === 'employer' ? 'Employer' : 'Volunteer',
    phone: role === 'mate'
      ? composePhoneWithCountry('mate-phone', 'mate-country-code')
      : normalizePhoneInput(S.pendingPhone)
  });
  const resolvedProfile = profile || USERS[key] || {};
  S.user = mergeUserProfile(defaults, resolvedProfile) || defaults;
  if (code) S.user.code = code;
  if (!S.user.phone) S.user.phone = defaults.phone;
  if (!S.user.loc) S.user.loc = '';
  if (!S.user.av) S.user.av = (S.user.name || '?').charAt(0).toUpperCase();
  if (!S.user.name) S.user.name = defaults.name;
  if (role === 'mate' && !S.user.device) S.user.device = MATE_DEVICE_ID;
  syncUserDerivedStats(S.user);
  persistAuthSession();
  upsertKnownProfile(S.user);
  const hasBackendProfile = Boolean(profile && profile.phone);
  if (!hasBackendProfile) {
    void BACKEND.upsertProfile(S.user).catch(() => {});
  }
  syncEmployerJobs();
  applyUser();
  if (role === 'mate')     { renderMate(); pg('page-mate'); }
  else if (role === 'employer') { document.getElementById('emp-greet').textContent = S.user.name; pg('page-employer'); }
  else                          { document.getElementById('browse-greet').textContent = S.user.name; pg('page-browse'); }
  toast(t('toast.welcome', { name: (S.user.name || defaults.name).split(' ')[0] }), 'ok');
}

function logout() {
  S.user = null; S.role = null; S.assigns = []; S.applicantView = null; S.appsReturnPage = null;
  clearStoredAuthSession();
  syncHeaderAvatar();
  pg('page-role');
}

function syncHeaderAvatar() {
  const buttons = document.querySelectorAll('button.hdr-a[onclick*="page-profile"]');
  const letter = (S.user?.name || '').trim().charAt(0).toUpperCase();

  buttons.forEach(btn => {
    if (letter) {
      applyAvatarPalette(btn, S.user);
      btn.classList.add('hdr-avatar');
      btn.textContent = letter;
      btn.style.removeProperty('border-color');
      btn.setAttribute('aria-label', 'Profile');
      btn.title = S.user?.name || 'Profile';
    } else {
      btn.classList.remove('hdr-avatar');
      btn.innerHTML = '<i class="bi bi-person-circle"></i>';
      btn.style.removeProperty('--avatar-c1');
      btn.style.removeProperty('--avatar-c2');
      btn.style.removeProperty('--avatar-c3');
      btn.style.removeProperty('--avatar-c4');
      btn.style.removeProperty('color');
      btn.setAttribute('aria-label', 'Profile');
      btn.title = 'Profile';
    }
  });
}

function applyUser() {
  const u = syncUserDerivedStats(S.user); if (!u) return;
  const pfAvatar = document.getElementById('pf-av');
  const hero = document.getElementById('pf-hero');
  if (pfAvatar) {
    pfAvatar.textContent = u.av;
    applyAvatarPalette(pfAvatar, u);
  }
  if (hero) applyAvatarPalette(hero, u);
  document.getElementById('pf-name').textContent   = u.name;
  document.getElementById('pf-role').textContent   = `${getRoleTitle()} · ${u.loc}`;
  document.getElementById('pf-phone').textContent  = u.phone;
  const locVal = document.querySelectorAll('#page-profile .pr .prv')[1];
  if (locVal) locVal.textContent = u.loc;
  document.getElementById('pf-score').textContent  = u.score;
  document.getElementById('pf-jobs').textContent   = u.jobs;
  const ownRating = Number(u.rating);
  const displayRating = getDisplayRating(u.phone, Number.isFinite(ownRating) ? ownRating : 0, u.name, u.role);
  document.getElementById('pf-rating').textContent = displayRating;
  document.getElementById('pf-badge').innerHTML    = `<i class="bi bi-star-fill"></i> ${displayRating} ${t('profile.rating')}`;
  const codeRow = document.getElementById('pf-code-row');
  const devRow  = document.getElementById('pf-dev-row');
  if (S.role === 'mate') {
    document.getElementById('pf-score').classList.add('mv');
    if (codeRow) { codeRow.style.display='flex'; document.getElementById('pf-code').textContent = u.code||'-'; }
    if (devRow)  { devRow.style.display='flex';  document.getElementById('pf-dev').textContent  = u.device||'-'; }
  } else {
    if (codeRow) codeRow.style.display = 'none';
    if (devRow)  devRow.style.display  = 'none';
  }
  syncHeaderAvatar();
}

// ── Jobs ───────────────────────────────────────────────────────────
function renderSkeletonCard() {
  return `
    <div class="loader" aria-hidden="true">
      <div class="wrapper">
        <div class="circle"></div>
        <div class="line-1"></div>
        <div class="line-2"></div>
        <div class="line-3"></div>
        <div class="line-4"></div>
        <div class="button" style="position:absolute;right:0;bottom:0"></div>
      </div>
    </div>`;
}

function renderSkeletonList(count = 3) {
  return Array.from({ length: count }, renderSkeletonCard).join('');
}

function renderPaymentSkeleton() {
  return `
    <div style="padding:16px">
      ${renderSkeletonCard()}
      ${renderSkeletonCard()}
      ${renderSkeletonCard()}
    </div>`;
}

function renderJobs(jobs) {
  const el = document.getElementById('job-list');
  if (!el) return;
  if (!S.dataReady) {
    el.innerHTML = renderSkeletonList(4);
    return;
  }
  if (!jobs.length) {
    el.innerHTML = `<div class="empty"><i class="bi bi-search"></i><div class="et">${t('job.empty')}</div><div class="es">${t('job.emptyHint')}</div></div>`;
    return;
  }
  el.innerHTML = jobs.map(j => `
    <div class="jc" onclick="openJob('${j.id}')">
      <div class="jct">
        <div><div class="jt">${ICONS[j.type]||''} ${getJobTitle(j)}</div><div class="je">${j.emp} · ${getJobAgo(j)}</div></div>
        ${j.apps.some(isCurrentUserApplicant) ? `<span class="badge ba">${t('job.statusApplied')}</span>` : `<span class="badge bg">${t('job.statusOpen')}</span>`}
      </div>
      <div class="jm">
        <span class="chip chip-p">${formatPay(j.pay, j.dur)}</span>
        ${j.time ? `<span class="chip"><i class="bi bi-clock-history"></i> ${getJobTime(j)}</span>` : ''}
        ${getJobLocation(j) ? `<span class="chip"><i class="bi bi-pin-map"></i> ${getJobLocation(j)}</span>` : ''}
        <span class="chip"><i class="bi bi-geo-alt"></i> ${j.dist}km</span>
        <span class="chip"><i class="bi bi-people"></i> ${j.apps.length}</span>
        ${S.role==='mate' ? `<span class="chip chip-m"><i class="bi bi-cpu"></i> NFC</span>` : ''}
      </div>
    </div>`).join('');
  animateCollection(el, '.jc');
}

function hasActiveBrowseFilters() {
  const f = S.browseFilters;
  return f.type !== 'all' || f.dur !== 'all' || String(f.maxDist).trim() !== '' || f.openOnly;
}

function syncBrowseFilterButtonState() {
  const btn = document.getElementById('browse-filter-btn');
  if (!btn) return;
  btn.classList.toggle('active', hasActiveBrowseFilters());
}

function openBrowseFilterModal() {
  const modal = document.getElementById('browse-filter-modal');
  if (!modal) return;
  const f = S.browseFilters;
  const type = document.getElementById('bf-type');
  const dur = document.getElementById('bf-dur');
  const maxDist = document.getElementById('bf-max-dist');
  const openOnly = document.getElementById('bf-open-only');
  if (type) type.value = f.type;
  if (dur) dur.value = f.dur;
  if (maxDist) maxDist.value = f.maxDist;
  if (openOnly) openOnly.checked = Boolean(f.openOnly);
  modal.classList.add('open');
}

function applyBrowseFilters() {
  const type = document.getElementById('bf-type')?.value || 'all';
  const dur = document.getElementById('bf-dur')?.value || 'all';
  const maxDist = document.getElementById('bf-max-dist')?.value || '';
  const openOnly = Boolean(document.getElementById('bf-open-only')?.checked);
  S.browseFilters = { type, dur, maxDist, openOnly };
  closeModal('browse-filter-modal');
  filterJobs(S.browseQuery || '');
}

function resetBrowseFilters() {
  S.browseFilters = { type: 'all', dur: 'all', maxDist: '', openOnly: false };
  const type = document.getElementById('bf-type');
  const dur = document.getElementById('bf-dur');
  const maxDist = document.getElementById('bf-max-dist');
  const openOnly = document.getElementById('bf-open-only');
  if (type) type.value = 'all';
  if (dur) dur.value = 'all';
  if (maxDist) maxDist.value = '';
  if (openOnly) openOnly.checked = false;
  filterJobs(S.browseQuery || '');
}

function filterJobs(q) {
  S.browseQuery = typeof q === 'string' ? q : (S.browseQuery || '');
  const query = (S.browseQuery || '').toLowerCase();
  const f = S.browseFilters;
  const maxDist = Number(f.maxDist);
  renderJobs(JOBS.filter(j => {
    const text = [getJobTitle(j), j.title, getJobDescription(j), j.desc, getJobLocation(j), j.loc, j.emp, t('jobType.'+j.type), j.type]
      .filter(Boolean).join(' ').toLowerCase();
    const matchesQuery = text.includes(query);
    const matchesType = f.type === 'all' || j.type === f.type;
    const matchesDur = f.dur === 'all' || j.dur === f.dur;
    const matchesOpen = !f.openOnly || j.status === 'open';
    const matchesDist = !Number.isFinite(maxDist) || maxDist <= 0 || Number(j.dist || 0) <= maxDist;
    return matchesQuery && matchesType && matchesDur && matchesOpen && matchesDist;
  }));
  syncBrowseFilterButtonState();
}

function renderJobDetail(id) {
  const j = [...JOBS, ...EJOBS].find(x => x.id === id);
  if (!j) return;
  S.job = j;
  const employerRating = getDisplayRating(j.ownerPhone, 0);
  const locationMarkup = getJobLocation(j)
    ? `<div class="ds"><h3>${t('job.workLocation')}</h3>
        <div class="job-location-card">
          <div class="job-location-icon"><i class="bi bi-pin-map-fill"></i></div>
          <div class="job-location-content">
            <div class="job-location-text">${getJobLocation(j)}</div>
            <div class="job-location-sub">${t('job.locationShared')}</div>
            <button class="job-location-btn" type="button" onclick="openJobLocationMap('${j.id}')">
              <i class="bi bi-map"></i>
              <span>${t('job.viewMap')}</span>
            </button>
          </div>
        </div>
      </div>`
    : '';
  document.getElementById('dh').innerHTML = `
    <button onclick="back()" style="background:rgba(255,255,255,.16);border:none;color:#fff;padding:6px 12px;border-radius:99px;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font);margin-bottom:16px;display:inline-flex;align-items:center;gap:6px"><i class="bi bi-arrow-left"></i> ${t('job.back')}</button>
    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;opacity:.7;margin-bottom:10px">${ICONS[j.type]||''} ${t('jobType.'+j.type)}</div>
    <div class="dt">${getJobTitle(j)}</div><div class="de">${j.emp}</div>
    <div class="dp"><div class="dpv">Rs${j.pay}</div><div class="dpu">${getDurationLabel(j.dur)}</div></div>`;
  document.getElementById('db').innerHTML = `
    <div class="ds"><h3>${t('job.about')}</h3><p style="font-size:15px;line-height:1.6;color:var(--ts)">${getJobDescription(j)}</p></div>
    <div class="ds"><h3>${t('job.details')}</h3><div style="display:flex;flex-wrap:wrap;gap:8px">
      ${j.time ? `<span class="chip"><i class="bi bi-clock-history"></i> ${getJobTime(j)}</span>` : ''}
      ${getJobLocation(j) ? `<span class="chip"><i class="bi bi-pin-map"></i> ${getJobLocation(j)}</span>` : ''}
      <span class="chip"><i class="bi bi-geo-alt"></i> ${j.dist||0}km</span>
      <span class="chip"><i class="bi bi-clock"></i> ${getJobAgo(j)}</span>
      <span class="chip"><i class="bi bi-people"></i> ${t('job.appliedCount', { count: j.apps.length })}</span>
    </div></div>${locationMarkup}
    <div class="ds"><h3>${t('job.employer')}</h3>
      <div style="display:flex;align-items:center;gap:12px;background:var(--s2);padding:14px;border-radius:var(--rm)">
        <div class="av">${(j.emp||'?').charAt(0)}</div>
        <div><div style="font-weight:700">${j.emp}</div><div style="font-size:12px;color:var(--tm);margin-top:2px"><i class="bi bi-star-fill"></i> ${employerRating} · ${t('job.jobsPosted')}</div></div>
      </div></div>`;
  const applied = j.apps.includes('You');
  const appliedByCurrent = j.apps.some(isCurrentUserApplicant);
  let foot = '';
  if (S.role === 'mate') {
    foot = `<div style="display:flex;gap:10px"><button class="btn btn-out-m btn-sm" onclick="back()"><i class="bi bi-arrow-left"></i> ${t('job.back')}</button><button class="btn btn-m" onclick="pg('page-mate')"><i class="bi bi-cpu"></i> ${t('job.nfcAssign')}</button></div>`;
  } else if (S.role === 'employer') {
    foot = `<button class="btn btn-p" onclick="openApplicantsPage('${j.id}', 'page-detail')">${t('job.viewApplicants', { count: j.apps.length })}</button>`;
  } else {
    foot = `<button class="btn btn-p" id="apply-btn" onclick="applyJob()" ${appliedByCurrent ? 'disabled style="opacity:.6"' : ''}>${appliedByCurrent ? t('job.statusApplied') : t('job.applyNow')}</button>`;
  }
  document.getElementById('df').innerHTML = foot;
  return j;
}

function openJob(id) {
  if (!renderJobDetail(id)) return;
  pg('page-detail');
}

function applyJob() {
  const j = S.job;
  const applicant = currentApplicantName();
  if (!j || j.apps.some(isCurrentUserApplicant)) return;
  j.apps.push(applicant);
  void BACKEND.saveApplication(j.id, applicant, S.user?.phone || '').catch(() => {});
  const btn = document.getElementById('apply-btn');
  if (btn) { btn.textContent = t('job.statusApplied'); btn.disabled = true; btn.style.opacity = '.6'; }
  toast(t('job.appliedToast'), 'ok');
}

// ── My Jobs ────────────────────────────────────────────────────────
function renderMyJobs() {
  const applied = JOBS.filter(j => j.apps.some(isCurrentUserApplicant));
  const el = document.getElementById('myjobs-list');
  if (!el) return;
  if (!S.dataReady) {
    el.innerHTML = renderSkeletonList(3);
    return;
  }
  if (!applied.length) {
    el.innerHTML = `<div class="empty"><i class="bi bi-clipboard-data"></i><div class="et">${t('myjobs.noApplications')}</div><div class="es">${t('myjobs.noApplicationsHint')}</div></div>`;
    return;
  }
  el.innerHTML = applied.map(j => `
    <div class="jc" onclick="openJob('${j.id}')">
      <div class="jct"><div><div class="jt">${ICONS[j.type]||''} ${getJobTitle(j)}</div><div class="je">${j.emp}</div></div><span class="badge ba">${t('job.statusApplied')}</span></div>
      <div class="jm"><span class="chip chip-p">${formatPay(j.pay, j.dur)}</span>${j.time ? `<span class="chip"><i class="bi bi-clock-history"></i> ${getJobTime(j)}</span>` : ''}${getJobLocation(j) ? `<span class="chip"><i class="bi bi-pin-map"></i> ${getJobLocation(j)}</span>` : ''}<span class="chip"><i class="bi bi-geo-alt"></i> ${j.dist}km</span></div>
      <div style="margin-top:10px"><button class="btn btn-out btn-sm" onclick="event.stopPropagation();rateModal('${j.id}')" ${getCurrentUserRatingForJob(j.id, j.ownerPhone || '', 'employer') ? 'disabled style="opacity:.6;cursor:not-allowed"' : ''}><i class="bi bi-star"></i> ${getCurrentUserRatingForJob(j.id, j.ownerPhone || '', 'employer') ? t('rate.rated') : lt('rate.rateEmployer', 'Rate Employer')}</button></div>
    </div>`).join('');
  animateCollection(el, '.jc');
}

function switchTab(tab) {
  document.getElementById('tab-applied').classList.toggle('active', tab === 'applied');
  document.getElementById('tab-saved').classList.toggle('active', tab === 'saved');
  if (tab === 'saved') {
    document.getElementById('myjobs-list').innerHTML = `<div class="empty"><i class="bi bi-bookmark"></i><div class="et">${t('myjobs.noSaved')}</div><div class="es">${t('myjobs.noSavedHint')}</div></div>`;
  } else { renderMyJobs(); }
}

// ── Employer ───────────────────────────────────────────────────────
function renderEmp() {
  const el = document.getElementById('emp-list'); if (!el) return;
  if (!S.dataReady) {
    el.innerHTML = renderSkeletonList(3);
    return;
  }
  el.innerHTML = EJOBS.map(j => `
    <div class="jc">
      <div class="jct"><div><div class="jt">${ICONS[j.type]||''} ${getJobTitle(j)}</div><div class="je">${getJobAgo(j)}</div></div>
        ${j.status==='open' ? `<span class="badge bg">${t('job.statusOpen')}</span>` : `<span class="badge bb">${t('employer.inProgress')}</span>`}
      </div>
      <div class="jm"><span class="chip chip-p">${formatPay(j.pay, j.dur)}</span>${j.time ? `<span class="chip"><i class="bi bi-clock-history"></i> ${getJobTime(j)}</span>` : ''}${getJobLocation(j) ? `<span class="chip"><i class="bi bi-pin-map"></i> ${getJobLocation(j)}</span>` : ''}<span class="chip"><i class="bi bi-people"></i> ${t('job.appliedCount', { count: j.apps.length })}</span></div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn btn-out btn-sm" onclick="openApplicantsPage('${j.id}', 'page-employer')"><i class="bi bi-people"></i> ${t('applicants.title')}</button>
        <button class="btn btn-danger-soft btn-sm" onclick="deleteEmployerJob('${j.id}')"><i class="bi bi-trash"></i> Delete</button>
      </div>
    </div>`).join('');
  animateCollection(el, '.jc');
}

async function deleteEmployerJob(jobId) {
  const job = [...JOBS, ...EJOBS].find(item => item.id === jobId);
  if (!job) return;
  const ok = window.confirm(`Delete "${getJobTitle(job)}"?`);
  if (!ok) return;

  JOBS = JOBS.filter(item => item.id !== jobId);
  EJOBS = EJOBS.filter(item => item.id !== jobId);
  S.assigns = S.assigns.filter(item => item.jid !== jobId);
  RATINGS = RATINGS.filter(item => item.jobId !== jobId);
  if (S.job?.id === jobId) S.job = null;
  if (S.applicantView?.jobId === jobId) S.applicantView = null;

  try {
    await BACKEND.deleteJob(jobId);
  } catch (error) {
    toast('Could not delete job. Please try again.');
    syncEmployerJobs();
    return;
  }

  toast('Job deleted', 'ok');
  if (document.getElementById('page-apps')?.classList.contains('active') || document.getElementById('page-applicant-profile')?.classList.contains('active') || document.getElementById('page-detail')?.classList.contains('active')) {
    pg('page-employer', { skipPrev: true });
    return;
  }
  renderEmp();
}

function renderApplicants() {
  const j = S.job; if (!j) return;
  const el = document.getElementById('apps-body'); if (!el) return;
  if (!S.dataReady) {
    el.innerHTML = renderSkeletonList(3);
    return;
  }
  const hireState = getActiveHireState(j);
  if (!j.apps?.length) {
    el.innerHTML = `<div class="empty"><i class="bi bi-person"></i><div class="et">${t('applicants.noApplicants')}</div></div>`;
    return;
  }
  el.innerHTML = `<div class="st" style="margin-bottom:12px">${t('applicants.for', { title: getJobTitle(j) })}</div>` +
    j.apps.map((name, i) => `
      <div class="ar applicant-row" onclick="openApplicantProfile('${name.replace(/'/g, "\\'")}', ${i})">
        <div class="av" style="${getAvatarStyle(getApplicantProfileData(name, i))}">${name.charAt(0)}</div>
        <div style="flex:1"><div style="font-weight:700;font-size:15px">${getApplicantProfileData(name, i).name}</div><div style="font-size:12px;color:var(--tm);margin-top:2px"><i class="bi bi-star-fill"></i> ${getApplicantProfileData(name, i).rating || 0} · ${getApplicantProfileData(name, i).jobs || 0} ${t('profile.jobsDone').toLowerCase()}</div></div>
        <div class="applicant-actions">
          <button class="btn btn-out btn-sm" onclick="event.stopPropagation();openApplicantProfile('${name.replace(/'/g, "\\'")}', ${i})">${t('applicants.viewProfile')}</button>
          ${hireState && normalizeName(hireState.name) === normalizeName(name) ? `<button class="btn btn-out btn-sm" onclick="event.stopPropagation();rateModal('${j.id}', { targetPhone: '${(getApplicantProfileData(name, i).phone || '').replace(/'/g, "\\'")}', targetName: '${getApplicantProfileData(name, i).name.replace(/'/g, "\\'")}', targetRole: 'worker' })" ${getCurrentUserRatingForJob(j.id, getApplicantProfileData(name, i).phone || '', 'worker') ? 'disabled style="opacity:.6;cursor:not-allowed"' : ''}><i class="bi bi-star"></i> ${getCurrentUserRatingForJob(j.id, getApplicantProfileData(name, i).phone || '', 'worker') ? t('rate.rated') : lt('rate.rateWorker', 'Rate Worker')}</button>` : ''}
          <button class="btn ${hireState && normalizeName(hireState.name) === normalizeName(name) ? 'btn-sec' : 'btn-p'} btn-sm" onclick="event.stopPropagation();hire('${name.replace(/'/g, "\\'")}', ${i})" ${hireState ? 'disabled style="opacity:.6;cursor:not-allowed"' : ''}>${hireState && normalizeName(hireState.name) === normalizeName(name) ? t('applicants.hired') : t('applicants.hire')}</button>
        </div>
      </div>`).join('');
  animateCollection(el, '.ar');
}

function openApplicantProfile(name, index = 0) {
  const j = S.job;
  if (!j) return;
  S.applicantView = {
    jobId: j.id,
    name,
    index,
    profile: getApplicantProfileData(name, index)
  };
  pg('page-applicant-profile');
}

function openApplicantsPage(jobId, returnPage = null) {
  const job = [...JOBS, ...EJOBS].find(x => x.id === jobId);
  if (!job) return;
  S.job = job;
  S.appsReturnPage = returnPage || document.querySelector('.page.active')?.id || getDefaultHomePage();
  pg('page-apps');
}

function renderApplicantProfile() {
  const container = document.getElementById('applicant-profile-body');
  const applicant = S.applicantView;
  const job = S.job;
  if (!container || !applicant || !job) return;
  if (!S.dataReady) {
    container.innerHTML = renderSkeletonList(1);
    return;
  }
  const hireState = getActiveHireState(job);
  const isHiredApplicant = Boolean(hireState && normalizeName(hireState.name) === normalizeName(applicant.name));
  const ratedWorker = getCurrentUserRatingForJob(job.id, applicant.profile.phone || '', 'worker');
  container.innerHTML = `
    <div class="applicant-profile-card">
      <div class="applicant-profile-head">
        <div class="applicant-profile-avatar" style="${getAvatarStyle(applicant.profile)}">${applicant.profile.av}</div>
        <div style="flex:1;min-width:0">
          <div class="applicant-profile-name">${applicant.profile.name}</div>
          <div class="applicant-profile-meta"><i class="bi bi-briefcase"></i> ${applicant.profile.skill}</div>
          <div class="applicant-profile-meta"><i class="bi bi-star-fill"></i> ${applicant.profile.rating} · ${applicant.profile.jobs} ${t('profile.jobsDone').toLowerCase()}</div>
        </div>
        ${isHiredApplicant ? `<span class="badge bg">${t('applicants.hired')}</span>` : ''}
      </div>
      <div class="st" style="margin-bottom:12px">${t('applicants.for', { title: getJobTitle(job) })}</div>
      <div class="pr"><div class="pri"><i class="bi bi-phone"></i></div><div class="prl">${t('profile.phone')}</div><div class="prv">${applicant.profile.phone}</div></div>
      <div class="pr"><div class="pri"><i class="bi bi-geo-alt"></i></div><div class="prl">${t('profile.location')}</div><div class="prv">${applicant.profile.loc}</div></div>
      <div class="pr"><div class="pri"><i class="bi bi-tools"></i></div><div class="prl">Skill</div><div class="prv">${applicant.profile.skill}</div></div>
      ${isHiredApplicant ? `<div class="applicant-hire-note applicant-cancel-window" style="margin-top:14px">${t('applicants.cancelWindow', { time: formatRemainingHireTime(hireState.expiresAt) })}</div>` : (hireState ? `<div class="applicant-hire-note" style="margin-top:14px">${t('applicants.hireLocked', { name: hireState.name })}</div>` : '')}
      <div class="applicant-profile-actions">
        ${isHiredApplicant ? `<button class="btn btn-out" onclick="rateModal('${job.id}', { targetPhone: '${(applicant.profile.phone || '').replace(/'/g, "\\'")}', targetName: '${applicant.profile.name.replace(/'/g, "\\'")}', targetRole: 'worker' })" ${ratedWorker ? 'disabled style="opacity:.6;cursor:not-allowed"' : ''}>${ratedWorker ? t('rate.rated') : lt('rate.rateWorker', 'Rate Worker')}</button>` : ''}
        <button class="btn ${isHiredApplicant ? 'btn-sec' : 'btn-p'}" onclick="hire('${applicant.name.replace(/'/g, "\\'")}', ${applicant.index})" ${hireState ? 'disabled style="opacity:.6;cursor:not-allowed"' : ''}>${isHiredApplicant ? t('applicants.hired') : t('applicants.hire')}</button>
        ${isHiredApplicant ? `<button class="btn btn-danger-soft" onclick="cancelHire()">${t('applicants.cancelHire')}</button>` : ''}
      </div>
    </div>`;
  animateCollection(container, '.applicant-profile-card, .pr, .btn');
}

function hire(name, index = 0) {
  const j = S.job;
  if (!j || getActiveHireState(j)) return;
  const now = Date.now();
  const applicant = getApplicantProfileData(name, index);
  setJobHireState(j, {
    name,
    index,
    phone: applicant.phone || '',
    hiredAt: now,
    expiresAt: now + HIRE_CANCEL_WINDOW_MS
  });
  toast(t('job.selected', { name }), 'ok');
  renderApplicants();
  if (S.applicantView && normalizeName(S.applicantView.name) === normalizeName(name)) renderApplicantProfile();
}

function cancelHire() {
  const j = S.job;
  if (!j || !getActiveHireState(j)) return;
  setJobHireState(j, null);
  toast(t('applicants.hireCanceled'), 'ok');
  renderApplicants();
  if (document.getElementById('page-applicant-profile')?.classList.contains('active')) renderApplicantProfile();
}

function refreshApplicantViewsIfNeeded() {
  const activePage = document.querySelector('.page.active')?.id;
  const job = S.job;
  if (!job || (activePage !== 'page-apps' && activePage !== 'page-applicant-profile')) return;
  const hadHireState = Boolean(job.hireState);
  const hireState = getActiveHireState(job);
  if (!hireState) {
    if (hadHireState) {
      if (activePage === 'page-apps') renderApplicants();
      if (activePage === 'page-applicant-profile') renderApplicantProfile();
    }
    return;
  }
  if (activePage === 'page-applicant-profile') {
    const note = document.querySelector('#page-applicant-profile .applicant-cancel-window');
    if (note) note.textContent = t('applicants.cancelWindow', { time: formatRemainingHireTime(hireState.expiresAt) });
  }
}

// ── Post Job ───────────────────────────────────────────────────────
function selType(btn, type) {
  document.querySelectorAll('.tb').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel'); S.type = type;
}
function selDur(btn, dur) {
  document.querySelectorAll('.db2').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel'); S.dur = dur;
}
function setPostLocationButtonState() {
  const btn = document.getElementById('post-location-btn');
  const label = document.getElementById('post-location-btn-label');
  const icon = btn?.querySelector('i');
  if (!btn || !label || !icon) return;
  btn.disabled = S.isFetchingLocation;
  btn.classList.toggle('loading', S.isFetchingLocation);
  icon.className = S.isFetchingLocation ? 'bi bi-arrow-repeat' : 'bi bi-geo-alt-fill';
  label.textContent = t(S.isFetchingLocation ? 'post.fetchingLocation' : 'post.fetchLocation');
}
function setSignupLocationButtonState() {
  const btn = document.getElementById('signup-location-btn');
  const label = document.getElementById('signup-location-btn-label');
  const icon = btn?.querySelector('i');
  if (!btn || !label || !icon) return;
  btn.disabled = S.isFetchingSignupLocation;
  btn.classList.toggle('loading', S.isFetchingSignupLocation);
  icon.className = S.isFetchingSignupLocation ? 'bi bi-arrow-repeat' : 'bi bi-geo-alt-fill';
  label.textContent = t(S.isFetchingSignupLocation ? 'signup.fetchingLocation' : 'signup.fetchLocation');
}
function syncSignupLocationUI() {
  const hint = document.getElementById('signup-location-hint');
  const input = document.getElementById('s-loc');
  setSignupLocationButtonState();
  if (!hint || !input) return;
  const value = input.value.trim();
  hint.textContent = value
    ? t('signup.locationFilledHint', { location: value })
    : t('signup.locationHint');
}
function syncPostLocationUI() {
  const hint = document.getElementById('post-location-hint');
  const input = document.getElementById('post-location');
  setPostLocationButtonState();
  if (!hint || !input) return;
  const value = input.value.trim();
  hint.textContent = value
    ? t('post.locationFilledHint', { location: value })
    : t('post.locationHint');
}
function getCurrentPosition(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}
function formatReverseLocation(data, lat, lon) {
  const addr = data?.address || {};
  const parts = [
    addr.suburb || addr.neighbourhood || addr.city_district || addr.hamlet,
    addr.city || addr.town || addr.village || addr.county,
    addr.state
  ].filter(Boolean).filter((part, index, list) => list.indexOf(part) === index);
  if (parts.length) return parts.join(', ');
  if (data?.display_name) return data.display_name.split(',').slice(0, 3).join(', ').trim();
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}
async function reverseGeocodeLocation(lat, lon) {
  try {
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(lat),
      lon: String(lon),
      zoom: '18',
      addressdetails: '1'
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) throw new Error('reverse geocode failed');
    const data = await response.json();
    return formatReverseLocation(data, lat, lon);
  } catch (error) {
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  }
}
async function fillCurrentLocation() {
  const input = document.getElementById('post-location');
  if (!input || S.isFetchingLocation) return;
  if (!navigator.geolocation) {
    toast(t('toast.locationUnsupported'));
    return;
  }
  try {
    S.isFetchingLocation = true;
    syncPostLocationUI();
    const position = await getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
    const location = await reverseGeocodeLocation(position.coords.latitude, position.coords.longitude);
    S.postLocationPin = {
      lat: position.coords.latitude,
      lon: position.coords.longitude
    };
    input.value = location;
    syncPostLocationUI();
    toast(t('toast.locationFetched'), 'ok');
  } catch (error) {
    const denied = error?.code === 1;
    toast(t(denied ? 'toast.locationPermissionDenied' : 'toast.locationUnavailable'));
  } finally {
    S.isFetchingLocation = false;
    syncPostLocationUI();
  }
}
async function fillSignupLocation() {
  const input = document.getElementById('s-loc');
  if (!input || S.isFetchingSignupLocation) return;
  if (!navigator.geolocation) {
    toast(t('toast.locationUnsupported'));
    return;
  }
  try {
    S.isFetchingSignupLocation = true;
    syncSignupLocationUI();
    const position = await getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
    const location = await reverseGeocodeLocation(position.coords.latitude, position.coords.longitude);
    input.value = location;
    syncSignupLocationUI();
    toast(t('toast.locationFetched'), 'ok');
  } catch (error) {
    const denied = error?.code === 1;
    toast(t(denied ? 'toast.locationPermissionDenied' : 'toast.locationUnavailable'));
  } finally {
    S.isFetchingSignupLocation = false;
    syncSignupLocationUI();
  }
}
function postJob() {
  const title = document.getElementById('post-title').value.trim();
  const time  = document.getElementById('post-time').value.trim();
  const pay   = document.getElementById('post-pay').value.trim();
  const location = document.getElementById('post-location').value.trim();
  if (!title || !pay) { toast(t('post.fillTitleAndPay')); return; }
  if (!location) { toast(t('toast.addLocation')); return; }
  const newJob = { id:'e'+Date.now(), title, type:S.type, pay:parseInt(pay,10), dur:S.dur,
    time,
    desc: document.getElementById('post-desc').value.trim() || t('post.noDescription'),
    loc: location, pin: S.postLocationPin ? { ...S.postLocationPin } : null, dist:0, status:'open', apps:[], ago:'just now', emp:S.user?.name||'You', ownerRole:S.role || 'employer', ownerPhone:S.user?.phone || '', ownerName:S.user?.name || 'You' };
  EJOBS.unshift(newJob); JOBS.unshift({...newJob, dist:0.1});
  void BACKEND.saveJob(newJob, S.user).catch(() => {});
  document.getElementById('post-title').value = '';
  document.getElementById('post-time').value  = '';
  document.getElementById('post-pay').value   = '';
  document.getElementById('post-desc').value  = '';
  document.getElementById('post-location').value = '';
  S.postLocationPin = null;
  syncPostLocationUI();
  toast(t('post.jobPosted'), 'ok');
  pg('page-employer');
  populateMateJobs();
}

// ── wapp-mate ──────────────────────────────────────────────────────
function renderMate() {
  if (S.user) {
    document.getElementById('mate-name').textContent = S.user.name.split(' ')[0];
    if (!S.dataReady) {
      document.getElementById('m-assigned').textContent = '...';
      document.getElementById('m-done').textContent = '...';
      document.getElementById('m-earn').textContent = '...';
    } else {
      document.getElementById('m-assigned').textContent = S.assigns.filter(a=>a.status==='assigned').length;
      document.getElementById('m-done').textContent     = S.user.jobs || 0;
      document.getElementById('m-earn').textContent     = 'Rs'+(S.assigns.filter(a=>a.status==='done').length*20);
    }
  }
  populateMateJobs();
  renderMateWorkers();
  renderMateActive();
  renderMateOfflineSection();
}

function populateMateJobs() {
  const sel = document.getElementById('mate-job-sel'); if (!sel) return;
  const current = sel.value;
  if (!S.dataReady) {
    sel.innerHTML = `<option value="">${t('mate.selectJobOption')}</option><option disabled>${lt('common.loading', 'Loading jobs...')}</option>`;
    return;
  }
  sel.innerHTML = `<option value="">${t('mate.selectJobOption')}</option>` +
    JOBS.filter(j=>j.status==='open').map(j=>`<option value="${j.id}">${getJobTitle(j)} · ${formatPay(j.pay, j.dur)}</option>`).join('');
  if (current && sel.querySelector(`option[value="${current}"]`)) sel.value = current;
}

function renderMateWorkers() {
  const el = document.getElementById('mate-workers'); if (!el) return;
  const jid = document.getElementById('mate-job-sel')?.value;
  if (!jid) { el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--tm);font-size:13px">${t('mate.selectAbove')}</div>`; return; }
  if (!S.dataReady) {
    el.innerHTML = renderSkeletonList(3);
    return;
  }
  if (!WORKERS.length) {
    el.innerHTML = `<div class="empty" style="padding:24px 20px"><i class="bi bi-people"></i><div class="et">No workers yet</div><div class="es">Add workers from backend data</div></div>`;
    return;
  }
  const assignments = S.assigns.filter(a => a.jid === jid);
  const filteredWorkers = filterOfflineWorkers(WORKERS);
  if (!filteredWorkers.length) {
    el.innerHTML = `
      <div class="fg" style="margin-bottom:12px">
        <div class="fl">Search Worker</div>
        <div class="iw"><i class="bi bi-search ii"></i><input class="fi" type="text" id="mate-worker-search" placeholder="Search by name, WAPP ID or UID" value="${String(S.offlineWorkerQuery || '').replace(/"/g, '&quot;')}" oninput="setOfflineWorkerQuery(this.value)"></div>
      </div>
      <div class="empty" style="padding:24px 20px"><i class="bi bi-search"></i><div class="et">No worker found</div><div class="es">Try the worker name or WAPP ID</div></div>
    `;
    return;
  }
  el.innerHTML = `
    <div class="fg" style="margin-bottom:12px">
      <div class="fl">Search Worker</div>
      <div class="iw"><i class="bi bi-search ii"></i><input class="fi" type="text" id="mate-worker-search" placeholder="Search by name, WAPP ID or UID" value="${String(S.offlineWorkerQuery || '').replace(/"/g, '&quot;')}" oninput="setOfflineWorkerQuery(this.value)"></div>
    </div>
    <div class="st" style="margin-bottom:8px"><i class="bi bi-people"></i> ${t('mate.workersTap')}</div>` +
    filteredWorkers.map(w => {
      const assignment = assignments.find(a => normalizeWorkerCode(a.wid) === normalizeWorkerCode(w.id));
      const isDone = assignment?.status === 'done';
      const isAssigned = assignment?.status === 'assigned';
      const isScanTarget = mateScanState === 'scanning' && S.mateScanTarget?.jid === jid && normalizeWorkerCode(S.mateScanTarget?.wid) === normalizeWorkerCode(w.id);
      const isAnotherWorkerBlocked = mateScanState === 'scanning' && S.mateScanTarget?.jid === jid && !isScanTarget;
      return `<div class="war" id="row-${w.id}">
        <div class="av mav">${w.name.charAt(0)}</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:14px">${w.name}</div>
          <div style="font-size:12px;color:var(--tm);margin-top:2px">${getWorkerSkill(w)} · ${w.loc}</div>
          <div style="display:flex;gap:6px;margin-top:5px;flex-wrap:wrap">
            <span class="nfc-pill"><i class="bi bi-credit-card-2-front"></i> ${w.nfc}</span>
            ${w.offline ? `<span class="nfc-pill"><i class="bi bi-person-badge"></i> No phone</span>` : ''}
            <span style="font-size:11px;color:var(--tm)">${getWorkerAvailability(w)}</span>
          </div>
        </div>
        <button class="tap-btn ${isAssigned ? 'tapped' : ''} ${isScanTarget ? 'scanning' : ''}" id="tap-${w.id}"
          onclick="${isAnotherWorkerBlocked ? '' : `startWorkerScanAssignment('${jid}','${w.id}','${w.name.replace(/'/g, "\\'")}')`}" ${isAnotherWorkerBlocked ? 'disabled' : ''}>
          ${isDone
            ? `<i class="bi bi-cpu"></i> ${t('mate.tapAssign')}`
            : isScanTarget
              ? `<i class="bi bi-hourglass-split"></i> Scanning...`
              : isAssigned
                ? `<i class="bi bi-arrow-repeat"></i> ${t('mate.confirmDone')}`
                : `<i class="bi bi-cpu"></i> ${t('mate.tapAssign')}`}
        </button>
      </div>`;
    }).join('');
  animateCollection(el, '.war');
}

function nfcTap(jid, wid, name) {
  startWorkerScanAssignment(jid, wid, name);
}

function renderMateActive() {
  const el = document.getElementById('mate-active'); if (!el) return;
  if (!S.dataReady) {
    el.innerHTML = renderSkeletonList(3);
    return;
  }
  if (!S.assigns.length) {
    el.innerHTML = `<div class="empty" style="padding:28px 20px"><i class="bi bi-broadcast-pin"></i><div class="et">${t('mate.noAssignmentsYet')}</div><div class="es">${t('mate.noAssignmentsHint')}</div></div>`;
    return;
  }
  el.innerHTML = S.assigns.map(a => {
    const j = JOBS.find(x=>x.id===a.jid);
    const payout = Math.round((j?.pay||0)*0.9);
    return `<div class="aac">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px">
        <div><div style="font-weight:700;font-size:15px">${ICONS[j?.type]||''} ${j ? getJobTitle(j) : t('job.unknown')}</div>
          <div style="font-size:12px;color:var(--tm);margin-top:2px">${t('mate.workerLabel')}: ${a.name}</div></div>
        <span class="badge ${a.status==='done'?'bg':'bm'}">${a.status==='done' ? `<i class="bi bi-check-circle"></i> ${t('mate.done')}` : `<i class="bi bi-lightning-charge"></i> ${t('mate.active')}`}</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
        <span class="nfc-pill"><i class="bi bi-cpu"></i> ${t('mate.nfcAssigned')}</span>
        <span class="chip">Rs${j?.pay||0}</span><span class="chip">+Rs20 ${t('mate.incentives').toLowerCase()}</span>
      </div>
      ${a.status!=='done'
        ? `<div style="display:flex;gap:8px"><button class="btn btn-sec btn-sm">${t('mate.verifyInApp')}</button><button class="btn btn-m btn-sm" onclick="mateComplete('${a.jid}','${a.wid}')">${t('mate.confirmDone')}</button></div>`
        : `<div style="font-size:12px;color:var(--tm)">${t('mate.payoutPending', { payout })}</div>`}
    </div>`;
  }).join('');
  animateCollection(el, '.aac');
}

function renderOfflinePayoutForm() {
  const type = S.offlineJoinType || 'upi';
  if (type === 'bank') {
    return `
      <div class="fg"><div class="fl">Account Holder Name</div><div class="iw"><i class="bi bi-person ii"></i><input class="fi" type="text" id="ow-bank-name" placeholder="As per bank records"></div></div>
      <div class="fg"><div class="fl">Account Number</div><div class="iw"><i class="bi bi-hash ii"></i><input class="fi" type="tel" id="ow-bank-num" placeholder="Enter account number"></div></div>
      <div class="fg"><div class="fl">Confirm Account Number</div><div class="iw"><i class="bi bi-hash ii"></i><input class="fi" type="tel" id="ow-bank-num2" placeholder="Re-enter account number"></div></div>
      <div class="fg"><div class="fl">IFSC Code</div><div class="iw"><i class="bi bi-diagram-2 ii"></i><input class="fi" type="text" id="ow-bank-ifsc" placeholder="e.g. SBIN0001234" style="text-transform:uppercase"></div></div>
      <div class="fg"><div class="fl">Bank Name</div><div class="iw"><i class="bi bi-building ii"></i><input class="fi" type="text" id="ow-bank-bank" placeholder="e.g. State Bank of India"></div></div>
    `;
  }
  return `
    <div class="fg"><div class="fl">UPI ID</div><div class="iw"><i class="bi bi-phone ii"></i><input class="fi" type="text" id="ow-upi-id" placeholder="name@upi"></div></div>
  `;
}

function renderMateOfflineSection() {
  const el = document.getElementById('mate-offline-section');
  if (!el) return;
  const workers = filterOfflineWorkers(OFFLINE_WORKERS.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
  el.innerHTML = `
    <div class="ic mi" style="margin-bottom:12px">
      <i class="bi bi-info-circle" style="margin-right:6px;color:var(--p)"></i>
      Add workers who do not have a phone. We create a WAPP ID for them and save the payout details for future jobs.
    </div>
    <div class="pay-method-card">
      <div class="fg"><div class="fl">Worker Name</div><div class="iw"><i class="bi bi-person ii"></i><input class="fi" type="text" id="ow-name" placeholder="Enter worker name"></div></div>
      <div class="fg"><div class="fl">Location / Area</div><div class="iw"><i class="bi bi-geo-alt ii"></i><input class="fi" type="text" id="ow-loc" placeholder="Village, city or area"></div></div>
      <div class="fg"><div class="fl">Primary Skill</div><div class="iw"><i class="bi bi-tools ii"></i><input class="fi" type="text" id="ow-skill" placeholder="Farm work, delivery, helper, etc"></div></div>
      <div class="fg"><div class="fl">Availability</div>
        <select class="fi" id="ow-avail" style="padding-left:14px">
          <option value="Available">Available</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Morning">Morning</option>
          <option value="Evening">Evening</option>
          <option value="Weekends">Weekends</option>
        </select>
      </div>
      <div class="st" style="margin:6px 0 10px">Payout Method</div>
      <div style="display:flex;gap:10px;margin-bottom:16px">
        <button class="pay-type-btn ${S.offlineJoinType !== 'bank' ? 'active' : ''}" type="button" onclick="setOfflineJoinType('upi', this)">
          <i class="bi bi-phone"></i> UPI
        </button>
        <button class="pay-type-btn ${S.offlineJoinType === 'bank' ? 'active' : ''}" type="button" onclick="setOfflineJoinType('bank', this)">
          <i class="bi bi-bank"></i> Bank
        </button>
      </div>
      <div id="ow-payout-form">${renderOfflinePayoutForm()}</div>
      <div class="fg"><div class="fl">Notes</div><div class="iw"><i class="bi bi-chat-left-text ii"></i><input class="fi" type="text" id="ow-notes" placeholder="Optional notes"></div></div>
      <button class="btn btn-p" type="button" onclick="saveOfflineWorker()"><i class="bi bi-person-plus"></i> Join Worker</button>
    </div>
    <div class="fg">
      <div class="fl">Search Offline Worker</div>
      <div class="iw"><i class="bi bi-search ii"></i><input class="fi" type="text" id="ow-search" placeholder="Search by name, WAPP ID or UID" value="${String(S.offlineWorkerQuery || '').replace(/"/g, '&quot;')}" oninput="setOfflineWorkerQuery(this.value)"></div>
    </div>
    <div class="st" style="margin:16px 0 10px">Joined workers (${workers.length})</div>
    <div class="mate-offline-list">
      ${workers.length ? workers.map(worker => `
        <div class="war">
          <div class="av mav">${worker.name.charAt(0)}</div>
          <div style="flex:1">
            <div style="font-weight:700;font-size:14px">${worker.name}</div>
            <div style="font-size:12px;color:var(--tm);margin-top:2px">${worker.skill} - ${worker.loc}</div>
            <div style="display:flex;gap:6px;margin-top:5px;flex-wrap:wrap">
              <span class="nfc-pill"><i class="bi bi-credit-card-2-front"></i> ${worker.workerCode}</span>
              <span class="nfc-pill"><i class="bi bi-wallet2"></i> ${worker.payoutMethod === 'bank' && worker.bankAccount ? `**** ${worker.bankAccount.last4 || ''}` : worker.upiId || 'UPI'}</span>
              <span class="nfc-pill"><i class="bi bi-clock"></i> ${worker.availability || 'Available'}</span>
            </div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-m btn-sm" type="button" onclick="startWorkerScanAssignment('${getSelectedMateJobId()}','${worker.workerCode}','${worker.name.replace(/'/g, "\\'")}')"><i class="bi bi-broadcast-pin"></i></button>
            <button class="btn btn-sec btn-sm" type="button" onclick="copyOfflineWorkerCode('${worker.workerCode}')"><i class="bi bi-copy"></i></button>
          </div>
        </div>
      `).join('') : `
        <div class="mate-offline-empty">
          No workers without phones have been joined yet. Use the form above to add one.
        </div>
      `}
    </div>
  `;
  animateCollection(el, '.pay-method-card, .war, .pay-type-btn');
}

function setOfflineWorkerQuery(value = '') {
  S.offlineWorkerQuery = String(value || '');
  renderMateOfflineSection();
  renderMateWorkers();
}

function setOfflineJoinType(type, btn) {
  S.offlineJoinType = type === 'bank' ? 'bank' : 'upi';
  const form = document.getElementById('ow-payout-form');
  if (form) form.innerHTML = renderOfflinePayoutForm();
  document.querySelectorAll('#mate-offline-section .pay-type-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

function copyOfflineWorkerCode(code) {
  const value = String(code || '').trim();
  if (!value) return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(value).then(() => toast('WAPP ID copied', 'ok'));
  } else {
    toast('WAPP ID: ' + value, 'ok');
  }
}

async function saveOfflineWorker() {
  const name = document.getElementById('ow-name')?.value?.trim();
  const loc = document.getElementById('ow-loc')?.value?.trim();
  const skill = document.getElementById('ow-skill')?.value?.trim();
  const avail = document.getElementById('ow-avail')?.value || 'Available';
  const notes = document.getElementById('ow-notes')?.value?.trim() || '';
  const type = S.offlineJoinType === 'bank' ? 'bank' : 'upi';

  if (!name) { toast('Enter worker name'); return; }
  if (!loc) { toast('Enter location or area'); return; }
  if (!skill) { toast('Enter primary skill'); return; }

  const payload = {
    workerCode: buildOfflineWorkerCode(name),
    name,
    loc,
    skill,
    avail,
    notes,
    payoutMethod: type,
    upiId: '',
    bankAccount: null,
    createdBy: S.user?.name || 'mate',
    offline: true
  };

  if (type === 'bank') {
    const holder = document.getElementById('ow-bank-name')?.value?.trim();
    const num = document.getElementById('ow-bank-num')?.value?.trim();
    const num2 = document.getElementById('ow-bank-num2')?.value?.trim();
    const ifsc = document.getElementById('ow-bank-ifsc')?.value?.trim().toUpperCase();
    const bank = document.getElementById('ow-bank-bank')?.value?.trim();
    if (!holder) { toast('Enter account holder name'); return; }
    if (!num || num.length < 9) { toast('Enter a valid account number'); return; }
    if (num !== num2) { toast('Account numbers do not match'); return; }
    if (!ifsc || ifsc.length < 11) { toast('Enter a valid IFSC code'); return; }
    if (!bank) { toast('Enter bank name'); return; }
    payload.bankAccount = { name: holder, accountNumber: num, last4: num.slice(-4), ifsc, bank };
  } else {
    const upiId = document.getElementById('ow-upi-id')?.value?.trim();
    if (!upiId || !upiId.includes('@')) { toast('Enter a valid UPI ID'); return; }
    payload.upiId = upiId;
  }

  const localRecord = upsertOfflineWorkerLocal(payload);
  refreshWorkerRoster();
  renderMateOfflineSection();
  renderMateWorkers();

  try {
    if (BACKEND.saveOfflineWorker) {
      const remote = await BACKEND.saveOfflineWorker(payload);
      if (remote) upsertOfflineWorkerLocal(remote);
    }
    toast(`Joined ${localRecord?.name || name} as ${localRecord?.workerCode || payload.workerCode}`, 'ok');
  } catch (error) {
    toast(`Saved locally for ${localRecord?.name || name}`, 'ok');
  } finally {
    renderMate();
  }
}

function mateComplete(jid, wid) {
  const a = S.assigns.find(x=>x.jid===jid&&x.wid===wid);
  if (a) { a.status='done'; renderMateActive(); }
  void BACKEND.updateAssignmentStatus(jid, wid, 'done').catch(() => {});
  const el = document.getElementById('m-done'); if(el) el.textContent = parseInt(el.textContent)+1;
  const ee = document.getElementById('m-earn'); if(ee) ee.textContent = 'Rs'+(parseInt((ee.textContent||'').replace(/[^\d]/g,''))+20);
  if (S.role === 'mate' && S.user) syncUserDerivedStats(S.user);
  toast(t('job.markedComplete'), 'ok');
}

function setMateScanStatus(message, type = 'idle') {
  const el = document.getElementById('scan-status');
  if (!el) return;
  el.textContent = message;
  el.className = `scan-status scan-${type}`;
}

function setMateScanValue(id, value = '-') {
  const el = document.getElementById(id);
  if (el) el.textContent = value || '-';
}

function setMateScanButtonState(state = 'idle') {
  mateScanState = state;
  const startBtn = document.getElementById('scan-start-btn');
  const triggerBtn = document.getElementById('mate-scan-trigger-btn');
  const isScanning = state === 'scanning';
  const isAssigned = state === 'assigned';
  const isCompleted = state === 'completed';
  const isSuccess = isAssigned || isCompleted;

  if (startBtn) {
    startBtn.disabled = isScanning;
    if (isScanning) {
      startBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Scanning...';
      startBtn.classList.remove('btn-sec', 'scan-assigned', 'scan-completed');
      startBtn.classList.add('btn-m');
    } else if (isAssigned) {
      startBtn.innerHTML = '<i class="bi bi-check-circle"></i> Assigned';
      startBtn.classList.remove('btn-m');
      startBtn.classList.add('btn-sec', 'scan-assigned');
    } else if (isCompleted) {
      startBtn.innerHTML = '<i class="bi bi-check2-circle"></i> Complete';
      startBtn.classList.remove('btn-m');
      startBtn.classList.add('btn-sec', 'scan-completed');
    } else {
      startBtn.innerHTML = '<i class="bi bi-play-circle"></i> Start Scan';
      startBtn.classList.remove('btn-sec', 'scan-assigned', 'scan-completed');
      startBtn.classList.add('btn-m');
    }
  }

  if (triggerBtn) {
    triggerBtn.classList.toggle('tapped', isSuccess);
    triggerBtn.innerHTML = isCompleted
      ? '<i class="bi bi-check2-circle"></i> Completed'
      : isAssigned
        ? '<i class="bi bi-check-circle"></i> Assigned'
      : '<i class="bi bi-broadcast-pin"></i> Scan Card';
  }
}

function resetMateScan(hideResult = true) {
  clearInterval(mateScanTimer);
  mateScanTimer = null;
  mateScanRequestId = null;
  mateScanState = 'idle';
  if (hideResult) S.mateScanTarget = null;
  mateScanResult = {
    uid: '',
    wappId: '',
    name: '',
    access: '',
    job: '',
    time: '',
    registered: false
  };
  setMateScanButtonState('idle');
  setMateScanStatus('Ready to create a scan request.', 'idle');
  setMateScanValue('scan-request-id');
  setMateScanValue('scan-card-uid');
  setMateScanValue('scan-wapp-id');
  setMateScanValue('scan-time');
  setMateScanValue('scan-name');
  setMateScanValue('scan-bank');
  setMateScanValue('scan-access');
  setMateScanValue('scan-job');
  const result = document.getElementById('scan-result');
  if (result) result.classList.toggle('hidden', hideResult);
  renderMateWorkers();
}

function openMateScanModal() {
  if (mateScanState === 'idle') {
    resetMateScan(true);
  }
  document.getElementById('mate-scan-modal')?.classList.add('open');
}

function closeMateScanModal() {
  document.getElementById('mate-scan-modal')?.classList.remove('open');
}

function handleMateScanPrimaryAction() {
  if (mateScanState === 'assigned' || mateScanState === 'completed') {
    void announceMateAssignment();
    return;
  }
  if (mateScanState === 'scanning') return;
  startMateScan();
}

async function announceMateAssignment() {
  const client = BACKEND.client;
  if (!BACKEND.enabled || !client) {
    setMateScanStatus('Supabase connection is not available.', 'error');
    return;
  }
  const assignedId = mateScanResult.wappId;
  if (!mateScanRequestId || !assignedId) {
    setMateScanStatus('Card is not registered. Assignment blocked.', 'error');
    setMateScanButtonState('idle');
    return;
  }

  try {
    const isCompleted = String(mateScanResult.job || '').trim().toLowerCase() === 'completed';
    const actionVerb = isCompleted ? 'completion' : 'assignment';
    const actionWord = isCompleted ? 'Completed' : 'Assigned';
    const actionPrep = isCompleted ? 'by' : 'to';

    setMateScanStatus(`Sending ${actionVerb} for ${assignedId}...`, 'busy');
    const { error } = await client
      .from('scan_requests')
      .update({ status: `${isCompleted ? 'completed' : 'assigned'}:${assignedId}` })
      .eq('id', mateScanRequestId);

    if (error) throw error;

    setMateScanStatus(`${actionWord} ${actionPrep} ${assignedId}`, 'ok');
    toast(`${actionWord} ${actionPrep} ${assignedId}`, 'ok');
    mateScanRequestId = null;
    closeMateScanModal();
  } catch (error) {
    setMateScanStatus(`Could not send assignment: ${error.message}`, 'error');
  }
}

async function startMateScan() {
  const client = BACKEND.client;
  if (!BACKEND.enabled || !client) {
    setMateScanStatus('Supabase connection is not available.', 'error');
    return;
  }
  if (mateScanTimer) return;

  const result = document.getElementById('scan-result');
  if (result) result.classList.remove('hidden');

  setMateScanButtonState('scanning');
  setMateScanStatus('Creating scan request...', 'busy');

  try {
    const { data, error } = await client
      .from('scan_requests')
      .insert([{ status: 'pending' }])
      .select('id')
      .single();

    if (error) throw error;

    mateScanRequestId = data.id;
    setMateScanValue('scan-request-id', mateScanRequestId);
    setMateScanStatus('Waiting for the ESP32 to scan...', 'busy');
    pollMateScanLog(mateScanRequestId);
  } catch (error) {
    setMateScanButtonState('idle');
    setMateScanStatus(`Failed to create request: ${error.message}`, 'error');
  }
}

function pollMateScanLog(requestId) {
  const client = BACKEND.client;
  clearInterval(mateScanTimer);

  const startedAt = Date.now();
  mateScanTimer = setInterval(async () => {
    if (Date.now() - startedAt > MATE_SCAN_TIMEOUT_MS) {
      clearInterval(mateScanTimer);
      mateScanTimer = null;
      mateScanRequestId = null;
      setMateScanStatus('Timed out waiting for the device.', 'error');
      setMateScanButtonState('idle');
      return;
    }

    const { data, error } = await client
      .from('logs')
      .select('uid,name,scan_time,access_status,job_status,request_id')
      .eq('request_id', requestId)
      .order('scan_time', { ascending: false })
      .limit(1);

    if (error) {
      clearInterval(mateScanTimer);
      mateScanTimer = null;
      mateScanRequestId = null;
      setMateScanStatus(`Read error: ${error.message}`, 'error');
      setMateScanButtonState('idle');
      return;
    }

    if (data && data.length > 0) {
      const row = data[0];
      setMateScanValue('scan-card-uid', row.uid || '-');
      setMateScanValue('scan-time', row.scan_time || '-');
      setMateScanValue('scan-access', row.access_status || '-');
      setMateScanValue('scan-job', row.job_status || '-');
      setMateScanValue('scan-name', row.name || '-');
      mateScanResult = {
        uid: row.uid || '',
        wappId: '',
        name: row.name || '',
        access: row.access_status || '',
        job: row.job_status || '',
        time: row.scan_time || '',
        registered: false
      };
      const registered = await loadMateCardDetails(row.uid, row.name);
      mateScanResult.registered = registered;

      if (!registered) {
        clearInterval(mateScanTimer);
        mateScanTimer = null;
        mateScanRequestId = null;
        mateScanState = 'idle';
        setMateScanStatus('Card is not registered. Assignment blocked.', 'error');
        setMateScanButtonState('idle');
        return;
      }

      clearInterval(mateScanTimer);
      mateScanTimer = null;
      mateScanState = String(row.job_status || '').trim().toLowerCase() === 'completed' ? 'completed' : 'assigned';
      const applied = await syncAssignmentFromMateScan();
      if (!applied) {
        mateScanRequestId = null;
        S.mateScanTarget = null;
        return;
      }
      setMateScanStatus('Scan completed successfully.', 'ok');
      setMateScanButtonState(mateScanState);
      if (S.mateScanTarget) {
        await announceMateAssignment();
        toast(t('mate.assignedViaNfc', { name: mateScanResult.name || S.mateScanTarget.name }), 'mt');
        S.mateScanTarget = null;
      }
    }
  }, MATE_SCAN_POLL_MS);
}

async function loadMateCardDetails(uid, fallbackName = '-') {
  if (!uid || !BACKEND.client) return false;

  const { data, error } = await BACKEND.client
    .from('card_data')
    .select('wid, full_name, upi')
    .eq('uid', uid)
    .maybeSingle();

  if (error) {
    setMateScanValue('scan-bank', 'Could not load bank details');
    return false;
  }

  if (!data?.wid) {
    setMateScanValue('scan-wapp-id', '-');
    setMateScanValue('scan-name', fallbackName || '-');
    setMateScanValue('scan-bank', 'Card not registered');
    return false;
  }

  const linkedWorker = findRegisteredWorkerByCode(data.wid);
  const displayName = resolveScanDisplayName(data, fallbackName);
  const bankLabel = resolveScanBankLabel(data, linkedWorker);

  if (isPlaceholderCardName(displayName) && !linkedWorker) {
    setMateScanValue('scan-wapp-id', data.wid || '-');
    setMateScanValue('scan-name', fallbackName || '-');
    setMateScanValue('scan-bank', 'Registered card, worker profile missing');
    mateScanResult.wappId = data.wid || '';
    mateScanResult.name = fallbackName || '-';
    mateScanResult.registered = false;
    return false;
  }

  const uploadedId = data?.wid || '-';
  mateScanResult.wappId = data?.wid || '';
  mateScanResult.name = displayName;
  mateScanResult.registered = true;
  registerScannedOfflineWorker(data, uid, fallbackName);
  setMateScanValue('scan-wapp-id', uploadedId);
  setMateScanValue('scan-name', displayName);
  setMateScanValue('scan-bank', bankLabel);
  renderMateWorkers();
  renderMateOfflineSection();
  return true;
}

// ── Rating ─────────────────────────────────────────────────────────
let curRating = 0;
function resolveRatingTarget(job, target = null) {
  if (!job) return null;
  if (target?.targetName || target?.targetPhone) {
    return {
      targetPhone: target.targetPhone || '',
      targetName: target.targetName || 'Worker',
      targetRole: target.targetRole || 'worker'
    };
  }
  if (S.role === 'employer') {
    const hireState = getActiveHireState(job);
    if (!hireState) return null;
    const applicant = getApplicantProfileData(hireState.name, hireState.index || 0);
    return {
      targetPhone: hireState.phone || applicant.phone || '',
      targetName: applicant.name || hireState.name || 'Worker',
      targetRole: 'worker'
    };
  }
  return {
    targetPhone: job.ownerPhone || '',
    targetName: job.ownerName || job.emp || 'Employer',
    targetRole: job.ownerRole || 'employer'
  };
}

function syncRateModalCopy() {
  const title = document.getElementById('rate-modal-title');
  const subtitle = document.getElementById('rate-modal-target');
  const target = S.rateTarget;
  if (!title || !subtitle) return;
  const isWorkerTarget = target?.targetRole === 'worker';
  title.textContent = isWorkerTarget
    ? lt('rate.titleWorker', 'Rate Worker')
    : lt('rate.titleEmployer', 'Rate Employer');
  subtitle.textContent = target?.targetName
    ? `${lt('rate.ratingFor', 'Rating for')}: ${target.targetName}`
    : '';
}

function rateModal(jobId = null, target = null) {
  if (jobId) S.rateJobId = jobId;
  if (!S.rateJobId) { toast(t('rate.missingJob')); return; }
  const job = [...JOBS, ...EJOBS].find(item => item.id === S.rateJobId);
  if (!job) { toast(t('rate.missingJob')); return; }
  S.rateTarget = resolveRatingTarget(job, target);
  if (!S.rateTarget) { toast(t('rate.missingJob')); return; }
  if (getCurrentUserRatingForJob(S.rateJobId, S.rateTarget.targetPhone || '', S.rateTarget.targetRole || '')) { toast(t('rate.alreadySubmitted')); return; }
  curRating = 0;
  document.querySelectorAll('.sb2').forEach(s => s.classList.remove('lit'));
  document.getElementById('rate-comment').value = '';
  syncRateModalCopy();
  document.getElementById('rate-modal').classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  if (id === 'rate-modal') {
    S.rateJobId = null;
    S.rateTarget = null;
  }
}
function setStar(n) {
  curRating = n;
  document.querySelectorAll('.sb2').forEach((s,i) => s.classList.toggle('lit', i<n));
}
async function submitRate() {
  if (!curRating) { toast(t('rate.pick')); return; }
  const job = [...JOBS, ...EJOBS].find(item => item.id === S.rateJobId);
  if (!job) { toast(t('rate.missingJob')); return; }
  const target = S.rateTarget || resolveRatingTarget(job);
  if (!target) { toast(t('rate.missingJob')); return; }
  if (getCurrentUserRatingForJob(job.id, target.targetPhone || '', target.targetRole || '')) { toast(t('rate.alreadySubmitted')); return; }
  const ratingPayload = {
    jobId: job.id,
    raterPhone: getCurrentUserPhone(),
    raterName: S.user?.name || 'You',
    raterRole: S.role || 'worker',
    targetPhone: target.targetPhone || '',
    targetName: target.targetName || '',
    targetRole: target.targetRole || '',
    stars: curRating,
    comment: document.getElementById('rate-comment')?.value?.trim() || ''
  };
  if (!ratingPayload.raterPhone) { toast(t('toast.enterValidPhone')); return; }
  try {
    upsertLocalRating(ratingPayload);
    refreshLocalProfileRating(ratingPayload.targetPhone, ratingPayload.targetName, ratingPayload.targetRole);
    closeModal('rate-modal');
    toast(t('rate.submitted'), 'ok');
    renderMyJobs();
    renderApplicants();
    if (document.getElementById('page-applicant-profile')?.classList.contains('active')) renderApplicantProfile();
    if (S.job?.id === job.id) renderJobDetail(job.id);
    if (document.getElementById('page-profile')?.classList.contains('active')) applyUser();
  } catch (error) {
    toast(t('rate.saveError'));
  }
}

// ── Toast ──────────────────────────────────────────────────────────
let _tt;
function toast(msg, type='') {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = `show ${type}`;
  clearTimeout(_tt); _tt = setTimeout(() => el.classList.remove('show'), 3000);
}

// ── Theme ──────────────────────────────────────────────────────────
function applyTheme(dark) {
  const th = dark ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', th);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#050816' : '#5478FF');
  try { localStorage.setItem('wapp-theme', th); } catch(e) {}
  document.querySelectorAll('[data-tt]').forEach(el => el.checked = dark);
  if (S.user) {
    syncHeaderAvatar();
    if (document.getElementById('page-profile')?.classList.contains('active')) applyUser();
  }
}
function initTheme() {
  let th = 'light'; try { th = localStorage.getItem('wapp-theme')||'light'; } catch(e) {}
  document.documentElement.setAttribute('data-theme', th);
  document.querySelectorAll('[data-tt]').forEach(el => {
    el.checked = th === 'dark';
    el.addEventListener('change', () => applyTheme(el.checked));
  });
}

// ── Payment ─────────────────────────────────────────────────────────
function renderPayment() {
  const el = document.getElementById('payment-content'); if (!el) return;
  const label = document.getElementById('payment-label');
  const title = document.getElementById('payment-title');

  if (!S.dataReady) {
    if (label) label.textContent = S.role === 'mate' ? 'WAPP-MATE' : S.role === 'employer' ? lt('payment.roleEmployer', 'EMPLOYER') : lt('payment.roleWorker', 'WORKER');
    if (title) title.textContent = S.role === 'mate' ? 'Incentives' : S.role === 'employer' ? 'Payment' : lt('payment.titleEarnings', 'Earnings');
    el.innerHTML = renderPaymentSkeleton();
    return;
  }

  if (S.role === 'mate') {
    if (label) label.textContent = 'WAPP-MATE';
    if (title) title.textContent = 'Incentives';
    el.innerHTML = renderMatePayment();
  } else if (S.role === 'employer') {
    if (label) label.textContent = lt('payment.roleEmployer', 'EMPLOYER');
    if (title) title.textContent = 'Payment';
    el.innerHTML = renderEmployerPayment();
  } else {
    if (label) label.textContent = lt('payment.roleWorker', 'WORKER');
    if (title) title.textContent = lt('payment.titleEarnings', 'Earnings');
    el.innerHTML = renderWorkerPayment();
  }
  animateCollection(el, '.tabs, .sb, .jc, .upi-app, .pay-method-card, .bank-row');
}

function getWorkerPaymentStats() {
  const me = normalizeName(currentApplicantName());
  const myAssignments = S.assigns.filter(a => normalizeName(a.name) === me);
  let paidOut = 0;
  let pending = 0;
  let doneCount = 0;
  myAssignments.forEach(a => {
    const job = JOBS.find(j => j.id === a.jid) || EJOBS.find(j => j.id === a.jid);
    const payout = Math.round(Number(job?.pay || 0) * 0.9);
    if (a.status === 'done') {
      paidOut += payout;
      doneCount += 1;
    } else {
      pending += payout;
    }
  });
  return {
    totalEarned: paidOut,
    paidOut,
    pending,
    jobsDone: doneCount || Number(S.user?.jobs || 0)
  };
}

function getEmployerPaymentStats() {
  const myJobs = EJOBS || [];
  const funded = myJobs.reduce((sum, j) => sum + Number(j?.pay || 0), 0);
  const openJobs = myJobs.filter(j => j.status === 'open').length;
  const inProgressJobs = myJobs.filter(j => j.status !== 'open').length;
  const escrowBalance = Math.max(0, funded - Math.round(funded * 0.08));
  return { escrowBalance, funded, openJobs, inProgressJobs };
}

// ── EMPLOYER PAYMENT ────────────────────────────────────────────────
function renderEmployerPayment() {
  const stats = getEmployerPaymentStats();
  return `
    <!-- Balance summary -->
    <div class="pay-balance-card">
      <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.72;margin-bottom:6px">Escrow Balance</div>
      <div style="font-size:36px;font-weight:800;letter-spacing:-1px">₹${stats.escrowBalance}</div>
      <div style="font-size:12px;opacity:.65;margin-top:4px">Platform commission: 8% per job</div>
      <button class="btn btn-p" style="margin-top:16px;padding:10px 0;font-size:14px" onclick="openAddFundsModal()">
        <i class="bi bi-plus-circle" style="margin-right:6px"></i>Add Funds
      </button>
    </div>

    <div class="srow" style="margin:18px 0 0">
      <div class="sb"><div class="sv">₹${stats.funded}</div><div class="sl">Funded</div></div>
      <div class="sb"><div class="sv">${stats.openJobs}</div><div class="sl">Open Jobs</div></div>
      <div class="sb"><div class="sv">${stats.inProgressJobs}</div><div class="sl">In Progress</div></div>
    </div>

    <!-- Pay method tabs -->
    <div class="tabs" style="margin:20px 0 16px">
      <button class="tab active" id="tab-upi"  onclick="switchEmployerTab('upi',this)">UPI</button>
      <button class="tab"        id="tab-bank" onclick="switchEmployerTab('bank',this)">Bank Transfer</button>
      <button class="tab"        id="tab-hist" onclick="switchEmployerTab('hist',this)">History</button>
    </div>
    <div id="employer-pay-content">${renderEmployerUPI()}</div>
  `;
}

function switchEmployerTab(tab, btn) {
  document.querySelectorAll('#page-payment .tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  triggerMotion(btn, 'pulse-pop');
  const c = document.getElementById('employer-pay-content');
  if (tab === 'upi')  c.innerHTML = renderEmployerUPI();
  if (tab === 'bank') c.innerHTML = renderEmployerBank();
  if (tab === 'hist') c.innerHTML = renderEmployerHistory();
  animateCollection(c, '.jc, .upi-app, .pay-method-card, .bank-row');
}

function renderEmployerUPI() {
  return `
    <div class="st" style="margin-bottom:4px">Pay via UPI</div>
    <div style="font-size:12px;color:var(--tm);margin-bottom:14px">Funds go to platform escrow. Workers are paid after job completion.</div>
    <div class="upi-grid">
      ${upiAppCard('Google Pay','gpay')}
      ${upiAppCard('PhonePe','phonepe')}
      ${upiAppCard('Paytm','paytm')}
      ${upiAppCard('Amazon Pay','amazonpay')}
      ${upiAppCard('BHIM UPI','bhim')}
      ${upiAppCard('CRED','cred')}
    </div>
    <div class="pay-upi-id-row">
      <div style="font-size:12px;color:var(--tm);margin-bottom:6px">Or pay directly to UPI ID</div>
      <div class="pay-upi-id-box">
        <span id="upi-id-text" style="font-family:monospace;font-weight:700;font-size:14px;color:var(--p)">wapp-escrow@axisbank</span>
        <button class="pay-copy-btn" onclick="copyUpiId()"><i class="bi bi-copy"></i> Copy</button>
      </div>
    </div>
  `;
}

function renderEmployerBank() {
  return `
    <div class="st" style="margin-bottom:4px">Bank Transfer / NEFT / RTGS</div>
    <div style="font-size:12px;color:var(--tm);margin-bottom:16px">Transfer to platform escrow account. Jobs are funded within 2 hours of credit.</div>
    <div class="bank-details-card">
      ${bankRow('bi-bank','Account Name','WAPP Technologies Pvt Ltd')}
      ${bankRow('bi-hash','Account Number','9284 0012 3456 7890')}
      ${bankRow('bi-diagram-2','IFSC Code','AXIS0001234')}
      ${bankRow('bi-building','Bank','Axis Bank, MG Road, Bengaluru')}
      ${bankRow('bi-arrow-left-right','Transfer Type','NEFT / RTGS / IMPS')}
    </div>
    <button class="btn btn-sec" style="margin-top:14px;font-size:13px" onclick="copyBankDetails()">
      <i class="bi bi-copy" style="margin-right:6px"></i>Copy All Details
    </button>
    <div class="ic" style="margin-top:14px;font-size:12px">
      <i class="bi bi-info-circle" style="margin-right:6px;color:var(--p)"></i>
      Reference your registered phone number in the transfer remarks so we can link the payment to your account.
    </div>
  `;
}

function renderEmployerHistory() {
  const rows = [];
  return `
    <div class="st" style="margin-bottom:12px">Transaction History</div>
    ${rows.length ? rows.map(r=>`
    <div class="jc" style="margin-bottom:10px">
      <div class="jct">
        <div>
          <div class="jt">${r.label}</div>
          <div class="je">${r.time}</div>
        </div>
        <span class="badge ${r.type==='credit'?'bg':r.type==='fee'?'pay-fee-badge':'br'}">${r.amt}</span>
      </div>
    </div>`).join('') : `<div class="empty" style="padding:28px 20px"><i class="bi bi-clock-history"></i><div class="et">No transactions yet</div></div>`}
  `;
}

function openAddFundsModal() {
  toast('Add Funds – choose UPI or Bank tab below', 'ok');
}

// ── WORKER PAYMENT ──────────────────────────────────────────────────
function renderWorkerPayment() {
  const stats = getWorkerPaymentStats();
  return `
    <!-- Earnings summary -->
    <div class="pay-balance-card pay-balance-worker">
      <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.72;margin-bottom:6px">${lt('payment.totalEarned', 'Total Earned')}</div>
      <div style="font-size:36px;font-weight:800;letter-spacing:-1px">₹${stats.totalEarned}</div>
      <div style="font-size:12px;opacity:.65;margin-top:4px">${lt('payment.nextPayout', 'Next payout: within 24 hrs of job completion')}</div>
    </div>

    <div class="srow" style="margin:0 0 20px">
      <div class="sb"><div class="sv">₹${stats.paidOut}</div><div class="sl">${lt('payment.paidOut', 'Paid out')}</div></div>
      <div class="sb"><div class="sv">₹${stats.pending}</div><div class="sl">${t('payment.pending')}</div></div>
      <div class="sb"><div class="sv">${stats.jobsDone}</div><div class="sl">${lt('payment.jobsDone', 'Jobs done')}</div></div>
    </div>

    <!-- Payout method tabs -->
    <div class="tabs" style="margin-bottom:16px">
      <button class="tab active" id="tab-w-upi"  onclick="switchWorkerTab('upi',this)">UPI</button>
      <button class="tab"        id="tab-w-bank" onclick="switchWorkerTab('bank',this)">${lt('payment.tabBankAccount', 'Bank Account')}</button>
      <button class="tab"        id="tab-w-hist" onclick="switchWorkerTab('hist',this)">History</button>
    </div>
    <div id="worker-pay-content">${renderWorkerUPI()}</div>
  `;
}

function switchWorkerTab(tab, btn) {
  document.querySelectorAll('#page-payment .tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  triggerMotion(btn, 'pulse-pop');
  const c = document.getElementById('worker-pay-content');
  if (tab === 'upi')  c.innerHTML = renderWorkerUPI();
  if (tab === 'bank') c.innerHTML = renderWorkerBank();
  if (tab === 'hist') c.innerHTML = renderWorkerHistory();
  animateCollection(c, '.jc, .upi-app, .pay-method-card, .bank-row');
}

function renderWorkerUPI() {
  const saved = S.user && S.user.upiId;
  return `
    <div class="st" style="margin-bottom:4px">${lt('payment.receiveUpi', 'Receive via UPI')}</div>
    <div style="font-size:12px;color:var(--tm);margin-bottom:14px">${lt('payment.upiTransferDesc', 'Earnings are transferred to your UPI ID after job completion.')}</div>
    ${saved ? `
    <div class="pay-saved-method">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="pay-method-icon" style="background:var(--pl);color:var(--p)"><i class="bi bi-check-circle-fill"></i></div>
        <div>
          <div style="font-size:13px;font-weight:700">${lt('payment.savedUpiId', 'Saved UPI ID')}</div>
          <div style="font-size:12px;color:var(--tm);font-family:monospace">${S.user.upiId}</div>
        </div>
        <button class="pay-edit-btn" onclick="editUpiId()"><i class="bi bi-pencil"></i></button>
      </div>
    </div>` : `
    <div class="pay-method-card">
      <div class="fg" style="margin-bottom:10px">
        <div class="fl">${lt('payment.yourUpiId', 'Your UPI ID')}</div>
        <div class="iw"><i class="bi bi-phone ii"></i><input class="fi" type="text" id="worker-upi-input" placeholder="yourname@upi" autocomplete="off"></div>
      </div>
      <button class="btn btn-p" style="padding:10px 0;font-size:14px" onclick="saveWorkerUPI()">
        <i class="bi bi-save" style="margin-right:6px"></i>${lt('payment.saveUpiId', 'Save UPI ID')}
      </button>
    </div>`}
    <div class="st" style="margin:18px 0 10px">${lt('payment.supportedUpiApps', 'Supported UPI Apps')}</div>
    <div class="upi-grid upi-grid-sm">
      ${upiAppCard('Google Pay','gpay',true)}
      ${upiAppCard('PhonePe','phonepe',true)}
      ${upiAppCard('Paytm','paytm',true)}
      ${upiAppCard('BHIM UPI','bhim',true)}
    </div>
  `;
}

function renderWorkerBank() {
  const saved = S.user && S.user.bankAccount;
  return `
    <div class="st" style="margin-bottom:4px">${lt('payment.receiveBank', 'Receive via Bank Transfer')}</div>
    <div style="font-size:12px;color:var(--tm);margin-bottom:14px">
      <i class="bi bi-shield-check" style="color:var(--p);margin-right:4px"></i>
      ${lt('payment.bankNfcHint', 'For workers without a smartphone — your NFC card is linked to this bank account.')}
    </div>
    ${saved ? `
    <div class="pay-saved-method">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="pay-method-icon" style="background:#eef5ff;color:var(--p)"><i class="bi bi-bank"></i></div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:700">${S.user.bankAccount.name}</div>
          <div style="font-size:12px;color:var(--tm);font-family:monospace">•••• ${S.user.bankAccount.last4}</div>
          <div style="font-size:11px;color:var(--tm)">${S.user.bankAccount.bank} · IFSC: ${S.user.bankAccount.ifsc}</div>
        </div>
        <button class="pay-edit-btn" onclick="editBankAccount()"><i class="bi bi-pencil"></i></button>
      </div>
    </div>` : `
    <div class="pay-method-card">
      <div class="fg"><div class="fl">${lt('payment.accountHolderName', 'Account Holder Name')}</div><div class="iw"><i class="bi bi-person ii"></i><input class="fi" type="text" id="w-acc-name" placeholder="${lt('payment.placeholderAsPerBank', 'As per bank records')}"></div></div>
      <div class="fg"><div class="fl">${lt('payment.accountNumber', 'Account Number')}</div><div class="iw"><i class="bi bi-hash ii"></i><input class="fi" type="tel" id="w-acc-num" placeholder="${lt('payment.placeholderEnterAccount', 'Enter account number')}"></div></div>
      <div class="fg"><div class="fl">${lt('payment.confirmAccountNumber', 'Confirm Account Number')}</div><div class="iw"><i class="bi bi-hash ii"></i><input class="fi" type="tel" id="w-acc-num2" placeholder="${lt('payment.placeholderReEnterAccount', 'Re-enter account number')}"></div></div>
      <div class="fg"><div class="fl">${lt('payment.ifscCode', 'IFSC Code')}</div><div class="iw"><i class="bi bi-diagram-2 ii"></i><input class="fi" type="text" id="w-ifsc" placeholder="${lt('payment.placeholderIfsc', 'e.g. SBIN0001234')}" style="text-transform:uppercase"></div></div>
      <div class="fg"><div class="fl">${lt('payment.bankName', 'Bank Name')}</div><div class="iw"><i class="bi bi-building ii"></i><input class="fi" type="text" id="w-bank-name" placeholder="${lt('payment.placeholderBankName', 'e.g. State Bank of India')}"></div></div>
      <button class="btn btn-p" style="padding:10px 0;font-size:14px;margin-top:4px" onclick="saveWorkerBank()">
        <i class="bi bi-save" style="margin-right:6px"></i>${lt('payment.saveBankAccount', 'Save Bank Account')}
      </button>
    </div>`}
    <div class="ic" style="margin-top:14px;font-size:12px">
      <i class="bi bi-nfc" style="margin-right:6px;color:var(--p)"></i>
      NFC card holders: your wapp-mate links your NFC card to this bank account. Payment arrives within 48 hours of job completion.
    </div>
  `;
}

function renderWorkerHistory() {
  const me = normalizeName(currentApplicantName());
  const rows = S.assigns
    .filter(a => normalizeName(a.name) === me && a.status === 'done')
    .map(a => {
      const job = JOBS.find(j => j.id === a.jid) || EJOBS.find(j => j.id === a.jid);
      const amount = Math.round(Number(job?.pay || 0) * 0.9);
      return {
        label: `${job ? getJobTitle(job) : t('job.unknown')} ${t('mate.done').toLowerCase()}`,
        time: t('common.justNow'),
        amt: `+₹${amount}`
      };
    });
  return `
    <div class="st" style="margin-bottom:12px">${lt('payment.earningsHistoryHeading', 'Earnings History')}</div>
    ${rows.length ? rows.map(r=>`
    <div class="jc" style="margin-bottom:10px">
      <div class="jct">
        <div><div class="jt">${r.label}</div><div class="je">${r.time}</div></div>
        <span class="badge bg">${r.amt}</span>
      </div>
    </div>`).join('') : `<div class="empty" style="padding:28px 20px"><i class="bi bi-wallet2"></i><div class="et">${lt('payment.noEarningsYet', 'No earnings yet')}</div></div>`}
    <div class="ic" style="margin-top:4px;font-size:12px">
      <i class="bi bi-clock-history" style="margin-right:6px;color:var(--ts)"></i>
      ${lt('payment.processedHint', 'Payments are processed within 24–48 hours of job completion via your saved UPI or bank account.')}
    </div>
  `;
}

function saveWorkerUPI() {
  const val = document.getElementById('worker-upi-input')?.value?.trim();
  if (!val || !val.includes('@')) { toast('Enter a valid UPI ID (e.g. name@upi)', ''); return; }
  const phone = getCurrentUserPhone();
  if (!phone) { toast(t('toast.enterValidPhone')); return; }
  if (!S.user) S.user = {};
  S.user.phone = phone;
  S.user.upiId = val;
  Promise.all([
    BACKEND.savePaymentMethod('worker', phone, 'upi', { upiId: val }),
    BACKEND.upsertProfile(S.user)
  ]).then(() => {
    toast('UPI ID saved!', 'ok');
    renderPayment();
  }).catch(() => {
    toast('Could not save UPI ID. Please try again.');
  });
}
function editUpiId() {
  if (!S.user) return;
  const phone = getCurrentUserPhone();
  delete S.user.upiId;
  const tasks = [BACKEND.upsertProfile(S.user)];
  if (phone) tasks.push(BACKEND.clearPaymentMethod('worker', phone, 'upi'));
  Promise.all(tasks).finally(() => renderPayment());
}

function saveWorkerBank() {
  const name  = document.getElementById('w-acc-name')?.value?.trim();
  const num   = document.getElementById('w-acc-num')?.value?.trim();
  const num2  = document.getElementById('w-acc-num2')?.value?.trim();
  const ifsc  = document.getElementById('w-ifsc')?.value?.trim().toUpperCase();
  const bank  = document.getElementById('w-bank-name')?.value?.trim();
  if (!name)       { toast('Enter account holder name', ''); return; }
  if (!num || num.length < 9) { toast('Enter a valid account number', ''); return; }
  if (num !== num2) { toast('Account numbers do not match', ''); return; }
  if (!ifsc || ifsc.length < 11) { toast('Enter a valid IFSC code', ''); return; }
  if (!bank)       { toast('Enter bank name', ''); return; }
  const phone = getCurrentUserPhone();
  if (!phone) { toast(t('toast.enterValidPhone')); return; }
  if (!S.user) S.user = {};
  S.user.phone = phone;
  S.user.bankAccount = { name, last4: num.slice(-4), ifsc, bank };
  Promise.all([
    BACKEND.savePaymentMethod('worker', phone, 'bank', { name, last4: num.slice(-4), ifsc, bank }),
    BACKEND.upsertProfile(S.user)
  ]).then(() => {
    toast('Bank account saved!', 'ok');
    renderPayment();
  }).catch(() => {
    toast('Could not save bank account. Please try again.');
  });
}
function editBankAccount() {
  if (!S.user) return;
  const phone = getCurrentUserPhone();
  delete S.user.bankAccount;
  const tasks = [BACKEND.upsertProfile(S.user)];
  if (phone) tasks.push(BACKEND.clearPaymentMethod('worker', phone, 'bank'));
  Promise.all(tasks).finally(() => renderPayment());
}

// ── MATE PAYMENT ────────────────────────────────────────────────────
function renderMatePayment() {
  const earned  = S.assigns.filter(a=>a.status==='done').length * 20;
  const pending = S.assigns.filter(a=>a.status==='assigned').length * 20;
  return `
    <!-- Incentive hero -->
    <div class="pay-balance-card pay-balance-mate">
      <div style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.72;margin-bottom:6px">
        <i class="bi bi-trophy" style="margin-right:4px;color:#ffd700"></i>Incentive Balance
      </div>
      <div style="font-size:36px;font-weight:800;letter-spacing:-1px">₹${earned}</div>
      <div style="font-size:12px;opacity:.65;margin-top:4px">₹20 per NFC assignment · Paid monthly</div>
    </div>

    <div class="srow" style="margin:0 0 20px">
      <div class="sb"><div class="sv">₹${earned}</div><div class="sl">Earned</div></div>
      <div class="sb"><div class="sv">₹${pending}</div><div class="sl">Pending</div></div>
      <div class="sb"><div class="sv">₹20</div><div class="sl">Per job</div></div>
    </div>

    <!-- Payout schedule banner -->
    <div class="ic mi" style="margin-bottom:16px;font-size:12px">
      <i class="bi bi-calendar-check" style="margin-right:6px;color:var(--m)"></i>
      <span><strong>Monthly payout:</strong> Incentives are batched and paid on the <strong>1st of every month</strong> to your saved bank account or UPI.</span>
    </div>

    <!-- Tabs -->
    <div class="tabs" style="margin-bottom:16px">
      <button class="tab active" id="tab-m-bank" onclick="switchMateTab('bank',this)">Payout Account</button>
      <button class="tab"        id="tab-m-hist" onclick="switchMateTab('hist',this)">History</button>
    </div>
    <div id="mate-pay-content">${renderMateBank()}</div>
  `;
}

function switchMateTab(tab, btn) {
  document.querySelectorAll('#page-payment .tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  triggerMotion(btn, 'pulse-pop');
  const c = document.getElementById('mate-pay-content');
  if (tab === 'bank') c.innerHTML = renderMateBank();
  if (tab === 'hist') c.innerHTML = renderMateHistory();
  animateCollection(c, '.jc, .pay-method-card, .bank-row');
}

function renderMateBank() {
  const hasSaved = S.user && S.user.matePayout;
  return `
    <div class="st" style="margin-bottom:4px">Payout Account</div>
    <div style="font-size:12px;color:var(--tm);margin-bottom:14px">Choose how you want to receive your monthly incentive payout.</div>

    <!-- Method selector -->
    <div style="display:flex;gap:10px;margin-bottom:16px">
      <button class="pay-type-btn ${!S._matePayType || S._matePayType==='upi' ? 'active':''}" onclick="setMatePayType('upi',this)">
        <i class="bi bi-phone"></i> UPI
      </button>
      <button class="pay-type-btn ${S._matePayType==='bank' ? 'active':''}" onclick="setMatePayType('bank',this)">
        <i class="bi bi-bank"></i> Bank Account
      </button>
    </div>

    <div id="mate-payout-form">
      ${!S._matePayType || S._matePayType === 'upi' ? renderMateUPIForm() : renderMateBankForm()}
    </div>

    <div class="ic mi" style="margin-top:14px;font-size:12px">
      <i class="bi bi-shield-lock" style="margin-right:6px;color:var(--m)"></i>
      Your payout details are encrypted and used only for monthly incentive transfers by the WAPP platform.
    </div>
  `;
}

function setMatePayType(type, btn) {
  S._matePayType = type;
  document.querySelectorAll('.pay-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const f = document.getElementById('mate-payout-form');
  if (f) f.innerHTML = type === 'upi' ? renderMateUPIForm() : renderMateBankForm();
}

function renderMateUPIForm() {
  const saved = S.user && S.user.matePayout && S.user.matePayout.type === 'upi';
  if (saved) return `
    <div class="pay-saved-method">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="pay-method-icon" style="background:var(--ms);color:var(--m)"><i class="bi bi-check-circle-fill"></i></div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:700">UPI Payout Active</div>
          <div style="font-size:12px;color:var(--tm);font-family:monospace">${S.user.matePayout.upiId}</div>
        </div>
        <button class="pay-edit-btn" onclick="clearMatePaySaved()"><i class="bi bi-pencil"></i></button>
      </div>
    </div>`;
  return `
    <div class="pay-method-card">
      <div class="fg"><div class="fl">UPI ID</div><div class="iw"><i class="bi bi-phone ii"></i><input class="fi" type="text" id="mate-upi-input" placeholder="yourname@upi"></div></div>
      <button class="btn btn-p" style="padding:10px 0;font-size:14px" onclick="saveMateUPI()">
        <i class="bi bi-save" style="margin-right:6px"></i>Save UPI for Payout
      </button>
    </div>`;
}

function renderMateBankForm() {
  const saved = S.user && S.user.matePayout && S.user.matePayout.type === 'bank';
  if (saved) return `
    <div class="pay-saved-method">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="pay-method-icon" style="background:var(--ms);color:var(--m)"><i class="bi bi-bank"></i></div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:700">${S.user.matePayout.name}</div>
          <div style="font-size:12px;color:var(--tm);font-family:monospace">•••• ${S.user.matePayout.last4}</div>
          <div style="font-size:11px;color:var(--tm)">${S.user.matePayout.bank} · IFSC: ${S.user.matePayout.ifsc}</div>
        </div>
        <button class="pay-edit-btn" onclick="clearMatePaySaved()"><i class="bi bi-pencil"></i></button>
      </div>
    </div>`;
  return `
    <div class="pay-method-card">
      <div class="fg"><div class="fl">Account Holder Name</div><div class="iw"><i class="bi bi-person ii"></i><input class="fi" type="text" id="m-acc-name" placeholder="As per bank records"></div></div>
      <div class="fg"><div class="fl">Account Number</div><div class="iw"><i class="bi bi-hash ii"></i><input class="fi" type="tel" id="m-acc-num" placeholder="Enter account number"></div></div>
      <div class="fg"><div class="fl">IFSC Code</div><div class="iw"><i class="bi bi-diagram-2 ii"></i><input class="fi" type="text" id="m-ifsc" placeholder="e.g. SBIN0001234" style="text-transform:uppercase"></div></div>
      <div class="fg"><div class="fl">Bank Name</div><div class="iw"><i class="bi bi-building ii"></i><input class="fi" type="text" id="m-bank-name" placeholder="e.g. State Bank of India"></div></div>
      <button class="btn btn-p" style="padding:10px 0;font-size:14px;margin-top:4px" onclick="saveMateBank()">
        <i class="bi bi-save" style="margin-right:6px"></i>Save Bank for Payout
      </button>
    </div>`;
}

function saveMateUPI() {
  const val = document.getElementById('mate-upi-input')?.value?.trim();
  if (!val || !val.includes('@')) { toast('Enter a valid UPI ID', ''); return; }
  const phone = getCurrentUserPhone();
  if (!phone) { toast(t('toast.enterValidPhone')); return; }
  if (!S.user) S.user = {};
  S.user.phone = phone;
  S.user.matePayout = { type:'upi', upiId: val };
  Promise.all([
    BACKEND.savePaymentMethod('mate', phone, 'payout-upi', { type:'upi', upiId: val }),
    BACKEND.upsertProfile(S.user)
  ]).then(() => {
    toast('UPI payout account saved!', 'ok');
    renderPayment();
  }).catch(() => {
    toast('Could not save payout UPI. Please try again.');
  });
}
function saveMateBank() {
  const name = document.getElementById('m-acc-name')?.value?.trim();
  const num  = document.getElementById('m-acc-num')?.value?.trim();
  const ifsc = document.getElementById('m-ifsc')?.value?.trim().toUpperCase();
  const bank = document.getElementById('m-bank-name')?.value?.trim();
  if (!name) { toast('Enter account holder name', ''); return; }
  if (!num || num.length < 9) { toast('Enter a valid account number', ''); return; }
  if (!ifsc || ifsc.length < 11) { toast('Enter a valid IFSC code', ''); return; }
  if (!bank) { toast('Enter bank name', ''); return; }
  const phone = getCurrentUserPhone();
  if (!phone) { toast(t('toast.enterValidPhone')); return; }
  if (!S.user) S.user = {};
  S.user.phone = phone;
  S.user.matePayout = { type:'bank', name, last4: num.slice(-4), ifsc, bank };
  Promise.all([
    BACKEND.savePaymentMethod('mate', phone, 'payout-bank', { type:'bank', name, last4: num.slice(-4), ifsc, bank }),
    BACKEND.upsertProfile(S.user)
  ]).then(() => {
    toast('Bank account saved for payout!', 'ok');
    renderPayment();
  }).catch(() => {
    toast('Could not save payout bank account. Please try again.');
  });
}
function clearMatePaySaved() {
  if (S.user) delete S.user.matePayout;
  const phone = getCurrentUserPhone();
  const tasks = [BACKEND.upsertProfile(S.user || {})];
  if (phone) {
    tasks.push(BACKEND.clearPaymentMethod('mate', phone, 'payout-upi'));
    tasks.push(BACKEND.clearPaymentMethod('mate', phone, 'payout-bank'));
  }
  Promise.all(tasks).finally(() => renderPayment());
}

function renderMateHistory() {
  const rows = [];
  return `
    <div class="st" style="margin-bottom:12px">Incentive History</div>
    ${rows.length ? rows.map(r=>`
    <div class="jc" style="margin-bottom:10px">
      <div class="jct">
        <div><div class="jt">${r.label}</div><div class="je">${r.time}</div></div>
        <span class="badge bg">${r.amt}</span>
      </div>
    </div>`).join('') : `<div class="empty" style="padding:28px 20px"><i class="bi bi-trophy"></i><div class="et">No incentives yet</div></div>`}
  `;
}

// ── SHARED PAYMENT HELPERS ───────────────────────────────────────────
function upiAppCard(name, key, small=false) {
  const icons = {
    gpay:      '../assets/upi/google-pay.png',
    phonepe:   '../assets/upi/phonepe.png',
    paytm:     '../assets/upi/paytm.png',
    amazonpay: '../assets/upi/amazon-pay.png',
    bhim:      '../assets/upi/bhim.png',
    cred:      '../assets/upi/cred.png',
  };
  const src = icons[key] || '';
  return `
    <div class="upi-app${small?' upi-app-sm':''}" onclick="openUPI('${name}')">
      <div class="upi-icon">${src ? `<img class="upi-icon-img" src="${src}" alt="${name} logo" loading="lazy">` : ''}</div>
      <div class="upi-name">${name}</div>
    </div>`;
}

function bankRow(icon, label, value) {
  return `
    <div class="bank-row">
      <div class="bank-row-icon"><i class="bi ${icon}"></i></div>
      <div class="bank-row-body">
        <div class="bank-row-label">${label}</div>
        <div class="bank-row-value">${value}</div>
      </div>
      <button class="pay-copy-btn" onclick="navigator.clipboard&&navigator.clipboard.writeText('${value}').then(()=>toast('Copied!','ok'))"><i class="bi bi-copy"></i></button>
    </div>`;
}

function copyUpiId() {
  const id = document.getElementById('upi-id-text')?.textContent;
  if (id && navigator.clipboard) navigator.clipboard.writeText(id).then(()=>toast('UPI ID copied!','ok'));
  else toast('UPI ID copied!','ok');
}

function copyBankDetails() {
  const txt = `WAPP Technologies Pvt Ltd\nAccount: 9284 0012 3456 7890\nIFSC: AXIS0001234\nBank: Axis Bank`;
  if (navigator.clipboard) navigator.clipboard.writeText(txt).then(()=>toast('Bank details copied!','ok'));
  else toast('Bank details copied!','ok');
}

function openUPI(app) {
  toast(`Opening ${app}…`, 'ok');
}

function switchPaymentTab(tab, btn) {
  document.querySelectorAll('#page-payment .tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  triggerMotion(btn, 'pulse-pop');
  const content = document.getElementById('payment-tab-content');
  if (content) {
    if (tab === 'history') content.innerHTML = renderPaymentHistory();
    else if (tab === 'upi') content.innerHTML = renderUPIApps();
    animateCollection(content, '.jc, .upi-app');
  }
}

function renderPaymentHistory() {
  const isEmployer = S.role === 'employer';
  if (!S.dataReady) return renderSkeletonList(3);
  return renderEmployerHistory();
}

function renderUPIApps() {
  if (!S.dataReady) return renderPaymentSkeleton();
  return renderEmployerUPI();
}

// ── Init ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initLanguage();
  initCountryCodeDropdowns();
  syncBrowseFilterButtonState();
  syncOtpVerificationState();
  setInterval(refreshApplicantViewsIfNeeded, 30000);
  syncSignupLocationUI();
  syncPostLocationUI();
  initInteractiveMotion();
  document.getElementById('s-loc')?.addEventListener('input', syncSignupLocationUI);
  document.getElementById('post-location')?.addEventListener('input', () => {
    if (!S.isFetchingLocation) S.postLocationPin = null;
    syncPostLocationUI();
  });
  document.querySelectorAll('.mo').forEach(m => m.addEventListener('click', e => { if(e.target===m) m.classList.remove('open'); }));

  const authSession = readStoredAuthSession();
  if (authSession) {
    S.role = authSession.role;
    S.user = authSession.user;
  }

  await hydrateBackendState();

  if (authSession) {
    const remote = S.user?.phone ? await BACKEND.loadProfileByPhone(S.user.phone) : null;
    if (remote) {
      S.user = mergeUserProfile(S.user, remote);
      persistAuthSession();
    }
  }

  if (document.getElementById('page-splash')) {
    runSplashIntro();
    return;
  }

  if (authSession) {
    syncEmployerJobs();
    applyUser();
    if (S.role==='mate')     { renderMate(); pg('page-mate'); }
    else if (S.role==='employer') { document.getElementById('emp-greet').textContent=S.user.name; pg('page-employer'); }
    else                        { document.getElementById('browse-greet').textContent=S.user.name; pg('page-browse'); }
  }
});
