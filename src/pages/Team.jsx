// Team.jsx — directory of everyone registered on Ixora
import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import AppHeader from '@/components/AppHeader';
import { Users, Search, Briefcase, Building2, Clock } from 'lucide-react';
import { DEPARTMENTS } from '@/lib/constants';

function initials(name, email) {
  const src = (name || email || '?').trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return src.charAt(0).toUpperCase();
}

const ROLE_STYLES = {
  Director: 'bg-purple-100 text-purple-700',
  Manager: 'bg-blue-100 text-blue-700',
  Employee: 'bg-stone-100 text-stone-600',
};

function PersonCard({ user }) {
  const name = user.full_name || user.email || 'Unnamed';
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 hover:shadow-md hover:border-orange-200 transition">
      <div className="flex items-start gap-3">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="w-12 h-12 rounded-full object-cover shrink-0 bg-orange-100"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-orange-100 text-[#EA580C] font-bold flex items-center justify-center shrink-0">
            {initials(user.full_name, user.email)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-stone-800 truncate">{name}</h3>
            {user.role && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${ROLE_STYLES[user.role] || ROLE_STYLES.Employee}`}>
                {user.role}
              </span>
            )}
          </div>
          {user.job_title && (
            <p className="mt-0.5 text-sm text-stone-600 truncate flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              {user.job_title}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-500">
            {user.department && (
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {user.department}
              </span>
            )}
            {user.years_of_experience != null && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> {user.years_of_experience} yr
                {Number(user.years_of_experience) === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [dept, setDept] = useState('All');

  useEffect(() => {
    (async () => {
      try {
        const us = await base44.entities.User.list('full_name', 500);
        setUsers(us);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (dept !== 'All' && u.department !== dept) return false;
      if (!q) return true;
      return [u.full_name, u.email, u.job_title, u.department]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q));
    });
  }, [users, query, dept]);

  // Departments that actually have people, so the filter isn't full of empties
  const activeDepts = useMemo(() => {
    const present = new Set(users.map((u) => u.department).filter(Boolean));
    return DEPARTMENTS.filter((d) => present.has(d));
  }, [users]);

  const byDept = useMemo(() => {
    const counts = {};
    users.forEach((u) => {
      const k = u.department || 'Not set';
      counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }, [users]);

  return (
    <div className="min-h-[100dvh] bg-[#FFF8F2]">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        <div className="px-1">
          <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#EA580C]" /> Team
          </h2>
          <p className="text-sm text-stone-500 mt-0.5">
            {loading
              ? 'Loading…'
              : `${users.length} ${users.length === 1 ? 'person is' : 'people are'} on Ixora across ${Object.keys(byDept).length} ${Object.keys(byDept).length === 1 ? 'function' : 'functions'}.`}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, job title or function…"
            className="w-full h-11 pl-10 pr-3 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#EA580C]"
          />
        </div>

        {/* Department filter */}
        {activeDepts.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setDept('All')}
              className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                dept === 'All'
                  ? 'bg-[#EA580C] text-white border-[#EA580C]'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-orange-200'
              }`}
            >
              All ({users.length})
            </button>
            {activeDepts.map((d) => (
              <button
                key={d}
                onClick={() => setDept(d)}
                className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition whitespace-nowrap ${
                  dept === d
                    ? 'bg-[#EA580C] text-white border-[#EA580C]'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-orange-200'
                }`}
              >
                {d} ({byDept[d]})
              </button>
            ))}
          </div>
        )}

        {/* People */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-[#EA580C] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-orange-200 mx-auto mb-3" />
            <p className="text-stone-500">
              {query || dept !== 'All' ? 'No one matches that search.' : 'No one has registered yet.'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map((u) => (
              <PersonCard key={u.id} user={u} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}