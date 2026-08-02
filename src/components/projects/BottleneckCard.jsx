// BottleneckCard.jsx
import React, { useState } from 'react';
import { AlertOctagon, Megaphone, Send, CheckCircle2, Check, Pencil } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BottleneckFormDialog from './BottleneckFormDialog';
import { notifyBottleneckNudge } from '@/lib/notify';
import { daysSince, daysBetween, todayISODate } from '@/lib/dateUtils';

export default function BottleneckCard({ bottleneck, project, currentUser, onPosted, onCleared, onUpdated }) {
  const [nudged, setNudged] = useState(false);
  const [nudging, setNudging] = useState(false);
  const [nudgeCount, setNudgeCount] = useState(0);
  const [localPosted, setLocalPosted] = useState(false);
  const [posting, setPosting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const cleared = bottleneck.status === 'Cleared';
  const age = bottleneck.date_cleared
    ? daysBetween(bottleneck.date_cleared, bottleneck.date_flagged)
    : daysSince(bottleneck.date_flagged);
  const posted = bottleneck.posted_as_challenge || localPosted;

  // Roles are Employee / Manager / Director. Managers and Directors can manage
  // any bottleneck; the project's own lead or sponsor can manage theirs.
  const canManage =
    !!currentUser &&
    (currentUser.role === 'Director' ||
      currentUser.role === 'Manager' ||
      currentUser.id === project?.project_lead ||
      currentUser.id === project?.sponsor);

  // Whoever flagged it, the project lead, and anyone in the department the
  // bottleneck is waiting on — so the team can clear it without the flagger.
  const inOwningDept =
    !!currentUser &&
    !!bottleneck.waiting_on &&
    currentUser.department === bottleneck.waiting_on;

  const canEdit =
    !!currentUser &&
    (currentUser.id === bottleneck.flagged_by ||
      currentUser.id === project?.project_lead ||
      inOwningDept);

  // The same group may mark it cleared
  const canClear = canEdit;

  const handleNudge = async () => {
    if (nudging) return;
    setNudging(true);
    try {
      const result = await notifyBottleneckNudge(bottleneck, project, currentUser);
      setNudgeCount(result?.notified || 0);
      setNudged(true);
      setTimeout(() => setNudged(false), 6000);
    } catch (e) {
      console.error('Nudge failed', e);
    } finally {
      setNudging(false);
    }
  };

  const handlePost = async () => {
    if (posting || !project) return;
    setPosting(true);
    try {
      await base44.entities.Challenge.create({
        title: `Unblock: ${bottleneck.title}`,
        description: `${bottleneck.description ? bottleneck.description.trim() + ' ' : ''}Spun out of project ${project.name}. Goal: clear this blocker in 2 weeks and protect the project timeline.`,
        type: 'Revenue',
        value_at_stake: project.value_at_stake,
        duration_weeks: 2,
        open_spots: 2,
        source: 'From project',
        project: project.id,
        bottleneck: bottleneck.id,
        status: 'Open',
        sponsor: currentUser?.id,
        sponsor_name: currentUser?.full_name || currentUser?.email,
      });
      await base44.entities.Bottleneck.update(bottleneck.id, { posted_as_challenge: true });
      setLocalPosted(true);
      onPosted?.();
    } catch (e) {
      console.error(e);
    } finally {
      setPosting(false);
    }
  };

  const handleClear = async () => {
    try {
      await base44.entities.Bottleneck.update(bottleneck.id, { status: 'Cleared', date_cleared: todayISODate() });
      onCleared?.(bottleneck);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (values) => {
    const patch = { ...values };
    const wasOpen = bottleneck.status === 'Open';
    // Keep date_cleared consistent with the chosen status
    if (values.status === 'Cleared' && wasOpen) patch.date_cleared = todayISODate();
    if (values.status === 'Open') patch.date_cleared = null;

    await base44.entities.Bottleneck.update(bottleneck.id, patch);
    setEditOpen(false);

    if (values.status === 'Cleared' && wasOpen) {
      // Clearing from the dialog should notify, same as the Mark cleared button
      onCleared?.({ ...bottleneck, ...patch });
    } else {
      (onUpdated || onPosted)?.();
    }
  };

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm p-4 ${cleared ? 'border-emerald-300' : 'border-red-300'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <AlertOctagon className={`w-5 h-5 shrink-0 ${cleared ? 'text-emerald-500' : 'text-red-500'}`} />
          <h3 className="font-semibold text-stone-800 leading-snug">{bottleneck.title}</h3>
        </div>
        {cleared ? (
          <span className="shrink-0 inline-flex items-center gap-1 text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full whitespace-nowrap">
            <CheckCircle2 className="w-4 h-4" /> Cleared · {age}d
          </span>
        ) : (
          <span className="shrink-0 text-sm font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full whitespace-nowrap">
            {age} days
          </span>
        )}
      </div>

      {bottleneck.description && <p className="mt-2 text-sm text-stone-600">{bottleneck.description}</p>}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
        <span>Waiting on <span className="font-semibold text-stone-700">{bottleneck.waiting_on || '—'}</span></span>
        <span>Blocking <span className="font-semibold text-red-600">{bottleneck.milestones_blocked || 0}</span> downstream milestones</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!cleared && (
          <>
            <button
              onClick={handleNudge}
              disabled={nudging}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-xl transition disabled:opacity-50"
            >
              <Megaphone className="w-4 h-4" /> {nudging ? 'Nudging…' : 'Nudge owner'}
            </button>
            {posted ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">
                <CheckCircle2 className="w-4 h-4" /> Open challenge posted
              </span>
            ) : canManage ? (
              <button
                onClick={handlePost}
                disabled={posting}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#c2410c] px-3 py-2 rounded-xl transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> {posting ? 'Posting…' : 'Post as challenge'}
              </button>
            ) : null}
            {canClear && (
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition"
              >
                <Check className="w-4 h-4" /> Mark cleared
              </button>
            )}
          </>
        )}

        {/* Available whether open or cleared, so mistakes can always be fixed */}
        {canEdit && (
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-700 bg-white border border-stone-200 hover:border-orange-300 hover:text-[#EA580C] px-3 py-2 rounded-xl transition"
          >
            <Pencil className="w-4 h-4" /> Update status
          </button>
        )}
      </div>

      {nudged && (
        <p className="mt-3 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
          {nudgeCount > 0
            ? `${bottleneck.waiting_on || 'Owner'} nudged — ${nudgeCount} ${nudgeCount === 1 ? 'person was' : 'people were'} notified.`
            : `No one in ${bottleneck.waiting_on || 'that function'} to notify yet — check their department is set.`}
        </p>
      )}

      {canEdit && (
        <BottleneckFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          bottleneck={bottleneck}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
}