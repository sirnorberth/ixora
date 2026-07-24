import React from 'react';
import { Check, X } from 'lucide-react';

export default function PendingRequestsList({ matches, users, offers, onAccept, onDecline }) {
  if (!matches?.length) return null;
  return (
    <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
      <h3 className="font-semibold text-stone-800 mb-3">Pending requests ({matches.length})</h3>
      <div className="space-y-2.5">
        {matches.map((m) => {
          const offer = offers.find((o) => o.id === m.mentor_offer);
          const applicant = users.find((u) => u.id === m.mentee);
          return (
            <div key={m.id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-stone-50">
              <div className="min-w-0">
                <div className="font-semibold text-stone-800 text-sm truncate">
                  {applicant?.full_name || applicant?.email || 'Someone'}
                </div>
                <div className="text-xs text-stone-500 truncate">Re: {offer?.topics || 'your offer'}</div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => onAccept(m)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition"
                >
                  <Check className="w-4 h-4" /> Accept
                </button>
                <button
                  onClick={() => onDecline(m)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                >
                  <X className="w-4 h-4" /> Decline
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}