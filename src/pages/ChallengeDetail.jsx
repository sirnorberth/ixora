import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Clock, Sparkles, CheckCircle2, Pencil, Archive, ArchiveRestore, Check, X } from 'lucide-react';
import { CHALLENGE_TYPE_STYLES } from '@/lib/constants';
import ApplicantsList from '@/components/challenges/ApplicantsList';
import ChallengeFormDialog from '@/components/challenges/ChallengeFormDialog';
import AppHeader from '@/components/AppHeader';
import { notifyChallengeApplication, notifyApplicationAccepted } from '@/lib/notify';

export default function ChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [applications, setApplications] = useState([]);
  const [goals, setGoals] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const refresh = async () => {
    const [c, apps, g, us, me] = await Promise.all([
      base44.entities.Challenge.get(id),
      base44.entities.Application.list('-created_date', 500),
      base44.entities.Goal.list('-created_date', 100).catch(() => []),
      base44.entities.User.list(),
      base44.auth.me().catch(() => null),
    ]);
    setChallenge(c);
    setApplications(apps.filter((a) => a.challenge === id));
    setGoals(g);
    setUsers(us);
    setCurrentUser(me);
    setApplied(apps.some((a) => a.challenge === id && a.user === me?.id));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#FFF8F2] flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-orange-200 border-t-[#EA580C] rounded-full animate-spin" />
      </div>
    );
  }
  if (!challenge) {
    return (
      <div className="min-h-[100dvh] bg-[#FFF8F2] flex flex-col items-center justify-center gap-3">
        <p className="text-stone-500">Challenge not found.</p>
        <button onClick={() => navigate('/challenges')} className="text-[#EA580C] font-semibold">Back to challenges</button>
      </div>
    );
  }

  const ts = CHALLENGE_TYPE_STYLES[challenge.type] || { bg: 'bg-stone-100', text: 'text-stone-600' };
  const myGoalTags = new Set();
  goals.filter((g) => g.user === currentUser?.id).forEach((g) => (g.matching_skill_tags || []).forEach((t) => myGoalTags.add(t)));
  const matchesGoal = (challenge.skill_tags || []).some((t) => myGoalTags.has(t));

  const isChallengeSponsor = currentUser?.id === challenge.sponsor;
  const canManage = currentUser?.role === 'Sponsor' || isChallengeSponsor;
  const hasPending = challenge.pending_edit && Object.keys(challenge.pending_edit).length > 0;
  const pendingByMe = hasPending && challenge.pending_edit_by === currentUser?.id;
  const pendingByName = (() => {
    const u = users.find((x) => x.id === challenge.pending_edit_by);
    return u ? (u.full_name || u.email) : 'Someone';
  })();

  const handleApply = async () => {
    if (!currentUser || applied || challenge.archived) return;
    setApplying(true);
    try {
      await base44.entities.Application.create({
        challenge: id,
        user: currentUser.id,
        date_applied: new Date().toISOString(),
      });
      const sponsorUser = users.find((u) => u.id === challenge.sponsor);
      await notifyChallengeApplication({ challenge: id, user: currentUser.id }, challenge, currentUser, sponsorUser);
      setApplied(true);
    } catch (e) {
      console.error(e);
    } finally {
      setApplying(false);
    }
  };

  const handleAccept = async (app) => {
    await base44.entities.Application.update(app.id, { status: 'Accepted' });
    const nextSpots = challenge.open_spots > 0 ? challenge.open_spots - 1 : 0;
    await base44.entities.Challenge.update(id, { open_spots: nextSpots });
    await notifyApplicationAccepted(app, challenge);
    await refresh();
  };

  const handleEditSubmit = async (values) => {
    if (isChallengeSponsor) {
      await base44.entities.Challenge.update(id, values);
    } else {
      await base44.entities.Challenge.update(id, {
        pending_edit: values,
        pending_edit_by: currentUser?.id,
        pending_edit_date: new Date().toISOString(),
      });
    }
    await refresh();
    setEditOpen(false);
  };

  const handleApproveEdit = async () => {
    const pe = challenge.pending_edit || {};
    await base44.entities.Challenge.update(id, { ...pe, pending_edit: {}, pending_edit_by: '', pending_edit_date: '' });
    await refresh();
  };

  const handleRejectEdit = async () => {
    await base44.entities.Challenge.update(id, { pending_edit: {}, pending_edit_by: '', pending_edit_date: '' });
    await refresh();
  };

  const handleArchive = async (val) => {
    await base44.entities.Challenge.update(id, { archived: val });
    await refresh();
  };

  const pe = challenge.pending_edit || {};

  return (
    <div className="min-h-[100dvh] bg-[#FFF8F2]">
      <AppHeader
        right={
          <div className="flex items-center gap-1">
            {currentUser && (
              <button onClick={() => setEditOpen(true)} title="Edit challenge" className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-stone-600 hover:bg-orange-50 hover:text-[#EA580C] transition">
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {canManage && (
              <button
                onClick={() => handleArchive(!challenge.archived)}
                title={challenge.archived ? 'Unarchive' : 'Archive'}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-stone-600 hover:bg-orange-50 hover:text-[#EA580C] transition"
              >
                {challenge.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
              </button>
            )}
          </div>
        }
      />

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#EA580C]" />
            {challenge.type && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ts.bg} ${ts.text}`}>{challenge.type}</span>
            )}
            {challenge.source === 'From project' && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">From project</span>
            )}
            {challenge.archived && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-200 text-stone-600">Archived</span>
            )}
          </div>
          <h2 className="mt-3 text-xl font-bold text-stone-800 leading-snug">{challenge.title}</h2>
          {challenge.description && (
            <p className="mt-2 text-sm text-stone-600 whitespace-pre-wrap">{challenge.description}</p>
          )}

          <div className="mt-3 space-y-1.5 text-sm text-stone-600">
            <div>Sponsor: <span className="font-semibold text-stone-800">{challenge.sponsor_name || '—'}</span></div>
            <div>Value at stake: <span className="font-semibold text-stone-800">{challenge.value_at_stake || '—'}</span></div>
            <div>Duration: <span className="font-semibold text-stone-800">{challenge.duration_weeks ? `${challenge.duration_weeks} weeks` : '—'}</span></div>
            <div className="flex items-center gap-1.5 text-stone-700">
              <Clock className="w-4 h-4 text-stone-400" /> Time ask: 2–4 hrs/week (capped at 15% of your time)
            </div>
          </div>

          {matchesGoal && (
            <p className="mt-3 text-sm font-medium text-[#EA580C] bg-orange-50 rounded-lg px-3 py-2">
              Recommended because it builds skills toward your goal.
            </p>
          )}

          {challenge.skill_tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {challenge.skill_tags.map((t) => (
                <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">{t}</span>
              ))}
            </div>
          )}

          <div className="mt-4">
            {challenge.archived ? (
              <p className="text-sm font-medium text-stone-500 bg-stone-100 rounded-2xl px-4 py-3">This challenge has been archived.</p>
            ) : applied ? (
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-emerald-600 px-5 py-3 rounded-2xl">
                <CheckCircle2 className="w-5 h-5" /> Applied — your line manager has been informed.
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={applying || !currentUser}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-semibold text-white bg-[#EA580C] hover:bg-[#c2410c] px-6 py-4 rounded-2xl shadow-sm transition disabled:opacity-50"
              >
                {applying ? 'Applying…' : 'Apply — no permission needed'}
              </button>
            )}
          </div>
        </section>

        {hasPending && canManage && (
          <section className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4">
            <h3 className="font-semibold text-stone-800 mb-1">Pending edit</h3>
            <p className="text-xs text-stone-500 mb-3">Proposed by {pendingByName} — your approval applies these changes.</p>
            <div className="space-y-1 text-sm text-stone-700 bg-amber-50 rounded-xl p-3">
              {pe.title && <div><span className="text-stone-400">Title:</span> {pe.title}</div>}
              {pe.type && <div><span className="text-stone-400">Type:</span> {pe.type}</div>}
              {pe.value_at_stake && <div><span className="text-stone-400">Value:</span> {pe.value_at_stake}</div>}
              {pe.duration_weeks != null && <div><span className="text-stone-400">Duration:</span> {pe.duration_weeks} weeks</div>}
              {pe.open_spots != null && <div><span className="text-stone-400">Open spots:</span> {pe.open_spots}</div>}
              {pe.description && <div><span className="text-stone-400">Description:</span> {pe.description}</div>}
              {pe.skill_tags?.length > 0 && <div><span className="text-stone-400">Skills:</span> {pe.skill_tags.join(', ')}</div>}
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={handleApproveEdit} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-xl transition">
                <Check className="w-4 h-4" /> Approve edit
              </button>
              <button onClick={handleRejectEdit} className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition">
                <X className="w-4 h-4" /> Reject
              </button>
            </div>
          </section>
        )}

        {hasPending && !canManage && pendingByMe && (
          <p className="text-sm font-medium text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
            Your edit is pending the sponsor's approval.
          </p>
        )}

        {canManage && !challenge.archived && (
          <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <h3 className="font-semibold text-stone-800 mb-3">Applicants ({applications.length})</h3>
            <ApplicantsList applications={applications} users={users} onAccept={handleAccept} />
          </section>
        )}
      </main>

      {currentUser && (
        <ChallengeFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          currentUser={currentUser}
          challenge={challenge}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
}