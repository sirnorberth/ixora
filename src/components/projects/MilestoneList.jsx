import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import MilestoneItem from './MilestoneItem';
import MilestoneFormDialog from './MilestoneFormDialog';

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