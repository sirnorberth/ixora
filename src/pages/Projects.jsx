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
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [view, setView] = useState('list');

  useEffect(() => {
    (async () => {
      try {
        const [p, m, b, us, me] = await Promise.all([
          base44.entities.Project.list('-created_date', 200),
          base44.entities.Milestone.list('-created_date', 1000),
          base44.entities.Bottleneck.list('-created_date', 1000),
          base44.entities.User.list(),
          base44.auth.me().catch(() => null),
        ]);
        setProjects(p);
        setMilestones(m);
        setBottlenecks(b);
        setUsers(us);
        setCurrentUser(me);
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
      const byProject = {};
      myTasks.forEach((m) => {
        byProject[m.project] = (byProject[m.project] || 0) + 1;
      });
      const lines = Object.entries(byProject).map(([pid, n]) => {
        const p = projects.find((x) => x.id === pid);
        return `- ${p?.name || 'Project'}: ${n} task(s)`;
      });
      const body = myTasks.length
        ? `You have ${myTasks.length} open task(s) matching your function/role:\n\n${lines.join('\n')}\n\nOpen Ixora to view them.`
        : 'You have no open tasks matching your function/role right now.';
      await base44.integrations.Core.SendEmail({
        to: currentUser.email,
        subject: `Ixora — ${myTasks.length} task(s) need your attention`,
        body,
      });
    } catch (e) {
      console.error(e);
      // Re-throw so the banner can show a real failure instead of
      // claiming the email was sent.
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