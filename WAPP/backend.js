(function () {
  const sdk = window.supabase;
  const config = window.WAPP_SUPABASE_CONFIG || {};
  const enabled = Boolean(sdk?.createClient && config.url && config.anonKey);
  const client = enabled ? sdk.createClient(config.url, config.anonKey) : null;
  const tableColumnCache = {};

  function toNumber(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  function mapProfile(row) {
    if (!row) return null;
    return {
      id: row.id || '',
      name: row.name || '',
      phone: row.phone || '',
      email: row.email || '',
      loc: row.location || '',
      av: row.avatar || (row.name ? row.name.charAt(0) : '?'),
      jobs: toNumber(row.jobs_done, 0),
      rating: toNumber(row.rating, 0),
      score: toNumber(row.score, 0),
      code: row.code || '',
      device: row.device_id || '',
      ctype: row.ctype || 'individual',
      organizationName: row.organization_name || '',
      skill: row.primary_skill || '',
      need: row.hiring_need || '',
      reg: row.registration_id || '',
      upiId: row.upi_id || '',
      bankAccount: row.bank_account || null,
      matePayout: row.mate_payout || null,
      role: row.role || 'worker'
    };
  }

  function mapJob(row) {
    if (!row) return null;
    return {
      id: row.id,
      title: row.title || '',
      type: row.type || 'other',
      pay: toNumber(row.pay, 0),
      dur: row.duration || 'daily',
      time: row.time_label || '',
      emp: row.owner_name || 'You',
      loc: row.location || '',
      pin: row.latitude != null && row.longitude != null ? { lat: toNumber(row.latitude), lon: toNumber(row.longitude) } : null,
      desc: row.description || '',
      dist: toNumber(row.distance_km, 0),
      status: row.status || 'open',
      apps: Array.isArray(row.applicant_names) ? row.applicant_names : [],
      ago: row.created_at ? 'just now' : 'just now',
      ownerRole: row.owner_role || 'employer',
      ownerPhone: row.owner_phone || '',
      ownerName: row.owner_name || 'You'
    };
  }

  function mapOfflineWorker(row) {
    if (!row) return null;
    return {
      id: row.id || row.worker_code || '',
      workerCode: row.worker_code || '',
      name: row.name || '',
      phone: '',
      email: '',
      loc: row.location || '',
      av: row.name ? row.name.charAt(0).toUpperCase() : '?',
      jobs: 0,
      rating: 0,
      score: 0,
      ctype: 'individual',
      organizationName: '',
      skill: row.primary_skill || '',
      need: '',
      reg: '',
      code: row.worker_code || '',
      device: '',
      upiId: row.upi_id || '',
      bankAccount: row.bank_account || null,
      matePayout: null,
      availability: row.availability || '',
      payoutMethod: row.payout_method || 'upi',
      notes: row.notes || '',
      createdBy: row.created_by || '',
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || '',
      offline: true,
      nfc: row.worker_code || ''
    };
  }

  function mapRating(row) {
    if (!row) return null;
    return {
      id: row.id,
      jobId: row.job_id || '',
      raterPhone: row.rater_phone || '',
      raterName: row.rater_name || '',
      raterRole: row.rater_role || '',
      targetPhone: row.target_phone || '',
      targetName: row.target_name || '',
      targetRole: row.target_role || '',
      stars: toNumber(row.stars, 0),
      comment: row.comment || '',
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || ''
    };
  }

  async function safeQuery(query) {
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async function safeQueryOrEmpty(query) {
    try {
      return await safeQuery(query);
    } catch (error) {
      return [];
    }
  }

  async function getTableColumns(tableName) {
    if (!client || !tableName) return [];
    if (tableColumnCache[tableName]) return tableColumnCache[tableName];
    try {
      const cols = await safeQuery(
        client
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_schema', 'public')
          .eq('table_name', tableName)
      );
      tableColumnCache[tableName] = (cols || []).map(c => c.column_name);
      return tableColumnCache[tableName];
    } catch (e) {
      tableColumnCache[tableName] = [];
      return [];
    }
  }

  async function writeFlexibleTable(tableName, row, conflictCandidates = []) {
    if (!client || !tableName || !row) return;
    const columns = await getTableColumns(tableName);
    if (!columns.length) return;
    const payload = Object.fromEntries(
      Object.entries(row).filter(([key, value]) => columns.includes(key) && value !== undefined)
    );
    if (!Object.keys(payload).length) return;
    const keys = Array.isArray(conflictCandidates) ? conflictCandidates : [conflictCandidates];
    for (const key of keys) {
      if (!key || payload[key] == null || !columns.includes(key)) continue;
      try {
        await safeQuery(client.from(tableName).upsert(payload, { onConflict: key }));
        return;
      } catch (e) {
        try {
          const existing = await safeQuery(
            client.from(tableName).select('id').eq(key, payload[key]).limit(1).maybeSingle()
          );
          if (existing?.id) {
            await safeQuery(client.from(tableName).update(payload).eq('id', existing.id));
            return;
          }
        } catch (ignoreLookup) {}
      }
    }

    try {
      await safeQuery(client.from(tableName).insert(payload));
    } catch (e) {
      for (const key of keys) {
        if (!key || payload[key] == null || !columns.includes(key)) continue;
        try {
          const existing = await safeQuery(
            client.from(tableName).select('id').eq(key, payload[key]).limit(1).maybeSingle()
          );
          if (existing?.id) {
            await safeQuery(client.from(tableName).update(payload).eq('id', existing.id));
            return;
          }
        } catch (ignore) {}
      }
    }
  }

  async function mirrorProfileToAuxTables(profilePayload) {
    if (!client || !profilePayload?.id) return;
    const base = {
      user_id: profilePayload.id,
      phone: profilePayload.phone || null,
      email: profilePayload.email || null,
      role: profilePayload.role || 'worker',
      name: profilePayload.name || ''
    };

    await writeFlexibleTable('users', {
      ...base,
      id: profilePayload.id
    }, ['phone', 'email', 'user_id', 'id']);

    if (base.role === 'worker') {
      await writeFlexibleTable('worker_profiles', {
        ...base,
        worker_id: profilePayload.id,
        full_name: profilePayload.name || '',
        skill: profilePayload.primary_skill || null,
        primary_skill: profilePayload.primary_skill || null,
        location: profilePayload.location || null
      }, ['user_id', 'worker_id', 'phone', 'email']);
    }

    if (base.role === 'employer') {
      await writeFlexibleTable('client_profiles', {
        ...base,
        full_name: profilePayload.name || '',
        organization_name: profilePayload.organization_name || null,
        client_type: profilePayload.ctype || null,
        ctype: profilePayload.ctype || null,
        location: profilePayload.location || null
      }, ['user_id', 'phone', 'email']);
    }
  }

  async function loadSnapshot() {
    if (!client) return null;
    const [profiles, jobs, assignments, payments, applications, ratings, offlineWorkers] = await Promise.all([
      safeQuery(client.from('profiles').select('*')),
      safeQuery(client.from('jobs').select('*').order('created_at', { ascending: false })),
      safeQuery(client.from('assignments').select('*').order('created_at', { ascending: false })),
      safeQuery(client.from('payment_methods').select('*').order('created_at', { ascending: false })),
      safeQuery(client.from('applications').select('job_id, applicant_name, created_at').order('created_at', { ascending: false })),
      safeQueryOrEmpty(client.from('ratings').select('*').order('created_at', { ascending: false })),
      safeQueryOrEmpty(client.from('offline_workers').select('*').order('created_at', { ascending: false }))
    ]);

    const appByJob = (applications || []).reduce((acc, row) => {
      if (!row?.job_id || !row?.applicant_name) return acc;
      if (!acc[row.job_id]) acc[row.job_id] = [];
      if (!acc[row.job_id].includes(row.applicant_name)) acc[row.job_id].push(row.applicant_name);
      return acc;
    }, {});

    const mergedJobs = (jobs || []).map(row => {
      const dbApps = Array.isArray(row.applicant_names) ? row.applicant_names : [];
      const appRows = appByJob[row.id] || [];
      const mergedApps = Array.from(new Set([...dbApps, ...appRows]));
      return { ...row, applicant_names: mergedApps };
    });

    return {
      profiles: profiles.map(mapProfile).filter(Boolean),
      offlineWorkers: (offlineWorkers || []).map(mapOfflineWorker).filter(Boolean),
      jobs: mergedJobs.map(mapJob).filter(Boolean),
      ratings: (ratings || []).map(mapRating).filter(Boolean),
      assignments: assignments || [],
      paymentMethods: payments || [],
      applications: applications || []
    };
  }

  async function refreshProfileRating(targetPhone) {
    if (!client || !targetPhone) return null;
    const rows = await safeQueryOrEmpty(
      client.from('ratings').select('stars').eq('target_phone', targetPhone)
    );
    if (!rows.length) return null;
    const total = rows.reduce((sum, row) => sum + toNumber(row.stars, 0), 0);
    const average = Number((total / rows.length).toFixed(2));
    const { data, error } = await client
      .from('profiles')
      .update({ rating: average })
      .eq('phone', targetPhone)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return mapProfile(data);
  }

  async function upsertProfile(profile) {
    if (!client || !profile?.phone) return null;
    const payload = {
      role: profile.role || 'worker',
      name: profile.name || '',
      phone: profile.phone,
      email: profile.email || null,
      location: profile.loc || profile.location || null,
      avatar: profile.av || profile.name?.charAt(0) || null,
      jobs_done: toNumber(profile.jobs, 0),
      rating: toNumber(profile.rating, 0),
      score: toNumber(profile.score, 0),
      ctype: profile.ctype || null,
      organization_name: profile.organizationName || null,
      primary_skill: profile.skill || null,
      hiring_need: profile.need || null,
      registration_id: profile.reg || null,
      code: profile.code || null,
      device_id: profile.device || null,
      upi_id: profile.upiId || null,
      bank_account: profile.bankAccount || null,
      mate_payout: profile.matePayout || null
    };
    const { data, error } = await client.from('profiles').upsert(payload, { onConflict: 'phone' }).select('*').single();
    if (error) throw error;
    await mirrorProfileToAuxTables(data);
    return mapProfile(data);
  }

  async function saveJob(job, owner) {
    if (!client) return null;
    const payload = {
      id: job.id,
      owner_role: owner?.role || 'employer',
      owner_phone: owner?.phone || null,
      owner_name: owner?.name || 'You',
      title: job.title,
      type: job.type,
      pay: toNumber(job.pay, 0),
      duration: job.dur,
      time_label: job.time || null,
      location: job.loc || null,
      latitude: job.pin?.lat ?? null,
      longitude: job.pin?.lon ?? null,
      description: job.desc || null,
      distance_km: toNumber(job.dist, 0),
      status: job.status || 'open',
      applicant_names: Array.isArray(job.apps) ? job.apps : []
    };
    const { data, error } = await client.from('jobs').upsert(payload, { onConflict: 'id' }).select('*').single();
    if (error) throw error;
    return mapJob(data);
  }

  async function deleteJob(jobId) {
    if (!client || !jobId) return false;
    const { error } = await client.from('jobs').delete().eq('id', jobId);
    if (error) throw error;
    return true;
  }

  async function saveApplication(jobId, applicantName, applicantPhone) {
    if (!client || !jobId || !applicantName) return null;
    const payload = { job_id: jobId, applicant_name: applicantName, applicant_phone: applicantPhone || null };
    const { error } = await client.from('applications').insert(payload);
    if (error) throw error;
    return payload;
  }

  async function saveAssignment(jobId, workerId, workerName, assignedBy) {
    if (!client || !jobId || !workerId || !workerName) return null;
    const payload = {
      job_id: jobId,
      worker_id: workerId,
      worker_name: workerName,
      status: 'assigned',
      assigned_by: assignedBy || null
    };
    const { data, error } = await client.from('assignments').upsert(payload, { onConflict: 'job_id,worker_id' }).select('*').single();
    if (error) throw error;
    return data;
  }

  async function updateAssignmentStatus(jobId, workerId, status) {
    if (!client || !jobId || !workerId) return null;
    const { data, error } = await client
      .from('assignments')
      .update({ status })
      .eq('job_id', jobId)
      .eq('worker_id', workerId)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function savePaymentMethod(role, phone, methodType, details) {
    if (!client || !role || !phone || !methodType) return null;
    const payload = { role, phone, method_type: methodType, details: details || {} };
    const { data, error } = await client.from('payment_methods').upsert(payload, { onConflict: 'role,phone,method_type' }).select('*').single();
    if (error) throw error;
    return data;
  }

  async function saveOfflineWorker(worker) {
    if (!client || !worker?.workerCode || !worker?.name) return null;
    const payload = {
      worker_code: String(worker.workerCode).trim().toUpperCase(),
      name: worker.name,
      location: worker.loc || worker.location || null,
      primary_skill: worker.skill || worker.primary_skill || null,
      availability: worker.avail || worker.availability || null,
      payout_method: worker.payoutMethod || worker.payout_method || 'upi',
      upi_id: worker.upiId || worker.upi_id || null,
      bank_account: worker.bankAccount || worker.bank_account || null,
      notes: worker.notes || null,
      created_by: worker.createdBy || worker.created_by || null
    };
    const { data, error } = await client.from('offline_workers').upsert(payload, { onConflict: 'worker_code' }).select('*').single();
    if (error) throw error;
    return mapOfflineWorker(data);
  }

  async function clearPaymentMethod(role, phone, methodType) {
    if (!client || !role || !phone || !methodType) return null;
    const { error } = await client.from('payment_methods').delete().eq('role', role).eq('phone', phone).eq('method_type', methodType);
    if (error) throw error;
    return true;
  }

  async function saveRating(rating) {
    if (!client || !rating?.jobId || !rating?.raterPhone) return null;
    const payload = {
      job_id: rating.jobId,
      rater_phone: rating.raterPhone,
      rater_name: rating.raterName || null,
      rater_role: rating.raterRole || null,
      target_phone: rating.targetPhone || null,
      target_name: rating.targetName || null,
      target_role: rating.targetRole || null,
      stars: Math.max(1, Math.min(5, Math.round(toNumber(rating.stars, 0)))),
      comment: rating.comment || null
    };
    const { data, error } = await client
      .from('ratings')
      .upsert(payload, { onConflict: 'job_id,rater_phone,target_phone' })
      .select('*')
      .single();
    if (error) throw error;
    const updatedProfile = payload.target_phone ? await refreshProfileRating(payload.target_phone) : null;
    return {
      rating: mapRating(data),
      updatedProfile
    };
  }

  async function loadProfileByPhone(phone) {
    if (!client || !phone) return null;
    const data = await safeQuery(client.from('profiles').select('*').eq('phone', phone).maybeSingle());
    return mapProfile(data);
  }

  async function loadProfileByEmail(email) {
    if (!client || !email) return null;
    const queryEmail = String(email).trim().toLowerCase();
    const data = await safeQuery(
      client
        .from('profiles')
        .select('*')
        .ilike('email', queryEmail)
        .limit(1)
        .maybeSingle()
    );
    return mapProfile(data);
  }

  window.WappBackend = {
    enabled,
    client,
    loadSnapshot,
    upsertProfile,
    saveJob,
    deleteJob,
    saveApplication,
    saveAssignment,
    updateAssignmentStatus,
    saveRating,
    savePaymentMethod,
    saveOfflineWorker,
    clearPaymentMethod,
    loadProfileByPhone,
    loadProfileByEmail
  };
})();
