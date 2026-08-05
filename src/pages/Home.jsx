import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import NotificationBell from '@/components/NotificationBell';
import SetGoalCard from '@/components/goals/SetGoalCard';
import MentorInviteBanner from '@/components/mentors/MentorInviteBanner';
import { Target, AlertOctagon, Users, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { daysSince } from '@/lib/dateUtils';

const HEALTH_FILL = {
  'On track': '#22C55E',
  'At risk': '#F59E0B',
  'Blocked': '#EF4444',
};
const IDLE_INNER = '#FDBA74';
const IDLE_OUTER = '#FED7AA';

// The flower IS the portfolio: each floret is a project, coloured by health.
function IxoraBloom({ projects = [] }) {
  const cx = 80;
  const cy = 80;

  // Most urgent projects take the inner ring, where the eye lands first
  const ordered = useMemo(() => {
    const rank = { Blocked: 0, 'At risk': 1, 'On track': 2 };
    return [...projects].sort(
      (a, b) => (rank[a.health_status] ?? 3) - (rank[b.health_status] ?? 3)
    );
  }, [projects]);

  const inner = ordered.slice(0, 8);
  const outer = ordered.slice(8, 19);

  return (
    <svg viewBox="0 0 160 160" className="w-40 h-40 sm:w-44 sm:h-44 drop-shadow-sm" aria-hidden="true">
      <circle cx={cx} cy={cy} r={9} fill="#C2410C" />
      <circle cx={cx} cy={cy} r={3.5} fill="#FED7AA" />

      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * 20;
        const y = cy + Math.sin(angle) * 20;
        const p = inner[i];
        const fill = p ? (HEALTH_FILL[p.health_status] || HEALTH_FILL['On track']) : IDLE_INNER;
        return (
          <g key={`in-${i}`}>
            <circle cx={x} cy={y} r={7} fill={fill} />
            <circle cx={x} cy={y} r={2.2} fill="#FFF8F2" opacity={0.55} />
          </g>
        );
      })}

      {Array.from({ length: 11 }).map((_, i) => {
        const angle = (i / 11) * Math.PI * 2 + 0.18 - Math.PI / 2;
        const x = cx + Math.cos(angle) * 34;
        const y = cy + Math.sin(angle) * 34;
        const p = outer[i];
        const fill = p ? (HEALTH_FILL[p.health_status] || HEALTH_FILL['On track']) : IDLE_OUTER;
        return (
          <g key={`out-${i}`} opacity={p ? 1 : 0.75}>
            <circle cx={x} cy={y} r={5.4} fill={fill} />
            <circle cx={x} cy={y} r={1.8} fill="#FFF8F2" opacity={0.55} />
          </g>
        );
      })}
    </svg>
  );
}

function Stat({ value, label, tone = 'stone' }) {
  const colour =
    tone === 'orange' ? 'text-[#EA580C]' : tone === 'green' ? 'text-emerald-600' : 'text-stone-800';
  return (
    <div className="flex-1 bg-white rounded-xl border border-stone-100 px-2 py-2.5 text-center">
      <div className={`text-lg font-bold leading-none ${colour}`}>{value}</div>
      <div className="mt-1 text-[9px] font-semibold tracking-wide text-stone-400 uppercase">{label}</div>
    </div>
  );
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [goals, setGoals] = useState([]);
  const [goalTasks, setGoalTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [me, ps, gs, ms, bns, chs] = await Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.Project.list('-created_date', 200).catch(() => []),
      base44.entities.Goal.list('-created_date', 100).catch(() => []),
      base44.entities.Milestone.list('-created_date', 1000).catch(() => []),
      base44.entities.Bottleneck.list('-date_flagged', 500).catch(() => []),
      base44.entities.Challenge.list('-created_date', 200).catch(() => []),
    ]);
    setCurrentUser(me);
    setProjects(ps);
    setGoals(gs);
    setMilestones(ms);
    setBottlenecks(bns);
    setChallenges(chs);

    const mine = gs.filter((g) => g.user === me?.id && !g.archived);
    if (mine.length) {
      const ts = await base44.entities.GoalTask
        .filter({ goal: mine[0].id }, 'position', 100)
        .catch(() => []);
      setGoalTasks(ts);
    } else {
      setGoalTasks([]);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const myActiveGoals = goals.filter((g) => g.user === currentUser?.id && !g.archived);
  const goal = myActiveGoals[0];
  const goalDone = goalTasks.filter((t) => t.done).length;
  const goalPct = goalTasks.length ? Math.round((goalDone / goalTasks.length) * 100) : 0;
  const nextTasks = goalTasks.filter((t) => !t.done).slice(0, 3);

  const myTasks = currentUser
    ? milestones.filter(
        (m) => m.status !== 'Done' &&
          (m.owning_function === currentUser.department || m.owner === currentUser.id)
      )
    : [];

  const onTrackPct = projects.length
    ? Math.round((projects.filter((p) => (p.health_status || 'On track') === 'On track').length / projects.length) * 100)
    : 0;

  // Oldest open bottleneck on a project I'm attached to
  const myProjectIds = new Set(
    projects
      .filter(
        (p) =>
          p.project_lead === currentUser?.id ||
          p.sponsor === currentUser?.id ||
          p.approver === currentUser?.id ||
          (p.functions_involved || []).includes(currentUser?.department)
      )
      .map((p) => p.id)
  );
  const myBlocker = bottlenecks
    .filter((b) => b.status === 'Open' && myProjectIds.has(b.project))
    .sort((a, b) => daysSince(b.date_flagged) - daysSince(a.date_flagged))[0];
  const blockerProject = myBlocker ? projects.find((p) => p.id === myBlocker.project) : null;

  // Team activity
  const recentCleared = bottlenecks.filter((b) => b.status === 'Cleared').length;
  const myTags = new Set();
  myActiveGoals.forEach((g) => (g.matching_skill_tags || []).forEach((t) => myTags.add(t)));
  const matchingChallenges = challenges.filter(
    (c) => !c.archived && (c.status || 'Open') === 'Open' && (c.skill_tags || []).some((t) => myTags.has(t))
  ).length;

  const sponsorsAProject = !!currentUser && projects.some((p) => p.sponsor === currentUser.id);
  const canSeeDashboard =
    !!currentUser &&
    (currentUser.role === 'Director' || currentUser.role === 'Manager' || sponsorsAProject);

  const firstName = currentUser?.full_name?.split(' ')[0];
  const initials = (currentUser?.full_name || currentUser?.email || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-[100dvh] bg-[#FFF8F2] pb-10">
      {/* Header */}
      <header className="max-w-md mx-auto px-4 pt-4 flex items-center justify-between">
        <Link to="/profile" className="flex items-center gap-2.5 min-w-0">
          {currentUser?.avatar_url ? (
            <img src={currentUser.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover bg-orange-100" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-orange-100 text-[#EA580C] font-bold text-xs flex items-center justify-center">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-stone-800 truncate">{firstName || 'Welcome'}</div>
            {currentUser?.department && (
              <div className="text-[10px] text-stone-400 truncate">{currentUser.department}</div>
            )}
          </div>
        </Link>
        <NotificationBell />
      </header>

      {/* Hero */}
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="flex justify-center animate-[bloomIn_0.7s_ease-out]">
          <IxoraBloom projects={projects} />
        </div>
        <h1 className="-mt-2 text-4xl font-bold tracking-tight text-[#EA580C] font-heading">Ixora</h1>
        <p className="mt-1 text-sm text-[#57534E]">Many hands, one bloom</p>
      </div>

      <main className="max-w-md mx-auto px-4 mt-5 space-y-3">
        {/* Stats */}
        <div className="flex gap-2">
          <Stat value={projects.length} label="Projects" />
          <Stat value={myTasks.length} label="Your tasks" tone="orange" />
          <Stat value={`${onTrackPct}%`} label="On track" tone="green" />
        </div>

        {/* Goal */}
        {loading ? null : !goal ? (
          <SetGoalCard currentUser={currentUser} onComplete={load} />
        ) : (
          <Link to="/profile" className="block">
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 hover:border-orange-200 transition">
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 shrink-0">
                  <svg viewBox="0 0 42 42" className="w-14 h-14 -rotate-90">
                    <circle cx="21" cy="21" r="16" fill="none" stroke="#FEE7D6" strokeWidth="5" />
                    <circle
                      cx="21" cy="21" r="16" fill="none" stroke="#EA580C" strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={`${goalPct} 100`}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-stone-800">
                    {goalPct}%
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3 h-3 text-[#EA580C] shrink-0" />
                    <span className="text-[10px] font-semibold tracking-wide text-stone-400 uppercase">Your goal</span>
                  </div>
                  <p className="mt-0.5 text-sm text-stone-800 leading-snug break-words">{goal.goal_text}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
              </div>

              {goalTasks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-stone-100 space-y-1.5">
                  {nextTasks.length > 0 ? (
                    nextTasks.map((t) => (
                      <div key={t.id} className="flex items-center gap-2">
                        <Circle className="w-4 h-4 text-stone-300 shrink-0" />
                        <span className="text-xs text-stone-600 truncate">{t.title}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-xs text-emerald-700 font-medium">Every task done — set your next goal.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Link>
        )}

        {/* Blocker */}
        {myBlocker && (
          <Link to={`/projects/${myBlocker.project}`} className="block">
            <div className="bg-white rounded-r-2xl border border-stone-100 border-l-4 border-l-red-500 shadow-sm px-4 py-3 hover:border-orange-200 transition">
              <div className="flex items-center gap-1.5">
                <AlertOctagon className="w-3 h-3 text-red-500 shrink-0" />
                <span className="text-[10px] font-semibold tracking-wide text-red-600 uppercase">
                  Blocked · {daysSince(myBlocker.date_flagged)} days
                </span>
              </div>
              <p className="mt-1 text-sm text-stone-800 leading-snug">
                {myBlocker.title}
                {myBlocker.waiting_on && (
                  <span className="text-stone-500"> — waiting on {myBlocker.waiting_on}</span>
                )}
              </p>
              {blockerProject && (
                <p className="mt-0.5 text-[11px] text-stone-400">{blockerProject.name}</p>
              )}
            </div>
          </Link>
        )}

        {/* Team today */}
        {(recentCleared > 0 || matchingChallenges > 0) && (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm px-4 py-3">
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3 text-stone-400 shrink-0" />
              <span className="text-[10px] font-semibold tracking-wide text-stone-400 uppercase">Team today</span>
            </div>
            <p className="mt-1 text-sm text-stone-700 leading-snug">
              {recentCleared > 0 && (
                <>{recentCleared} blocker{recentCleared === 1 ? '' : 's'} cleared so far. </>
              )}
              {matchingChallenges > 0 && (
                <>
                  <Link to="/challenges" className="text-[#EA580C] font-medium">
                    {matchingChallenges} challenge{matchingChallenges === 1 ? '' : 's'}
                  </Link>{' '}
                  match your goal.
                </>
              )}
            </p>
          </div>
        )}

        <MentorInviteBanner />

        {/* Actions.
            Under 640px the bottom nav covers Projects, Challenges, Team and
            Profile, so those buttons are hidden here to avoid duplication.
            At 640px and above the nav disappears, so every destination shows. */}
        <div className="hidden sm:grid grid-cols-3 gap-2 pt-1">
          <Link to="/projects" className="bg-[#EA580C] text-white text-center text-xs font-semibold py-3 rounded-xl shadow-sm hover:bg-[#c2410c] active:scale-95 transition">
            Projects
          </Link>
          <Link to="/challenges" className="bg-white text-[#EA580C] border border-orange-200 text-center text-xs font-semibold py-3 rounded-xl shadow-sm hover:bg-orange-50 active:scale-95 transition">
            Challenges
          </Link>
          <Link to="/team" className="bg-white text-[#EA580C] border border-orange-200 text-center text-xs font-semibold py-3 rounded-xl shadow-sm hover:bg-orange-50 active:scale-95 transition">
            Team
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 sm:pt-0">
          <Link to="/mentors" className="bg-white text-[#EA580C] border border-orange-200 text-center text-xs font-semibold py-3 rounded-xl shadow-sm hover:bg-orange-50 active:scale-95 transition">
            Find a mentor
          </Link>
          {canSeeDashboard ? (
            <Link to="/sponsor" className="bg-stone-900 text-white text-center text-xs font-semibold py-3 rounded-xl shadow-sm hover:bg-stone-800 active:scale-95 transition">
              Sponsor dashboard
            </Link>
          ) : (
            <Link to="/profile" className="hidden sm:block bg-white text-[#EA580C] border border-orange-200 text-center text-xs font-semibold py-3 rounded-xl shadow-sm hover:bg-orange-50 active:scale-95 transition">
              My profile
            </Link>
          )}
        </div>

        <p className="pt-4 text-center text-[10px] uppercase tracking-[0.25em] text-[#A8A29E]">
          Orange Groups · Internal
        </p>
      </main>

      <style>{`
        @keyframes bloomIn {
          from { opacity: 0; transform: scale(0.88) rotate(-8deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}