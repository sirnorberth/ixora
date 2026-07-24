import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export default function GoalProgressTracker({ goal, applications, challenges, mentorMatches, currentUser, onUpdateLessons }) {
  const tags = new Set(goal.matching_skill_tags || []);

  const challengeJoined = applications.some((a) => {
    if (a.user !== currentUser?.id) return false;
    const ch = challenges.find((c) => c.id === a.challenge);
    return ch && (ch.skill_tags || []).some((t) => tags.has(t));
  });
  const lessonsDone = !!goal.lessons_done;
  const mentorshipStarted = mentorMatches.some((m) => m.mentee === currentUser?.id && m.status === 'Active');

  const milestones = [
    { key: 'challenge', label: 'Join a challenge linked to this goal', done: challengeJoined },
    { key: 'lessons', label: 'Complete 2 goal-linked lessons', done: lessonsDone, manual: true },
    { key: 'mentorship', label: 'Start a mentorship', done: mentorshipStarted },
  ];
  const completed = milestones.filter((m) => m.done).length;
  const pct = Math.round((completed / milestones.length) * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-stone-700">Goal progress</span>
        <span className="text-sm font-bold text-[#EA580C]">{pct}%</span>
      </div>
      <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#EA580C] rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-4 space-y-2.5">
        {milestones.map((m) => (
          <li key={m.key} className="flex items-center gap-2.5">
            {m.done ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-stone-300 shrink-0" />
            )}
            <span className={`text-sm flex-1 ${m.done ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
              {m.label}
            </span>
            {m.manual && !m.done && (
              <button onClick={() => onUpdateLessons?.(true)} className="text-xs font-semibold text-[#EA580C] hover:underline">
                Mark done
              </button>
            )}
            {m.manual && m.done && (
              <button onClick={() => onUpdateLessons?.(false)} className="text-xs font-semibold text-stone-400 hover:underline">
                Undo
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-stone-400">
        Progress updates automatically as you join challenges and start mentorships.
      </p>
    </div>
  );
}