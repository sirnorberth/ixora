import React from 'react';
import { AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import HealthBadge from './HealthBadge';
import ApprovalBadge from './ApprovalBadge';
import { milestoneProgress } from './MilestoneList';
import { fmtDate, daysSince } from '@/lib/dateUtils';

export default function ProjectCard({ project, milestones, bottlenecks }) {
  // Shared with the project detail page so both bars always agree.
  // Done = 100%, In progress = 50%, Delayed = 25%, Planned/Blocked = 0%.
  const { pct: percent, done, total } = milestoneProgress(milestones || []);

  const open = (bottlenecks || []).filter((b) => b.status === 'Open');
  const oldestAge = open.length ? Math.max(...open.map((b) => daysSince(b.date_flagged))) : 0;

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 hover:shadow-md hover:border-orange-200 transition h-full">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <HealthBadge status={project.health_status} />
          {project.approval_status && project.approval_status !== 'Approved' && (
            <ApprovalBadge status={project.approval_status} />
          )}
        </div>
        {open.length ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
            <AlertTriangle className="w-3 h-3" /> {open.length} blocker{open.length > 1 ? 's' : ''} · {oldestAge}d
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> No open blockers
          </span>
        )}
      </div>

      <h2 className="mt-3 text-lg font-semibold text-stone-800 leading-snug">{project.name}</h2>

      <div className="mt-2 flex flex-wrap gap-1">
        {(project.functions_involved || []).map((f) => (
          <span key={f} className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">{f}</span>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-stone-500">
        <Calendar className="w-3.5 h-3.5" />
        <span>Target {fmtDate(project.target_date)}</span>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-xs text-stone-500 mb-1">
          <span>Progress{total > 0 ? ` · ${done}/${total} done` : ''}</span>
          <span className="font-semibold text-stone-700">{percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
          <div className="h-full bg-[#EA580C] rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
}