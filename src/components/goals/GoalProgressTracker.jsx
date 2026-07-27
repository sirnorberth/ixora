// GoalProgressTracker.jsx
import React from 'react';
import { CheckCircle2, Circle, CircleDot } from 'lucide-react';

export default function GoalProgressTracker({ goal, applications, challenges, mentorMatches, currentUser, onUpdateLessons }) {
  const tags = new Set(goal.matching_skill_tags || []);

  // Applications on challenges that match this goal's skill tags
  const myGoalApps = (applications || []).filter((a) => {
    if (a.user !== currentUser?.id) return false;
    const ch = (challenges || []).find((c) => c.id === a.challenge);
    return ch && (ch.skill_tags || []).some((t) => tags.has(t));
  });
  const applied = myGoalApps.length > 0;
  const accepted = myGoalApps.some((a) => a.status === 'Accepted');

  // Mentorship: pending request counts as partial, active counts as complete
  const myMatches = (mentorMatches || []).filter((m) => m.mentee === currentUser?.id);
  const mentorshipPending = myMatches.some((m) => m.status === 'Pending');
  const mentorshipActive = myMatches.some((m) => m.status === 'Active');

  const lessonsDone = !!goal.lessons_done;

  // Each step scores 0, 0.5 (in progress) or 1 (complete) — so the bar moves
  // as soon as something starts, not only when it finishes.
  const steps = [
    {
      key: 'challenge',
      label: accepted
        ? 'Joined a challenge linked to this goal'
        : applied
        ? 'Applied to a goal-linked challenge — awaiting acceptance'
        : 'Join a challenge linked to this goal',
      score: accepted ? 1 : applied ? 0.5 : 0,
    },
    {
      key: 'lessons',
      label: 'Complete 2 goal-linked lessons',
      score: lessonsDone ? 1 : 0,
      manual: true,
    },
    {
      key: 'mentorship',
      label: mentorshipActive
        ? 'Mentorship started'
        : mentorshipPending
        ? 'Mentorship requested — awaiting response'
        : 'Start a mentorship',
      score: mentorshipActive ? 1 : mentorshipPending ? 0.5 : 0,
    },
  ];

  const total = steps.reduce((s, m) => s + m.score, 0);
  const pct = Math.round((total / steps.length) * 100);

  const iconFor = (score) => {
    if (score === 1) return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
    if (score > 0) return <CircleDot className="w-5 h-5 text-[#EA580C] shrink-0" />;
    return <Circle className="w-5 h-5 text-stone-300 shrink-0" />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-stone-700">Goal progress</span>
        <span className="text-sm font-bold text-[#EA580C]">{pct}%</span>
      </div>
      <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#EA580C] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="mt-4 space-y-2.5">
        {steps.map((m) => (
          <li key={m.key} className="flex items-center gap-2.5">
            {iconFor(m.score)}
            <span
              className={`text-sm flex-1 ${
                m.score === 1 ? 'text-stone-400 line-through' : m.score > 0 ? 'text-stone-700' : 'text-stone-700'
              }`}
            >
              {m.label}
            </span>
            {m.manual && m.score < 1 && (
              <button onClick={() => onUpdateLessons?.(true)} className="text-xs font-semibold text-[#EA580C] hover:underline">
                Mark done
              </button>
            )}
            {m.manual && m.score === 1 && (
              <button onClick={() => onUpdateLessons?.(false)} className="text-xs font-semibold text-stone-400 hover:underline">
                Undo
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-stone-400">
        Progress updates automatically as you apply to challenges and start mentorships.
      </p>
    </div>
  );
}