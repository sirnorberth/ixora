import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, X } from 'lucide-react';
import { notifyMatchResolved } from '@/lib/notify';

export default function MentorInviteBanner() {
  const [invites, setInvites] = useState([]);
  const [offers, setOffers] = useState([]);
  const [users, setUsers] = useState([]);

  const refresh = async () => {
    try {
      const [me, mm, ofs, us] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.MentorMatch.list('-created_date', 200),
        base44.entities.MentorOffer.list('-created_date', 200),
        base44.entities.User.list(),
      ]);
      setOffers(ofs);
      setUsers(us);
      setInvites(mm.filter((m) => m.mentee === me?.id && m.initiated_by === 'Mentor invited' && m.status === 'Pending'));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  if (!invites.length) return null;

  const mentorName = (m) => {
    const offer = offers.find((o) => o.id === m.mentor_offer);
    const u = users.find((x) => x.id === offer?.mentor);
    return u?.full_name || u?.email || 'A mentor';
  };
  const offerTopics = (m) => offers.find((o) => o.id === m.mentor_offer)?.topics;

  const handleAccept = async (m) => {
    await base44.entities.MentorMatch.update(m.id, { status: 'Active' });
    const offer = offers.find((o) => o.id === m.mentor_offer);
    if (offer && offer.mentee_slots > 0) {
      await base44.entities.MentorOffer.update(offer.id, { mentee_slots: offer.mentee_slots - 1 });
    }
    await notifyMatchResolved({ ...m, status: 'Active' }, offer);
    await refresh();
  };
  const handleDecline = async (m) => {
    await base44.entities.MentorMatch.update(m.id, { status: 'Declined' });
    const offer = offers.find((o) => o.id === m.mentor_offer);
    await notifyMatchResolved({ ...m, status: 'Declined' }, offer);
    await refresh();
  };

  return (
    <div className="w-full max-w-md mt-6 text-left">
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
        <h3 className="font-semibold text-stone-800">Mentorship invites</h3>
        <p className="text-xs text-stone-500 mt-0.5">Mentoring works both ways here — you decide.</p>
        <div className="mt-3 space-y-2.5">
          {invites.map((m) => (
            <div key={m.id} className="p-3 rounded-xl bg-stone-50">
              <div className="text-sm font-semibold text-stone-800">{mentorName(m)} invited you to mentor with them.</div>
              {offerTopics(m) && <div className="text-xs text-stone-500 mt-0.5">Re: {offerTopics(m)}</div>}
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleAccept(m)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition"
                >
                  <Check className="w-4 h-4" /> Accept
                </button>
                <button
                  onClick={() => handleDecline(m)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                >
                  <X className="w-4 h-4" /> Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}