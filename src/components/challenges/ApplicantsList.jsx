import React from 'react';
import { Check } from 'lucide-react';

export default function ApplicantsList({ applications, users, onAccept }) {
  if (!applications.length) {
    return <p className="text-sm text-stone-400">No applicants yet.</p>;
  }
  const nameOf = (uid) => {
    const u = users.find((x) => x.id === uid);
    return u ? (u.full_name || u.email) : '—';
  };
  return (
    <div className="space-y-2">
      {applications.map((a) => (
        <div key={a.id} className="flex items-center justify-between gap-2 bg-stone-50 rounded-xl px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-800 truncate">{nameOf(a.user)}</p>
            <p className="text-[11px] text-stone-400">Status: {a.status}</p>
          </div>
          {a.status === 'Applied' && (
            <button
              onClick={() => onAccept(a)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 rounded-lg transition shrink-0"
            >
              <Check className="w-3.5 h-3.5" /> Accept
            </button>
          )}
          {a.status === 'Accepted' && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full shrink-0">Accepted</span>
          )}
          {a.status === 'Declined' && (
            <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-1 rounded-full shrink-0">Declined</span>
          )}
        </div>
      ))}
    </div>
  );
}