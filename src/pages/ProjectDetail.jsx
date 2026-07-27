// ProjectDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Calendar, User2, TrendingUp, Pencil, CheckCircle2, XCircle, ClipboardCheck, AlertOctagon } from 'lucide-react';
import HealthBadge from '@/components/projects/HealthBadge';
import PetalStrip from '@/components/projects/PetalStrip';
import PhaseRoadmap from '@/components/projects/PhaseRoadmap';
import BottleneckCard from '@/components/projects/BottleneckCard';
import MilestoneList from '@/components/projects/MilestoneList';
import FlagBottleneck from '@/components/projects/FlagBottleneck';
import ProjectFormDialog from '@/components/projects/ProjectFormDialog';
import ApprovalBadge from '@/components/projects/ApprovalBadge';
import ProjectStatusBadge from '@/components/projects/ProjectStatusBadge';
import ProjectReviewDialog from '@/components/projects/ProjectReviewDialog';
import ProjectChat from '@/components/projects/ProjectChat';
import AppHeader from '@/components/AppHeader';
import {
  notifyMilestoneAdded,
  notifyMilestoneStatus,
  notifyBottleneckFlagged,
  notifyBottleneckCleared,
  notifyProjectDone,
} from '@/lib/notify';
import { fmtDate, daysSince, todayISODate } from '@/lib/dateUtils';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, ms, bns, us, me] = await Promise.all([
          base44.entities.Project.get(id),
          base44.entities.Milestone.filter({ project: id }, 'due_date'),
          base44.entities.Bottleneck.filter({ project: id }, '-date_flagged'),
          base44.entities.User.list(),
          base44.auth.me().catch(() => null),
        ]);
        setProject(p);
        setMilestones(ms);
        setBottlenecks(bns);
        setUsers(us);
        setCurrentUser(me);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const refreshMilestones = async () => {
    const ms = await base44.entities.Milestone.filter({ project: id }, 'due_date');
    setMilestones(ms);
  };
  const refreshBottlenecks = async () => {
    const bns = await base44.entities.Bottleneck.filter({ project: id }, '-date_flagged');
    setBottlenecks(bns);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#FFF8F2] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-200 border-t-[#EA580C] rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-[100dvh] bg-[#FFF8F2] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-stone-600">Project not found.</p>
        <button onClick={() => navigate('/projects')} className="mt-4 text-[#EA580C] font-semibold">Back to projects</button>
      </div>
    );
  }

  const canEditProject = !!currentUser;

  // Roles are Employee / Manager / Director.
  const canEditMilestones =
    !!currentUser &&
    (currentUser.role === 'Director' ||
      currentUser.role === 'Manager' ||
      project.project_lead === currentUser.id ||
      project.sponsor === currentUser.id);

  const nameOf = (uid) => {
    if (!uid) return null;
    const u = users.find((x) => x.id === uid);
    return u ? (u.full_name || u.email) : null;
  };
  const sponsorName = nameOf(project.sponsor);
  const approverName = nameOf(project.approver);
  const reviewerName = nameOf(project.reviewed_by);
  const canApprove = !!currentUser && (currentUser.id === project.approver || currentUser.id === project.sponsor);

  const handleUpdateProject = async (values) => {
    const patch = { ...values };
    if (values.status === 'Done' && project.review_status !== 'Reviewed') {
      patch.review_status = 'Pending';
    }
    await base44.entities.Project.update(id, patch);
    const updated = await base44.entities.Project.get(id);
    if (values.status === 'Done' && project.status !== 'Done') {
      await notifyProjectDone(updated, currentUser?.id);
    }
    setProject(updated);
    setEditOpen(false);
  };

  const handleApprove = async () => {
    await base44.entities.Project.update(id, { approval_status: 'Approved', approved_by: currentUser?.id, approved_date: todayISODate() });
    setProject(await base44.entities.Project.get(id));
  };
  const handleReject = async () => {
    await base44.entities.Project.update(id, { approval_status: 'Rejected', approved_by: currentUser?.id, approved_date: todayISODate() });
    setProject(await base44.entities.Project.get(id));
  };

  const canReview =
    !!currentUser &&
    (currentUser.id === project.sponsor ||
      currentUser.id === project.approver ||
      currentUser.id === project.project_lead ||
      currentUser.role === 'Director');

  const handleCompleteReview = async (values) => {
    await base44.entities.Project.update(id, { ...values, review_status: 'Reviewed', reviewed_by: currentUser?.id, reviewed_date: todayISODate() });
    setProject(await base44.entities.Project.get(id));
    setReviewOpen(false);
  };
  const lead = users.find((u) => u.id === project.project_lead);
  const leadName = lead ? (lead.full_name || lead.email) : 'Unassigned';

  // ALL open bottlenecks, oldest (most urgent) first
  const openBottlenecks = bottlenecks
    .filter((b) => b.status === 'Open')
    .sort((a, b) => daysSince(b.date_flagged) - daysSince(a.date_flagged));
  const clearedBottlenecks = bottlenecks.filter((b) => b.status === 'Cleared');

  const handleStatusChange = async (mid, status) => {
    await base44.entities.Milestone.update(mid, { status, status_since: todayISODate() });
    if (status === 'Delayed' || status === 'Blocked') {
      const m = milestones.find((x) => x.id === mid);
      if (m) await notifyMilestoneStatus({ ...m, status }, project, status, currentUser?.id);
    }
    await refreshMilestones();
  };

  const handleAddMilestone = async (values) => {
    const created = await base44.entities.Milestone.create({ ...values, project: id, status_since: todayISODate() });
    await notifyMilestoneAdded(created, project, currentUser?.id);
    await refreshMilestones();
  };

  const handleUpdateMilestone = async (mid, values) => {
    const patch = { ...values };
    const existing = milestones.find((m) => m.id === mid);
    if (existing && values.status && values.status !== existing.status) {
      patch.status_since = todayISODate();
    }
    await base44.entities.Milestone.update(mid, patch);
    if (existing && values.status && values.status !== existing.status && (values.status === 'Delayed' || values.status === 'Blocked')) {
      await notifyMilestoneStatus({ ...existing, ...values }, project, values.status, currentUser?.id);
    }
    await refreshMilestones();
  };

  const handleDeleteMilestone = async (mid) => {
    await base44.entities.Milestone.delete(mid);
    await refreshMilestones();
  };

  const handleFlagBottleneck = async ({ title, waiting_on }) => {
    const created = await base44.entities.Bottleneck.create({
      project: id,
      title,
      waiting_on,
      flagged_by: currentUser?.id,
      date_flagged: new Date().toISOString(),
      status: 'Open',
      milestones_blocked: 0,
      posted_as_challenge: false,
    });
    // Notify every project participant: lead, sponsor, approver, milestone
    // owners, involved functions, and the function being waited on.
    await notifyBottleneckFlagged(created, project, milestones, currentUser?.id);
    await refreshBottlenecks();
  };

  const handleBottleneckCleared = async (bottleneck) => {
    if (bottleneck) {
      await notifyBottleneckCleared(bottleneck, project, milestones, currentUser?.id);
    }
    await refreshBottlenecks();
  };

  return (
    <div className="min-h-[100dvh] bg-[#FFF8F2]">
      <AppHeader
        right={
          canEditProject ? (
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#c2410c] px-3 py-2 rounded-xl transition"
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          ) : null
        }
      />

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-2">
            <HealthBadge status={project.health_status} />
            <ApprovalBadge status={project.approval_status} />
            <ProjectStatusBadge status={project.status} />
            {project.category && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">{project.category}</span>
            )}
          </div>
          <h2 className="mt-3 text-xl font-bold text-stone-800 leading-snug">{project.name}</h2>
          <div className="mt-3 space-y-2 text-sm text-stone-600">
            <div className="flex items-center gap-2"><User2 className="w-4 h-4 text-stone-400" /> Lead: <span className="font-semibold text-stone-800">{leadName}</span></div>
            {sponsorName && (
              <div className="flex items-center gap-2"><User2 className="w-4 h-4 text-stone-400" /> Sponsor: <span className="font-semibold text-stone-800">{sponsorName}</span></div>
            )}
            {approverName && (
              <div className="flex items-center gap-2"><User2 className="w-4 h-4 text-stone-400" /> Approver: <span className="font-semibold text-stone-800">{approverName}</span></div>
            )}
            {project.value_at_stake && (
              <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-stone-400" /> {project.value_at_stake}</div>
            )}
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-stone-400" /> {fmtDate(project.start_date)} → {fmtDate(project.target_date)}</div>
          </div>

          {canApprove && project.approval_status === 'Pending' && (
            <div className="mt-4 flex gap-2">
              <button onClick={handleApprove} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-xl transition">
                <CheckCircle2 className="w-4 h-4" /> Approve
              </button>
              <button onClick={handleReject} className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition">
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          )}

          <div className="mt-4">
            <PetalStrip functions={project.functions_involved} milestones={milestones} />
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
          <h3 className="font-semibold text-stone-800 mb-3">Phases</h3>
          <PhaseRoadmap phases={project.phase_names} currentPhase={project.current_phase} />
        </section>

        {/* ALL open bottlenecks, not just the oldest */}
        {openBottlenecks.length > 0 && (
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-600 px-1">
              <AlertOctagon className="w-4 h-4 text-red-500" />
              Open bottlenecks ({openBottlenecks.length})
            </h3>
            {openBottlenecks.map((b) => (
              <BottleneckCard
                key={b.id}
                bottleneck={b}
                project={project}
                currentUser={currentUser}
                onPosted={refreshBottlenecks}
                onCleared={handleBottleneckCleared}
                onUpdated={refreshBottlenecks}
              />
            ))}
          </section>
        )}

        {clearedBottlenecks.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-stone-600 px-1">
              Cleared bottlenecks ({clearedBottlenecks.length})
            </h3>
            {clearedBottlenecks.map((b) => (
              <BottleneckCard
                key={b.id}
                bottleneck={b}
                project={project}
                currentUser={currentUser}
                onPosted={refreshBottlenecks}
                onCleared={handleBottleneckCleared}
                onUpdated={refreshBottlenecks}
              />
            ))}
          </section>
        )}

        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
          <MilestoneList
            milestones={milestones}
            users={users}
            canEdit={canEditMilestones}
            onStatusChange={handleStatusChange}
            onAdd={handleAddMilestone}
            onUpdate={handleUpdateMilestone}
            onDelete={handleDeleteMilestone}
          />
          {!canEditMilestones && (
            <p className="mt-3 text-[11px] text-stone-400">Read-only — only the project lead, sponsor, managers and directors can edit milestones.</p>
          )}
        </section>

        {project.status === 'Done' && (
          <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
            <h3 className="font-semibold text-stone-800 mb-2">Completion review</h3>
            {project.review_status === 'Reviewed' ? (
              <div className="space-y-2 text-sm text-stone-600">
                {project.realized_value && (
                  <div><span className="text-stone-400">Realized value:</span> <span className="font-semibold text-stone-800">{project.realized_value}</span></div>
                )}
                {project.review_notes && <p className="whitespace-pre-wrap">{project.review_notes}</p>}
                {reviewerName && <p className="text-xs text-stone-400">Reviewed by {reviewerName} on {fmtDate(project.reviewed_date)}</p>}
              </div>
            ) : (
              <div>
                <p className="text-sm text-stone-600 mb-3">A review is required to assess the impact, benefit and gain before this project can be closed.</p>
                {canReview ? (
                  <button onClick={() => setReviewOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#c2410c] px-3 py-2 rounded-xl transition">
                    <ClipboardCheck className="w-4 h-4" /> Complete review
                  </button>
                ) : (
                  <p className="text-xs text-stone-400">Only the lead, sponsor or approver can complete the review.</p>
                )}
              </div>
            )}
          </section>
        )}

        <FlagBottleneck onSubmit={handleFlagBottleneck} />

        {canEditProject && (
          <ProjectFormDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            project={project}
            users={users}
            onSubmit={handleUpdateProject}
          />
        )}

        {canReview && project.status === 'Done' && project.review_status !== 'Reviewed' && (
          <ProjectReviewDialog
            open={reviewOpen}
            onOpenChange={setReviewOpen}
            onSubmit={handleCompleteReview}
          />
        )}

        {/* Floating project discussion button + panel */}
        <ProjectChat
          project={project}
          currentUser={currentUser}
          users={users}
          milestones={milestones}
        />
      </main>
    </div>
  );
}