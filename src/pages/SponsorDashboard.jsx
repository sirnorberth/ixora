// SponsorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

import HealthBadge from '@/components/projects/HealthBadge';
import MetricCard from '@/components/sponsor/MetricCard';
import BottleneckFeed from '@/components/sponsor/BottleneckFeed';
import ResistanceLogPanel from '@/components/sponsor/ResistanceLogPanel';
import AppHeader from '@/components/AppHeader';
import { daysSince, todayISODate } from '@/lib/dateUtils';

export default function SponsorDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [applications, setApplications] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [goals, setGoals] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [me, ps, bns, apps, chs, gs, ls] = await Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.Project.list('-created_date', 500),
      base44.entities.Bottleneck.list('date_flagged', 500),
      base44.entities.Application.list('-created_date', 1000),
      base44.entities.Challenge.list('-created_date', 500),
      base44.entities.Goal.list('-created_date', 1000),
      base44.entities.ResistanceLog.list('-logged_date', 500),
    ]);
    setCurrentUser(me);
    setProjects(ps);
    setBottlenecks(bns);
    setApplications(apps);
    setChallenges(chs);
    setGoals(gs);
    setLogs(ls);
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

  const activeProjects = projects.filter(
    (p) => p.approval_status === 'Approved' && p.status !== 'Done' && p.status !== 'Suspended'
  );
  const totalValue = activeProjects.reduce((sum, p) => {
    const m = (p.value_at_stake || '').match(/(\d+(?:\.\d+)?)/);
    return sum + (m ? Number(m[1]) : 0);
  }, 0);
  const openBns = bottlenecks.filter((b) => b.status === 'Open');
  const avgAge = openBns.length
    ? Math.round(openBns.reduce((s, b) => s + daysSince(b.date_flagged), 0) / openBns.length)
    : 0;
  const clearedCount = bottlenecks.filter((b) => b.status === 'Cleared').length;
  const totalApps = applications.length;

  const challengeOf = (id) => challenges.find((c) => c.id === id);
  const goalTagsOf = (uid) => {
    const tags = new Set();
    goals.filter((g) => g.user === uid && !g.archived).forEach((g) => (g.matching_skill_tags || []).forEach((t) => tags.add(t)));
    return tags;
  };
  const goalLinked = applications.filter((a) => {
    const ch = challengeOf(a.challenge);
    const tags = goalTagsOf(a.user);
    return ch && (ch.skill_tags || []).some((t) => tags.has(t));
  }).length;
  const goalLinkedPct = totalApps ? Math.round((goalLinked / totalApps) * 100) : 0;
  const usersWithGoal = new Set(goals.map((g) => g.user)).size;

  const projectOf = (id) => projects.find((p) => p.id === id);

  const handleAddLog = async (form) => {
    const created = await base44.entities.ResistanceLog.create({
      quote: form.quote.trim(),
      resolution: form.resolution.trim() || undefined,
      logged_date: form.logged_date || todayISODate(),
    });
    setLogs((prev) => [created, ...prev]);
  };
  const handleDeleteLog = async (id) => {
    await base44.entities.ResistanceLog.delete(id);
    setLogs((prev) => prev.filter((l) => l.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#FFF8F2] flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-orange-200 border-t-[#EA580C] rounded-full animate-spin" />
      </div>
    );
  }

  // Roles are Employee / Manager / Director. Oversight view is for Managers and
  // Directors, plus anyone sponsoring at least one project.
  // (To restrict to Directors only, delete the Manager and sponsorsAProject lines.)
  const sponsorsAProject = !!currentUser && projects.some((p) => p.sponsor === currentUser.id);
  const canViewDashboard =
    !!currentUser &&
    (currentUser.role === 'Director' || currentUser.role === 'Manager' || sponsorsAProject);

  if (!canViewDashboard) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#FFF8F2]">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        <h2 className="text-xl font-bold text-stone-800 px-1">Sponsor dashboard</h2>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Value at stake"
            value={`₦${totalValue}M`}
            sub={`${activeProjects.length} active project${activeProjects.length === 1 ? '' : 's'}`}
          />
          <MetricCard label="Avg blocker age" value={`${avgAge} days`} sub={`${openBns.length} open`} />
          <MetricCard label="Cleared bottlenecks" value={clearedCount} sub="during the pilot" />
          <MetricCard label="Applications" value={totalApps} sub={`${goalLinkedPct}% goal-linked`} />
          <MetricCard label="Users with a goal" value={usersWithGoal} className="col-span-2" />
        </div>

        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
          <h3 className="font-semibold text-stone-800 mb-3">Portfolio health</h3>
          {projects.length === 0 ? (
            <p className="text-sm text-stone-500">No projects yet.</p>
          ) : (
            <div className="space-y-2.5">
              {projects.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0 border-stone-100">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-stone-800 truncate">{p.name}</div>
                    {p.category && <div className="text-xs text-stone-500">{p.category}</div>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm text-stone-600 text-right max-w-[140px] truncate">
                      {p.value_at_stake || '—'}
                    </span>
                    <HealthBadge status={p.health_status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
          <h3 className="font-semibold text-stone-800">Bottleneck feed</h3>
          <p className="text-xs text-stone-500 mb-3">Oldest first · red = escalation due (over 10 days)</p>
          <BottleneckFeed bottlenecks={bottlenecks} projectOf={projectOf} />
        </section>

        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
          <h3 className="font-semibold text-stone-800">Resistance log</h3>
          <p className="text-xs text-stone-500 mb-3">Dated verbatim objections and how they were resolved.</p>
          <ResistanceLogPanel logs={logs} onAdd={handleAddLog} onDelete={handleDeleteLog} />
        </section>
      </main>
    </div>
  );
}