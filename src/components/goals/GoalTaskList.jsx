// GoalTaskList.jsx — user-created tasks under a goal.
// The circle IS the control: tap to complete, tap again to undo.
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Circle, Plus, Trash2, Loader2, X, Check } from 'lucide-react';

export default function GoalTaskList({ goal, tasks, onChange, readOnly = false }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const add = async () => {
    const title = draft.trim();
    if (!title || saving) return;
    setSaving(true);
    try {
      const created = await base44.entities.GoalTask.create({
        goal: goal.id,
        title,
        done: false,
        position: tasks.length,
      });
      onChange([...tasks, created]);
      setDraft('');
      setAdding(false);
    } catch (e) {
      console.error('Could not add task', e);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (task) => {
    if (readOnly || busyId) return;
    setBusyId(task.id);
    const next = !task.done;
    // Optimistic — the checkbox should feel instant
    onChange(tasks.map((t) => (t.id === task.id ? { ...t, done: next } : t)));
    try {
      await base44.entities.GoalTask.update(task.id, { done: next });
    } catch (e) {
      console.error('Could not update task', e);
      onChange(tasks.map((t) => (t.id === task.id ? { ...t, done: task.done } : t)));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (task) => {
    if (readOnly) return;
    setBusyId(task.id);
    try {
      await base44.entities.GoalTask.delete(task.id);
      onChange(tasks.filter((t) => t.id !== task.id));
    } catch (e) {
      console.error('Could not delete task', e);
    } finally {
      setBusyId(null);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setAdding(false);
      setDraft('');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-stone-700">Tasks</h4>
        {!readOnly && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#EA580C] hover:bg-orange-50 px-2 py-1 rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add task
          </button>
        )}
      </div>

      {tasks.length === 0 && !adding ? (
        <p className="text-xs text-stone-400 py-2">
          No tasks yet. Break this goal into steps — your progress is measured by them.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-2.5 group">
              <button
                onClick={() => toggle(t)}
                disabled={readOnly || busyId === t.id}
                aria-label={t.done ? 'Mark as not done' : 'Mark as done'}
                className="shrink-0 disabled:opacity-50"
              >
                {busyId === t.id ? (
                  <Loader2 className="w-5 h-5 text-[#EA580C] animate-spin" />
                ) : t.done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 hover:text-emerald-600 transition" />
                ) : (
                  <Circle className="w-5 h-5 text-stone-300 hover:text-[#EA580C] transition" />
                )}
              </button>
              <span
                onClick={() => toggle(t)}
                className={`text-sm flex-1 cursor-pointer select-none ${
                  t.done ? 'text-stone-400 line-through' : 'text-stone-700'
                }`}
              >
                {t.title}
              </span>
              {!readOnly && (
                <button
                  onClick={() => remove(t)}
                  aria-label="Delete task"
                  className="shrink-0 p-1 rounded text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <div className="mt-2 flex items-center gap-2">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="What needs doing?"
            className="flex-1 h-9 rounded-lg border border-stone-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-[#EA580C]"
          />
          <button
            onClick={add}
            disabled={!draft.trim() || saving}
            className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#EA580C] text-white hover:bg-[#c2410c] transition disabled:opacity-40"
            aria-label="Save task"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { setAdding(false); setDraft(''); }}
            className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg text-stone-400 hover:text-stone-600"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}