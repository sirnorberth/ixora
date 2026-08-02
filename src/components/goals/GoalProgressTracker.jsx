// GoalProgressTracker.jsx
// Progress is driven ENTIRELY by the goal's own tasks. Challenges, lessons
// and mentorship are shown underneath as context only — they do not count.
import React from 'react';
import { CheckCircle2, Circle, CircleDot, ListChecks } from 'lucide-react';

export default function GoalProgressTracker({
  goal,
  tasks = [],
  applications = [],
  challenges = [],
  mentorMatches = [],
  currentUser,
}) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  // ---- context only, not counted ----
  const tags = new Set(goal.matching_skill_tags || []);
  const myGoalApps = (applications || []).filter((a) => {
    if (a.user !== currentUser?.id) return false;
    const ch = (challenges || []).find((c) => c.id === a.challenge);
    return ch && (ch.skill_tags || []).some((t) => tags.has(t));
  });
  const applied = myGoalApps.length > 0;
  const accepted = myGoalApps.some((a) => a.status === 'Accepted');

  const myMatches = (mentorMatches || []).filter((m) => m.mentee === currentUser?.id);
  const mentorshipPending = myMatches.some((m) => m.status === 'Pending');
  const mentorshipActive = myMatches.some((m) => m.status === 'Active');

  const context = [
    {
      key: 'challenge',
      label: accepted
        ? 'Joined a goal-linked challenge'
        : applied
        ? 'Applied to a goal-linked challenge'
        : 'No goal-linked challenge yet',
      state: accepted ? 2 : applied ? 1 : 0,
    },
    {
      key: 'mentorship',
      label: mentorshipActive
        ? 'Mentorship active'
        : mentorshipPending
        ? 'Mentorship requested'
        : 'No mentorship yet',
      state: mentorshipActive ? 2 : mentorshipPending ? 1 : 0,
    },
  ];

  const iconFor = (state) => {
    if (state === 2) return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
    if (state === 1) return <CircleDot className="w-4 h-4 text-[#EA580C] shrink-0" />;
    return <Circle className="w-4 h-4 text-stone-300 shrink-0" />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-stone-700 inline-flex items-center gap-1.5">
          <ListChecks className="w-4 h-4 text-stone-400" />
          Goal progress
        </span>
        <span className="text-sm font-bold text-[#EA580C]">{pct}%</span>
      </div>
      <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-[#EA580C]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-stone-400">
        {total === 0
          ? 'Add tasks below to start tracking progress.'
          : `${done} of ${total} task${total === 1 ? '' : 's'} complete.`}
      </p>

      <div className="mt-3 pt-3 border-t border-stone-100">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5">
          Related activity
        </p>
        <ul className="space-y-1">
          {context.map((c) => (
            <li key={c.key} className="flex items-center gap-2">
              {iconFor(c.state)}
              <span className={`text-xs ${c.state === 2 ? 'text-stone-500' : 'text-stone-400'}`}>
                {c.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}