import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SetGoalCard from '@/components/goals/SetGoalCard';
import MentorInviteBanner from '@/components/mentors/MentorInviteBanner';
import ProjectsAtAGlance from '@/components/home/ProjectsAtAGlance';
import LoopCard from '@/components/home/LoopCard';
import WelcomeNote from '@/components/home/WelcomeNote';
import NotificationBell from '@/components/NotificationBell';
import { Target, Calendar, Users } from 'lucide-react';
import { fmtDate } from '@/lib/dateUtils';

function IxoraFlower() {
  const florets = [];
  const cx = 60;
  const cy = 60;

  florets.push(
    <g key="center">
      <circle cx={cx} cy={cy} r={6} fill="#C2410C" />
      <circle cx={cx} cy={cy} r={2.4} fill="#FED7AA" />
    </g>
  );

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const r = 15;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    florets.push(
      <g key={`inner-${i}`}>
        <circle cx={x} cy={y} r={5} fill="#EA580C" />
        <circle cx={x} cy={y} r={1.8} fill="#FB923C" />
      </g>
    );
  }

  for (let i = 0; i < 11; i++) {
    const angle = (i / 11) * Math.PI * 2 + 0.18;
    const r = 28;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    florets.push(
      <g key={`outer-${i}`}>
        <circle cx={x} cy={y} r={4.4} fill="#F97316" />
        <circle cx={x} cy={y} r={1.5} fill="#FDBA74" />
      </g>
    );
  }

  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28 drop-shadow-sm" aria-hidden="true">
      {florets}
    </svg>
  );
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [me, gs, ps] = await Promise.all([
          base44.auth.me().catch(() => null),
          base44.entities.Goal.list('-created_date', 50).catch(() => []),
          base44.entities.Project.list('-created_date', 200).catch(() => []),
        ]);
        setCurrentUser(me);
        setGoals(gs);
        setProjects(ps);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refresh = async () => {
    const gs = await base44.entities.Goal.list('-created_date', 50);
    setGoals(gs);
  };

  const myActiveGoals = goals.filter((g) => g.user === currentUser?.id && !g.archived);
  const hasActiveGoal = myActiveGoals.length > 0;
  const latestGoal = myActiveGoals[0];

  // Roles are Employee / Manager / Director. Show the oversight dashboard link
  // to Managers, Directors, and anyone sponsoring at least one project —
  // this must match the access rule inside SponsorDashboard.jsx.
  const sponsorsAProject = !!currentUser && projects.some((p) => p.sponsor === currentUser.id);
  const canSeeDashboard =
    !!currentUser &&
    (currentUser.role === 'Director' || currentUser.role === 'Manager' || sponsorsAProject);

  return (
    <div className="min-h-[100dvh] bg-[#FFF8F2] flex flex-col items-center px-6 py-10 text-center">
      <div className="fixed top-3 right-3 z-20"><NotificationBell /></div>
      <div className="animate-[fadeIn_0.6s_ease-out]">
        <IxoraFlower />
      </div>
      <h1 className="mt-8 text-5xl font-bold tracking-tight text-[#EA580C] font-heading">Ixora</h1>
      <p className="mt-3 text-base text-[#57534E] max-w-xs leading-relaxed">
        Many hands, one bloom.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 bg-[#EA580C] text-white font-semibold px-6 py-3 rounded-2xl shadow-sm hover:bg-[#c2410c] active:scale-95 transition"
        >
          View projects
        </Link>
        <Link
          to="/challenges"
          className="inline-flex items-center gap-2 bg-white text-[#EA580C] font-semibold px-6 py-3 rounded-2xl shadow-sm border border-orange-200 hover:bg-orange-50 active:scale-95 transition"
        >
          View challenges
        </Link>
        <Link
          to="/mentors"
          className="inline-flex items-center gap-2 bg-white text-[#EA580C] font-semibold px-6 py-3 rounded-2xl shadow-sm border border-orange-200 hover:bg-orange-50 active:scale-95 transition"
        >
          Find a mentor
        </Link>
        <Link
          to="/team"
          className="inline-flex items-center gap-2 bg-white text-[#EA580C] font-semibold px-6 py-3 rounded-2xl shadow-sm border border-orange-200 hover:bg-orange-50 active:scale-95 transition"
        >
          <Users className="w-4 h-4" /> Team
        </Link>
        {canSeeDashboard && (
          <Link
            to="/sponsor"
            className="inline-flex items-center gap-2 bg-stone-900 text-white font-semibold px-6 py-3 rounded-2xl shadow-sm hover:bg-stone-800 active:scale-95 transition"
          >
            Sponsor dashboard
          </Link>
        )}
      </div>

      <div className="mt-8 w-full max-w-md space-y-4 text-left">
        <WelcomeNote />
        <ProjectsAtAGlance />

        {loading ? null : !hasActiveGoal ? (
          <SetGoalCard currentUser={currentUser} onComplete={refresh} />
        ) : (
          <Link to="/profile" className="block">
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 hover:border-orange-200 transition">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#EA580C] shrink-0" />
                <h3 className="font-semibold text-stone-800 flex-1 truncate">Your goal</h3>
                <span className="text-xs text-stone-400">tap to open →</span>
              </div>
              <p className="mt-2 text-sm text-stone-700 font-medium break-words">{latestGoal.goal_text}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
                {latestGoal.goal_type && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C]">{latestGoal.goal_type}</span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {fmtDate(latestGoal.target_date)}
                </span>
              </div>
            </div>
          </Link>
        )}

        <MentorInviteBanner />
        <LoopCard />
      </div>

      <Link to="/profile" className="mt-8 text-sm font-semibold text-[#EA580C] hover:underline">
        My profile →
      </Link>
      <p className="mt-6 text-[11px] uppercase tracking-[0.25em] text-[#A8A29E]">ORANGE GROUPS · INTERNAL</p>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}