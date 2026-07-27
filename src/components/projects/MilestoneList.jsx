// MilestoneList.jsx
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import MilestoneItem from './MilestoneItem';
import MilestoneFormDialog from './MilestoneFormDialog';

// Each milestone contributes a share of completion:
// Done = 100%, In progress = 50%, Delayed = 25%, Planned/Blocked = 0%.
const STATUS_WEIGHT = {
  Done: 1,
  'In progress': 0.5,
  Delayed: 0.25,
  Planned: 0,
  Blocked: 0,
};

export function milestoneProgress(milestones = []) {
  if (!milestones.length) return { pct: 0, done: 0, total: 0 };
  const score = milestones.reduce((s, m) => s + (STATUS_WEIGHT[m.status] ?? 0), 0);
  return {
    pct: Math.round((score / milestones.length) * 100),
    done: milestones.filter((m) => m.status === 'Done').length,
    total: milestones.length,
  };
}

export default function MilestoneList({ milestones, users, canEdit, onStatusChange, onAdd, onUpdate, onDelete }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (m) => { setEditing(m); setDialogOpen(true); };

  const handleSubmit = (values) => {
    if (editing) onUpdate(editing.id, values);
    else onAdd(values);
    setDialogOpen(false);
    setEditing(null);
  };

  const handleDelete = () => {
    if (editing) onDelete(editing.id);
    setDialogOpen(false);
    setEditing(null);
  };

  const userMap = {};
  (users || []).forEach((u) => { userMap[u.id] = u.full_name || u.email; });

  // Recomputed on every render, so it moves the moment a status changes
  const { pct, done, total } = milestoneProgress(milestones);
  const blocked = milestones.filter((m) => m.status === 'Blocked').length;
  const delayed = milestones.filter((m) => m.status === 'Delayed').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-stone-800">Milestones</h3>
        {canEdit && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#EA580C] hover:bg-orange-50 px-2.5 py-1.5 rounded-lg transition"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        )}
      </div>

      {total > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-stone-500">
              {done} of {total} done
              {delayed > 0 && <span className="text-amber-600"> · {delayed} delayed</span>}
              {blocked > 0 && <span className="text-red-600"> · {blocked} blocked</span>}
            </span>
            <span className="text-sm font-bold text-[#EA580C]">{pct}%</span>
          </div>
          <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#EA580C] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {milestones.length === 0 ? (
        <p className="text-sm text-stone-400 py-4">No milestones yet.</p>
      ) : (
        <div>
          {milestones.map((m) => (
            <MilestoneItem
              key={m.id}
              milestone={m}
              canEdit={canEdit}
              onStatusChange={onStatusChange}
              onEdit={openEdit}
              ownerName={m.owner ? userMap[m.owner] : null}
            />
          ))}
        </div>
      )}

      {canEdit && (
        <MilestoneFormDialog
          open={dialogOpen}
          onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
          milestone={editing}
          users={users || []}
          onSubmit={handleSubmit}
          onDelete={editing ? handleDelete : undefined}
        />
      )}
    </div>
  );
}