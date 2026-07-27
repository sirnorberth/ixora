// src/lib/progress.js
// Single source of truth for every progress bar in Ixora, so the projects
// list, the project page and any future view can never disagree.

// How much each milestone status contributes
export const STATUS_WEIGHT = {
  Done: 1,
  'In progress': 0.5,
  Delayed: 0.25,
  Planned: 0,
  Blocked: 0,
};

// Progress from milestones alone
export function milestoneProgress(milestones = []) {
  const list = milestones || [];
  if (!list.length) return { pct: 0, done: 0, total: 0 };
  const score = list.reduce((s, m) => s + (STATUS_WEIGHT[m.status] ?? 0), 0);
  return {
    pct: Math.round((score / list.length) * 100),
    done: list.filter((m) => m.status === 'Done').length,
    total: list.length,
  };
}

// Rough fallback when a project has no milestones yet
const STATUS_FALLBACK = {
  'Not Started': 0,
  Ongoing: 25,
  Delayed: 20,
  Suspended: 10,
  Done: 100,
};

/**
 * Progress for a whole project.
 * 1. A project marked Done always reads 100%.
 * 2. Otherwise use its milestones, if it has any.
 * 3. Otherwise use its position in the phase list.
 * 4. Otherwise fall back to its status.
 * `basis` tells the UI which rule applied, so it can label the bar honestly.
 */
export function projectProgress(project, milestones = []) {
  const list = milestones || [];
  const counts = {
    done: list.filter((m) => m.status === 'Done').length,
    total: list.length,
  };

  if (project?.status === 'Done') {
    return { pct: 100, ...counts, basis: 'status' };
  }

  if (list.length) {
    const { pct } = milestoneProgress(list);
    return { pct, ...counts, basis: 'milestones' };
  }

  const phases = project?.phase_names || [];
  if (phases.length && project?.current_phase) {
    const idx = phases.indexOf(project.current_phase);
    if (idx >= 0) {
      return {
        pct: Math.round(((idx + 1) / phases.length) * 100),
        ...counts,
        basis: 'phases',
      };
    }
  }

  return { pct: STATUS_FALLBACK[project?.status] ?? 0, ...counts, basis: 'status' };
}