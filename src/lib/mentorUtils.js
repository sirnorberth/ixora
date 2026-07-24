// Helpers for mentor eligibility and display.

export function jobTitleRank(user) {
  const t = (user?.job_title || '').toLowerCase();
  if (t.includes('director')) return 'director';
  if (t.includes('manager')) return 'manager';
  return 'other';
}

export const isDirector = (u) => jobTitleRank(u) === 'director';
export const isManager = (u) => jobTitleRank(u) === 'manager';
export const isIdealMentor = (u) => {
  const r = jobTitleRank(u);
  return r === 'director' || r === 'manager';
};

// At least 5 years of work experience is required to be a mentor.
export const canBeMentor = (u) => (Number(u?.years_of_experience) || 0) >= 5;

// Directors cannot request mentorship; everyone else can.
export const canRequestMentorship = (u) => !isDirector(u);

export const firstNameOf = (u) => {
  const name = u?.full_name || u?.email || '';
  return name.split(' ')[0] || name || 'mentor';
};