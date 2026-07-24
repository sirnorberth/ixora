import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Sparkles, Users } from 'lucide-react';
import MentorOfferCard from '@/components/mentors/MentorOfferCard';
import MentorOfferFormDialog from '@/components/mentors/MentorOfferFormDialog';
import InviteMenteeDialog from '@/components/mentors/InviteMenteeDialog';
import PendingRequestsList from '@/components/mentors/PendingRequestsList';
import AppHeader from '@/components/AppHeader';
import { notifyMentorRequest, notifyMentorInvite, notifyMatchResolved, notifyMentorOfferForGoals } from '@/lib/notify';

export default function Mentors() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [offers, setOffers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offerFormOpen, setOfferFormOpen] = useState(false);
  const [inviteOffer, setInviteOffer] = useState(null);

  const refresh = async () => {
    const [me, ofs, mm, us, gs] = await Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.MentorOffer.list('-created_date', 200),
      base44.entities.MentorMatch.list('-created_date', 500),
      base44.entities.User.list(),
      base44.entities.Goal.list('-created_date', 100).catch(() => []),
    ]);
    setCurrentUser(me);
    setOffers(ofs);
    setMatches(mm);
    setUsers(us);
    setGoals(gs);
  };

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const myGoalTags = new Set();
  goals
    .filter((g) => g.user === currentUser?.id && !g.archived)
    .forEach((g) => (g.matching_skill_tags || []).forEach((t) => myGoalTags.add(t)));

  const userOf = (uid) => users.find((u) => u.id === uid);
  const matchFor = (offer) => matches.find((m) => m.mentor_offer === offer.id && m.mentee === currentUser?.id);

  const sorted = [...offers].sort((a, b) => {
    const ao = (a.skill_tags || []).some((t) => myGoalTags.has(t)) ? 0 : 1;
    const bo = (b.skill_tags || []).some((t) => myGoalTags.has(t)) ? 0 : 1;
    return ao - bo;
  });

  const incomingPending = matches.filter((m) => {
    if (m.status !== 'Pending' || m.initiated_by !== 'Mentee requested') return false;
    const offer = offers.find((o) => o.id === m.mentor_offer);
    return offer?.mentor === currentUser?.id;
  });

  const handleRequest = async (offer) => {
    const match = await base44.entities.MentorMatch.create({
      mentor_offer: offer.id,
      mentee: currentUser?.id,
      initiated_by: 'Mentee requested',
      status: 'Pending',
    });
    await notifyMentorRequest(match, offer, currentUser, userOf(offer.mentor));
    setMatches(await base44.entities.MentorMatch.list('-created_date', 500));
  };
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
  const handleInvite = async (menteeId) => {
    const match = await base44.entities.MentorMatch.create({
      mentor_offer: inviteOffer.id,
      mentee: menteeId,
      initiated_by: 'Mentor invited',
      status: 'Pending',
    });
    await notifyMentorInvite(match, inviteOffer, userOf(inviteOffer.mentor), userOf(menteeId));
    setInviteOffer(null);
    await refresh();
  };
  const handleCreateOffer = async (values) => {
    const created = await base44.entities.MentorOffer.create(values);
    await notifyMentorOfferForGoals(created, currentUser);
    setOffers((prev) => [created, ...prev]);
    setOfferFormOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#FFF8F2] flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-orange-200 border-t-[#EA580C] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FFF8F2]">
      <AppHeader
        right={
          <button
            onClick={() => setOfferFormOpen(true)}
            title="Post a mentor offer"
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#EA580C] text-white hover:bg-[#c2410c] transition"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        <h2 className="text-xl font-bold text-stone-800 px-1">Mentors</h2>
        <PendingRequestsList
          matches={incomingPending}
          users={users}
          offers={offers}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />

        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-orange-200 mx-auto mb-3" />
            <p className="text-stone-500">No mentor offers yet. Be the first to post one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sorted.map((o) => (
              <MentorOfferCard
                key={o.id}
                offer={o}
                mentorUser={userOf(o.mentor)}
                currentUser={currentUser}
                goalTags={myGoalTags}
                match={matchFor(o)}
                onRequest={() => handleRequest(o)}
                onInvite={() => setInviteOffer(o)}
              />
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 text-center">
          <Sparkles className="w-6 h-6 text-[#EA580C] mx-auto mb-2" />
          <p className="text-sm text-stone-600 max-w-md mx-auto">
            Are you experienced in something? Post your own mentor offer — mentors earn recognition at review time.
          </p>
          <button
            onClick={() => setOfferFormOpen(true)}
            className="mt-3 inline-flex items-center gap-2 bg-[#EA580C] text-white font-semibold text-sm px-4 py-2 rounded-xl hover:bg-[#c2410c] transition"
          >
            <Plus className="w-4 h-4" /> Post your offer
          </button>
        </div>
      </main>

      <MentorOfferFormDialog
        open={offerFormOpen}
        onOpenChange={setOfferFormOpen}
        currentUser={currentUser}
        onSubmit={handleCreateOffer}
      />
      <InviteMenteeDialog
        open={!!inviteOffer}
        onOpenChange={(v) => !v && setInviteOffer(null)}
        users={users}
        currentUser={currentUser}
        onSubmit={handleInvite}
      />
    </div>
  );
}