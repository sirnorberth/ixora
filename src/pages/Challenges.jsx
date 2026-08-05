import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Plus, Eye, EyeOff, Archive } from 'lucide-react';
import ChallengeCard from '@/components/challenges/ChallengeCard';
import ChallengeFormDialog from '@/components/challenges/ChallengeFormDialog';
import AppHeader from '@/components/AppHeader';
import { notifyChallengeForGoals } from '@/lib/notify';
import { CHALLENGE_STATUSES } from '@/lib/constants';

export default function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [applications, setApplications] = useState([]);
  const [goals, setGoals] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    (async () => {
      try {
        const [c, apps, g, me] = await Promise.all([
          base44.entities.Challenge.list('-created_date', 200),
          base44.entities.Application.list('-created_date', 1000),
          base44.entities.Goal.list('-created_date', 100).catch(() => []),
          base44.auth.me().catch(() => null),
        ]);
        setChallenges(c);
        setApplications(apps);
        setGoals(g);
        setCurrentUser(me);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const canCreate = !!currentUser;

  const myGoalTags = new Set();
  goals.filter((g) => g.user === currentUser?.id).forEach((g) => (g.matching_skill_tags || []).forEach((t) => myGoalTags.add(t)));
  const hasGoal = myGoalTags.size > 0;
  const matchesGoal = (ch) => (ch.skill_tags || []).some((t) => myGoalTags.has(t));

  // Everything that isn't archived — regardless of status, so a challenge
  // never disappears just because work has started on it.
  const liveChallenges = useMemo(
    () => challenges.filter((c) => !c.archived),
    [challenges]
  );
  const archivedChallenges = useMemo(
    () => challenges.filter((c) => c.archived),
    [challenges]
  );

  const counts = useMemo(() => {
    const out = { All: liveChallenges.length };
    CHALLENGE_STATUSES.forEach((st) => {
      out[st] = liveChallenges.filter((c) => (c.status || 'Open') === st).length;
    });
    return out;
  }, [liveChallenges]);

  const visible = useMemo(() => {
    const list =
      statusFilter === 'All'
        ? liveChallenges
        : liveChallenges.filter((c) => (c.status || 'Open') === statusFilter);

    // Open ones first, then goal matches, so the most actionable float up
    return [...list].sort((a, b) => {
      const aOpen = (a.status || 'Open') === 'Open' ? 1 : 0;
      const bOpen = (b.status || 'Open') === 'Open' ? 1 : 0;
      if (aOpen !== bOpen) return bOpen - aOpen;
      if (!hasGoal) return 0;
      return (matchesGoal(b) ? 1 : 0) - (matchesGoal(a) ? 1 : 0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveChallenges, statusFilter, hasGoal, myGoalTags.size]);

  const countFor = (cid) => applications.filter((a) => a.challenge === cid).length;

  const handleCreate = async (values) => {
    const created = await base44.entities.Challenge.create(values);
    await notifyChallengeForGoals(created);
    setChallenges((prev) => [created, ...prev]);
    setDialogOpen(false);
  };

  return (
    <div className="min-h-[100dvh] bg-[#FFF8F2]">
      <AppHeader
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchived((v) => !v)}
              title={showArchived ? 'Hide archived challenges' : 'Show archived challenges'}
              className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border bg-white transition ${showArchived ? 'border-orange-300 text-[#EA580C]' : 'border-stone-200 text-stone-600 hover:bg-orange-50'}`}
            >
              {showArchived ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            {canCreate && (
              <button
                onClick={() => setDialogOpen(true)}
                title="New challenge"
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#EA580C] text-white hover:bg-[#c2410c] transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        }
      />

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        <h2 className="text-xl font-bold text-stone-800 px-1">Challenges</h2>

        {!loading && liveChallenges.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {['All', ...CHALLENGE_STATUSES].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#EA580C] text-white border-[#EA580C]'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-orange-200'
                }`}
              >
                {st} ({counts[st] ?? 0})
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-[#EA580C] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {visible.length === 0 ? (
              <div className="text-center py-16">
                <Sparkles className="w-10 h-10 text-orange-200 mx-auto mb-3" />
                <p className="text-stone-500">
                  {statusFilter === 'All'
                    ? 'No challenges yet — blockers posted from projects will appear here.'
                    : `No challenges are ${statusFilter.toLowerCase()} right now.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visible.map((c) => (
                  <ChallengeCard key={c.id} challenge={c} applicantsCount={countFor(c.id)} matchesGoal={hasGoal && matchesGoal(c)} />
                ))}
              </div>
            )}

            {showArchived && (
              <section>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <Archive className="w-4 h-4 text-stone-400" />
                  <h2 className="text-sm font-semibold text-stone-600">Archived</h2>
                  <span className="text-xs text-stone-400">{archivedChallenges.length}</span>
                </div>
                {archivedChallenges.length === 0 ? (
                  <p className="text-sm text-stone-400 px-1">No archived challenges.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {archivedChallenges.map((c) => (
                      <ChallengeCard key={c.id} challenge={c} applicantsCount={countFor(c.id)} />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {canCreate && (
        <ChallengeFormDialog open={dialogOpen} onOpenChange={setDialogOpen} currentUser={currentUser} onSubmit={handleCreate} />
      )}
    </div>
  );
}