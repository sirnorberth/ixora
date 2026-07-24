// src/api/base44Client.js
// Local shim replacing the @base44/sdk client.
// Same shape as the real client, so components importing { base44 } work unchanged.
// Uses localStorage as a stand-in backend — swap internals for a real backend later.

function makeEntity(name) {
  const key = `db_${name}`;
  const read = () => JSON.parse(localStorage.getItem(key) || '[]');
  const write = (rows) => localStorage.setItem(key, JSON.stringify(rows));

  return {
    async create(values) {
      const rows = read();
      const record = {
        id: crypto.randomUUID(),
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        ...values,
      };
      rows.push(record);
      write(rows);
      return record;
    },

    async list(sort, limit) {
      let rows = read();
      if (typeof sort === 'string' && sort.length > 0) {
        const desc = sort.startsWith('-');
        const field = desc ? sort.slice(1) : sort;
        rows = [...rows].sort((a, b) => {
          if (a[field] < b[field]) return desc ? 1 : -1;
          if (a[field] > b[field]) return desc ? -1 : 1;
          return 0;
        });
      }
      if (typeof limit === 'number') rows = rows.slice(0, limit);
      return rows;
    },

    async filter(query = {}, sort, limit) {
      let rows = (await this.list(sort)).filter((r) =>
        Object.entries(query).every(([k, v]) => r[k] === v)
      );
      if (typeof limit === 'number') rows = rows.slice(0, limit);
      return rows;
    },

    async get(id) {
      const record = read().find((r) => r.id === id);
      if (!record) {
        const e = new Error(`${name} not found`);
        e.status = 404;
        throw e;
      }
      return record;
    },

    async update(id, values) {
      const rows = read().map((r) =>
        r.id === id ? { ...r, ...values, updated_date: new Date().toISOString() } : r
      );
      write(rows);
      return rows.find((r) => r.id === id);
    },

    async delete(id) {
      write(read().filter((r) => r.id !== id));
      return { success: true };
    },
  };
}

const auth = {
  async me() {
    const u = JSON.parse(localStorage.getItem('auth_user') || 'null');
    if (!u) {
      const e = new Error('Not authenticated');
      e.status = 401;
      throw e;
    }
    return u;
  },

  async login(email, password) {
    const users = JSON.parse(localStorage.getItem('db_users') || '[]');
    const u = users.find((x) => x.email === email && x.password === password);
    if (!u) {
      const e = new Error('Invalid email or password');
      e.status = 401;
      throw e;
    }
    localStorage.setItem('auth_user', JSON.stringify(u));
    return u;
  },

  async register(values) {
    const users = JSON.parse(localStorage.getItem('db_users') || '[]');
    if (users.some((x) => x.email === values.email)) {
      const e = new Error('Email already registered');
      e.status = 409;
      throw e;
    }
    const u = {
      id: crypto.randomUUID(),
      created_date: new Date().toISOString(),
      role: 'user',
      ...values,
    };
    users.push(u);
    localStorage.setItem('db_users', JSON.stringify(users));
    localStorage.setItem('auth_user', JSON.stringify(u));
    return u;
  },

  async updateMe(values) {
    const current = await auth.me();
    const users = JSON.parse(localStorage.getItem('db_users') || '[]');
    const updated = { ...current, ...values };
    localStorage.setItem(
      'db_users',
      JSON.stringify(users.map((x) => (x.id === current.id ? updated : x)))
    );
    localStorage.setItem('auth_user', JSON.stringify(updated));
    return updated;
  },

  logout() {
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
  },

  redirectToLogin() {
    window.location.href = '/login';
  },

  // --- SDK-style aliases the Base44 pages actually call ---
  async loginViaEmailPassword(email, password) {
    return auth.login(email, password);
  },

  async registerViaEmailPassword(email, password, extra = {}) {
    return auth.register({ email, password, ...extra });
  },

  async signupViaEmailPassword(email, password, extra = {}) {
    return auth.register({ email, password, ...extra });
  },

  async sendPasswordResetEmail(email) {
    console.warn(`[shim] Password reset requested for ${email} — no email actually sent.`);
    return { success: true };
  },

  async resetPassword(token, newPassword) {
    console.warn('[shim] resetPassword called — not implemented in local shim.');
    return { success: true };
  },

  async loginViaGoogle() {
    throw new Error('Google login is not available in the local build — use email and password.');
  },
};

export const base44 = {
  entities: new Proxy({}, {
    get: (_, entityName) => makeEntity(entityName),
  }),
  auth,
};

// --- DEV ONLY: auto-login so we can explore the app without auth ---
const DEV_AUTOLOGIN = true;

if (DEV_AUTOLOGIN && !localStorage.getItem('auth_user')) {
  localStorage.setItem('auth_user', JSON.stringify({
    id: 'dev-user-1',
    email: 'dev@ixora.test',
    full_name: 'Dev User',
    role: 'admin',
    created_date: new Date().toISOString()
  }));
}