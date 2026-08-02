import React, { useState, useEffect } from 'react';
import { Pencil, Archive, ArchiveRestore, Trash2, Target, Calendar, Eye } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import GoalProgressTracker from './GoalProgressTracker';
import GoalTaskList from './GoalTaskList';
import { fmtDate } from '@/lib/dateUtils';

export default function GoalCard({
  goal,
  applications,
  challenges,
  mentorMatches,
  currentUser,
  onEdit,
  onArchive,
  onDelete,
  onToggleVisibility,
}) {
  const archived = !!goal.archived;
  const [tasks, setTasks] = useState([]);

  // Each card owns its own task list, so nothing else needs to know about them
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await base44.entities.GoalTask.filter({ goal: goal.id }, 'position', 100);
        if (alive) setTasks(rows);
      } catch (e) {
        console.error('Could not load goal tasks', e);
      }
    })();
    return () => { alive = false; };
  }, [goal.id]);

  return (
    <div className={`bg-white rounded-2xl border border-stone-100 shadow-sm p-4 ${archived ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Target className="w-4 h-4 text-[#EA580C] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <h3 className="font-semibold text-stone-800 leading-snug break-words">{goal.goal_text}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-stone-500">
              {goal.goal_type && (
                <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[#EA580C] font-medium">{goal.goal_type}</span>
              )}
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {fmtDate(goal.target_date)}
              </span>
              {archived && <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-600">Archived</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onEdit} title="Edit" className="p-1.5 rounded-lg text-stone-500 hover:bg-orange-50 hover:text-[#EA580C]">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={onArchive} title={archived ? 'Unarchive' : 'Archive'} className="p-1.5 rounded-lg text-stone-500 hover:bg-orange-50 hover:text-[#EA580C]">
            {archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          </button>
          <button onClick={onDelete} title="Delete" className="p-1.5 rounded-lg text-stone-500 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {goal.matching_skill_tags?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {goal.matching_skill_tags.map((t) => (
            <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">{t}</span>
          ))}
        </div>
      )}

      <div className="mt-4">
        <GoalProgressTracker
          goal={goal}
          tasks={tasks}
          applications={applications}
          challenges={challenges}
          mentorMatches={mentorMatches}
          currentUser={currentUser}
        />
      </div>

      <div className="mt-4 pt-3 border-t border-stone-100">
        <GoalTaskList
          goal={goal}
          tasks={tasks}
          onChange={setTasks}
          readOnly={archived}
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-3 pt-3 border-t border-stone-100">
        <div className="flex items-start gap-2">
          <Eye className="w-4 h-4 text-stone-400 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-stone-800">Visible to my mentor &amp; manager</div>
            <p className="text-xs text-stone-500">Your goal belongs to you — sharing it is your choice.</p>
          </div>
        </div>
        <Switch checked={!!goal.visible_to_manager_and_mentor} onCheckedChange={onToggleVisibility} />
      </div>
    </div>
  );
}