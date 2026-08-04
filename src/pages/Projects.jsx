import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Flower2, Plus, GripVertical, LayoutList, Columns3 } from 'lucide-react';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectFormDialog from '@/components/projects/ProjectFormDialog';
import YourTasksBanner from '@/components/projects/YourTasksBanner';
import KanbanBoard from '@/components/projects/KanbanBoard';
import AppHeader from '@/components/AppHeader';
import { notifyProjectDone, notifyProjectCreated } from '@/lib/notify';

const orderKey = (uid) => `ixora_project_order_${uid || 'anon'}`;

function applyOrder(projects, savedOrder) {
  if (!savedOrder || !savedOrder.length) return projects;
  const map = new Map(projects.map((p) => [p.id, p]));
  const ordered = [];
  savedOrder.forEach((id) => {
    if (map.has(id)) {
      ordered.push(map.get(id));
      map.delete(id);
    }
  });
  map.forEach((p) => ordered.push(p));
  return ordered;
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [users, setUsers] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [applications, setApplications] = useState([]);
  const [goals, setGoals] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [view, setView] = useState('list');

  useEffect(() => {
    (async () => {
      try {
        const [p, m, b, us, me, chs, apps, gs] = await Promise.all([
          base44.entities.Project.list('-created_date', 200),
          base44.entities.Milestone.list('-created_date', 1000),
          base44.entities.Bottleneck.list('-created_date', 1000),
          base44.entities.User.list(),
          base44.auth.me().catch(() => null),
          base44.entities.Challenge.list('-created_date', 300).catch(() => []),
          base44.entities.Application.list('-created_date', 1000).catch(() => []),
          base44.entities.Goal.list('-created_date', 300).catch(() => []),
        ]);
        setProjects(p);
        setMilestones(m);
        setBottlenecks(b);
        setUsers(us);
        setCurrentUser(me);
        setChallenges(chs);
        setApplications(apps);
        setGoals(gs);
        let saved = [];
        try {
          saved = JSON.parse(localStorage.getItem(orderKey(me?.id)) || '[]');
        } catch {
          saved = [];
        }
        setOrder(saved);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const canManage = !!currentUser;
  const orderedProjects = applyOrder(projects, order);

  const msFor = (pid) => milestones.filter((m) => m.project === pid);
  const bnFor = (pid) => bottlenecks.filter((b) => b.project === pid);

  const onDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const next = Array.from(orderedProjects);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    const newOrder = next.map((p) => p.id);
    setOrder(newOrder);
    try {
      localStorage.setItem(orderKey(currentUser?.id), JSON.stringify(newOrder));
    } catch {
      /* ignore */
    }
  };

  const handleCreate = async (values) => {
    const created = await base44.entities.Project.create({ ...values, approval_status: 'Pending' });
    const approver = users.find((u) => u.id === values.approver);
    const sponsor = users.find((u) => u.id === values.sponsor);
    const notify = async (u, role) => {
      if (!u?.email) return;
      try {
        await base44.integrations.Core.SendEmail({
          to: u.email,
          subject: `Ixora — you're listed as ${role} on "${created.name}"`,
          body: `Hi ${u.full_name || ''},\n\nA new project "${created.name}" has been created on Ixora and you're listed as the ${role}.${role === 'approver' ? ' It needs your approval — open Ixora to review.' : ' Open Ixora to view the project.'}`,
        });
      } catch (e) {
        // Email is a nice-to-have here — never block project creation
        console.error('Project notification email failed:', e);
      }
    };
    await Promise.all([notify(approver, 'approver'), notify(sponsor, 'sponsor')]);
    // In-app notification for the whole project team
    notifyProjectCreated(created, currentUser).catch((e) => console.error(e));
    setProjects((prev) => [created, ...prev]);
    setOrder((prev) => [created.id, ...prev]);
    try {
      localStorage.setItem(orderKey(currentUser?.id), JSON.stringify([created.id, ...order]));
    } catch {
      /* ignore */
    }
    setDialogOpen(false);
  };

  const handleMoveStatus = async (projectId, newStatus) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
    const patch = { status: newStatus };
    if (newStatus === 'Done' && proj.review_status !== 'Reviewed') {
      patch.review_status = 'Pending';
    }
    await base44.entities.Project.update(projectId, patch);
    if (newStatus === 'Done' && proj.status !== 'Done') {
      await notifyProjectDone({ ...proj, ...patch }, currentUser?.id);
    }
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, ...patch } : p)));
  };

  const myTasks = currentUser
    ? milestones.filter(
        (m) => m.status !== 'Done' && (m.owning_function === currentUser.department || m.owner === currentUser.id)
      )
    : [];

  const handleNotify = async () => {
    if (!currentUser) return;
    setNotifying(true);
    try {
      const nameOfProject = (pid) => projects.find((x) => x.id === pid)?.name || 'Project';
      const lines = [];

      // ---- A. Tasks for me / my function ----
      lines.push('YOUR OPEN TASKS');
      if (myTasks.length) {
        const byProject = {};
        myTasks.forEach((m) => {
          (byProject[m.project] = byProject[m.project] || []).push(m);
        });
        Object.entries(byProject).forEach(([pid, ms]) => {
          lines.push(`${nameOfProject(pid)} — ${ms.length} task(s):`);
          ms.forEach((m) => {
            const due = m.due_date ? ` (due ${m.due_date})` : '';
            lines.push(`   • ${m.title} — ${m.status}${due}`);
          });
        });
      } else {
        lines.push('No open tasks match your function or role right now.');
      }

      // ---- B. General update ----
      // Projects I'm attached to
      const myProjects = projects.filter(
        (p) =>
          p.project_lead === currentUser.id ||
          p.sponsor === currentUser.id ||
          p.approver === currentUser.id ||
          (p.functions_involved || []).includes(currentUser.department)
      );
      lines.push('');
      lines.push('YOUR PROJECTS');
      if (myProjects.length) {
        myProjects.forEach((p) => {
          const ms = milestones.filter((m) => m.project === p.id);
          const done = ms.filter((m) => m.status === 'Done').length;
          const openBlockers = bottlenecks.filter((b) => b.project === p.id && b.status === 'Open').length;
          const role =
            p.project_lead === currentUser.id ? 'lead'
            : p.sponsor === currentUser.id ? 'sponsor'
            : p.approver === currentUser.id ? 'approver'
            : 'your function';
          lines.push(
            `   • ${p.name} — ${p.status || 'Not Started'}, ${p.health_status || 'On track'}` +
            (ms.length ? `, ${done}/${ms.length} milestones done` : '') +
            (openBlockers ? `, ${openBlockers} open blocker(s)` : '') +
            ` [${role}]`
          );
        });
      } else {
        lines.push('   You are not attached to any project yet.');
      }

      // Awaiting my approval
      const awaitingMe = projects.filter(
        (p) => p.approver === currentUser.id && p.approval_status === 'Pending'
      );
      if (awaitingMe.length) {
        lines.push('');
        lines.push('AWAITING YOUR APPROVAL');
        awaitingMe.forEach((p) => lines.push(`   • ${p.name}`));
      }

      // Challenges I applied to or sponsor
      const myApps = applications.filter((a) => a.user === currentUser.id);
      const mySponsored = challenges.filter((c) => c.sponsor === currentUser.id && !c.archived);
      lines.push('');
      lines.push('YOUR CHALLENGES');
      if (myApps.length || mySponsored.length) {
        myApps.forEach((a) => {
          const c = challenges.find((x) => x.id === a.challenge);
          if (c) lines.push(`   • ${c.title} — application ${a.status || 'Applied'}, challenge ${c.status || 'Open'}`);
        });
        mySponsored.forEach((c) => {
          const count = applications.filter((a) => a.challenge === c.id).length;
          lines.push(`   • ${c.title} (you sponsor) — ${c.status || 'Open'}, ${count} applicant(s)`);
        });
      } else {
        lines.push('   No challenges yet — browse the challenges page to join one.');
      }

      // Goals and their tasks
      const myGoals = goals.filter((g) => g.user === currentUser.id && !g.archived);
      lines.push('');
      lines.push('YOUR GOAL');
      if (myGoals.length) {
        for (const g of myGoals) {
          let gTasks = [];
          try {
            gTasks = await base44.entities.GoalTask.filter({ goal: g.id }, 'position', 100);
          } catch {
            gTasks = [];
          }
          const done = gTasks.filter((t) => t.done).length;
          const pct = gTasks.length ? Math.round((done / gTasks.length) * 100) : 0;
          lines.push(`   • ${g.goal_text}`);
          lines.push(
            `     Target ${g.target_date || '—'} · ` +
            (gTasks.length ? `${done}/${gTasks.length} tasks done (${pct}%)` : 'no tasks added yet')
          );
          gTasks.filter((t) => !t.done).slice(0, 5).forEach((t) => {
            lines.push(`        ◦ ${t.title}`);
          });
        }
      } else {
        lines.push('   No active goal — set one on your profile to get matched to challenges.');
      }

      await base44.integrations.Core.SendEmail({
        to: currentUser.email,
        subject: `Ixora update — ${myTasks.length} task(s) need your attention`,
        body: lines.join('\n'),
      });
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setNotifying(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#FFF8F2]">
      <AppHeader
        right={
          <div className="flex items-center gap-2">
            <div className="flex bg-white border border-stone-200 rounded-xl p-0.5">
              <button
                onClick={() => setView('list')}
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition ${view === 'list' ? 'bg-[#EA580C] text-white' : 'text-stone-500'}`}
              >
                <LayoutList className="w-4 h-4" /> List
              </button>
              <button
                onClick={() => setView('kanban')}
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition ${view === 'kanban' ? 'bg-[#EA580C] text-white' : 'text-stone-500'}`}
              >
                <Columns3 className="w-4 h-4" /> Kanban
              </button>
            </div>
            {canManage && (
              <button
                onClick={() => setDialogOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#c2410c] px-3 py-2 rounded-xl transition"
              >
                <Plus className="w-4 h-4" /> New
              </button>
            )}
          </div>
        }
      />

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        <h2 className="text-xl font-bold text-stone-800 px-1">Projects</h2>
        {currentUser && (
          <YourTasksBanner myTasks={myTasks} projects={projects} onNotify={handleNotify} notifying={notifying} />
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-[#EA580C] rounded-full animate-spin" />
          </div>
        ) : orderedProjects.length === 0 ? (
          <div className="text-center py-16">
            <Flower2 className="w-10 h-10 text-orange-200 mx-auto mb-3" />
            <p className="text-stone-500">No projects yet. Tap “New” to start your first one.</p>
          </div>
        ) : view === 'kanban' ? (
          <KanbanBoard projects={orderedProjects} onMoveStatus={handleMoveStatus} />
        ) : (
          <>
            <p className="text-xs text-stone-400 flex items-center gap-1.5">
              <GripVertical className="w-3.5 h-3.5" /> Hold the grip to drag and reorder.
            </p>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="projects">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                    {orderedProjects.map((p, index) => (
                      <Draggable key={p.id} draggableId={p.id} index={index}>
                        {(prov) => (
                          <div ref={prov.innerRef} {...prov.draggableProps} className="flex gap-2 items-stretch">
                            <div
                              {...prov.dragHandleProps}
                              className="flex items-center pl-1 text-stone-300 hover:text-stone-400 cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <Link to={`/projects/${p.id}`} className="block flex-1">
                              <ProjectCard project={p} milestones={msFor(p.id)} bottlenecks={bnFor(p.id)} />
                            </Link>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </>
        )}
      </main>

      {canManage && (
        <ProjectFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          project={null}
          users={users}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}