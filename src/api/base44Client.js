// src/api/base44Client.js
// Supabase-powered client for Ixora.
// Same export shape as the original Base44 SDK — base44.entities.X and
// base44.auth — so every component in the app works unchanged.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---- Entity name -> table name mapping ----
const TABLE_MAP = {
  User: 'profiles',
  Project: 'projects',
  Goal: 'goals',
  Challenge: 'challenges',
  Bottleneck: 'bottlenecks',
  Application: 'applications',
  Milestone: 'milestones',
  MentorOffer: 'mentor_offers',
  MentorMatch: 'mentor_matches',
  Notification: 'notifications',
  ResistanceLog: 'resistance_logs',
  ProjectMessage: 'project_messages',
};

function tableFor(entityName) {
  const t = TABLE_MAP[entityName];
  if (!t) throw new Error(`[client] No table mapping for entity "${entityName}"`);
  return t;
}

// Apply Base44-style sort string ("-created_date" = descending) to a query
function applySort(query, sort) {
  if (typeof sort === 'string' && sort.length > 0) {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    return query.order(field, { ascending: !desc });
  }
  return query;
}

function throwIf(error) {
  if (error) {
    const e = new Error(error.message);
    e.status = error.code === 'PGRST116' ? 404 : (error.status || 400);
    e.original = error;
    throw e;
  }
}

function makeEntity(name) {
  const table = tableFor(name);

  return {
    async create(values) {
      const { data, error } = await supabase
        .from(table)
        .insert(values)
        .select()
        .single();
      throwIf(error);
      return data;
    },

    // Insert many rows at once (used by notify.js)
    async bulkCreate(rows) {
      if (!rows || rows.length === 0) return [];
      const { data, error } = await supabase.from(table).insert(rows).select();
      throwIf(error);
      return data || [];
    },

    // Update many rows at once. Pass FULL row objects (each must include id).
    async bulkUpdate(rows) {
      if (!rows || rows.length === 0) return [];
      const stamped = rows.map((r) => ({ ...r, updated_date: new Date().toISOString() }));
      const { data, error } = await supabase.from(table).upsert(stamped).select();
      throwIf(error);
      return data || [];
    },

    async list(sort, limit) {
      let q = supabase.from(table).select('*');
      q = applySort(q, sort);
      if (typeof limit === 'number') q = q.limit(limit);
      const { data, error } = await q;
      throwIf(error);
      return data || [];
    },

    async filter(queryObj = {}, sort, limit) {
      let q = supabase.from(table).select('*');
      for (const [k, v] of Object.entries(queryObj)) {
        q = q.eq(k, v);
      }
      q = applySort(q, sort);
      if (typeof limit === 'number') q = q.limit(limit);
      const { data, error } = await q;
      throwIf(error);
      return data || [];
    },

    async get(id) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
      throwIf(error);
      return data;
    },

    async update(id, values) {
      const { data, error } = await supabase
        .from(table)
        .update({ ...values, updated_date: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      throwIf(error);
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      throwIf(error);
      return { success: true };
    },
  };
}

// ---- Auth: Supabase Auth + profiles merge ----
// me() returns the auth user MERGED with their profiles row, so components
// see user.full_name, user.role, user.department, user.job_title, etc.

const auth = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      const e = new Error('Not authenticated');
      e.status = 401;
      throw e;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    return { ...user, ...(profile || {}), id: user.id, email: user.email };
  },

  async loginViaEmailPassword(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    throwIf(error);
    return auth.me();
  },

  // alias kept for any code calling login() directly
  async login(email, password) {
    return auth.loginViaEmailPassword(email, password);
  },

  // Registration: ALL profile fields travel as signup metadata; the
  // database trigger (handle_new_user) copies them into public.profiles.
  // This works even when email confirmation is ON (no session yet).
  async registerViaEmailPassword(email, password, extra = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/welcome`,
        data: {
          full_name: extra.full_name || '',
          role: extra.role || 'Employee',
          department: extra.department || null,
          job_title: extra.job_title || null,
          years_of_experience:
            extra.years_of_experience != null && extra.years_of_experience !== ''
              ? String(extra.years_of_experience)
              : '',
        },
      },
    });
    throwIf(error);
    if (!data.session) {
      // Email confirmation is ON — user must click the emailed link.
      return { ...data.user, confirmation_required: true };
    }
    return auth.me();
  },

  async signupViaEmailPassword(email, password, extra = {}) {
    return auth.registerViaEmailPassword(email, password, extra);
  },

  async register(values) {
    const { email, password, ...extra } = values;
    return auth.registerViaEmailPassword(email, password, extra);
  },

  async updateMe(values) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const e = new Error('Not authenticated');
      e.status = 401;
      throw e;
    }
    const { error } = await supabase
      .from('profiles')
      .update({ ...values, updated_date: new Date().toISOString() })
      .eq('id', user.id);
    throwIf(error);
    return auth.me();
  },

  // Resends the signup confirmation email
  async resendOtp(email) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    throwIf(error);
    return { success: true };
  },

  async sendPasswordResetEmail(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    throwIf(error);
    return { success: true };
  },

  // Alias used by the ForgotPassword page
  async resetPasswordRequest(email) {
    return auth.sendPasswordResetEmail(email);
  },

  async forgotPassword(email) {
    return auth.sendPasswordResetEmail(email);
  },

  // Accepts either resetPassword(token, newPassword) or
  // resetPassword({ newPassword }) — the email link already put the user
  // in a recovery session, so only the new password matters.
  async resetPassword(arg, maybeNewPassword) {
    const newPassword =
      arg && typeof arg === 'object'
        ? (arg.newPassword || arg.password)
        : maybeNewPassword;
    if (!newPassword) throw new Error('No new password provided');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    throwIf(error);
    return { success: true };
  },

  async loginWithProvider(provider, redirectPath = '/') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + redirectPath },
    });
    throwIf(error);
    // Browser redirects away; nothing to return.
  },

  async loginViaGoogle() {
    return auth.loginWithProvider('google', '/');
  },

  setToken() {
    // Supabase manages its own session storage — nothing to do.
  },

  async logout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  },

  redirectToLogin() {
    window.location.href = '/login';
  },
};

// ---- Integrations: email via the Supabase Edge Function 'send-email' ----
// The Resend API key lives on the server, never in this frontend bundle.

const integrations = {
  Core: {
    async SendEmail({ to, subject, body }) {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, body },
      });
      if (error) throw new Error(error.message || 'Email could not be sent');
      if (data?.error) throw new Error(data.error);
      return data;
    },
  },
};

export const base44 = {
  entities: new Proxy({}, {
    get: (_, entityName) => makeEntity(entityName),
  }),
  auth,
  integrations,
};