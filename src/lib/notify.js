// NOTIFY.JS

import { base44 } from '@/api/base44Client';

function nameOf(u) {
  return u?.full_name || u?.email || 'Someone';
}

async function createMany(notifs) {
  if (!notifs.length) return;
  try {
    await base44.entities.Notification.bulkCreate(notifs);
  } catch (e) {
    console.error('notify createMany failed', e);
  }
}

async function getUsers() {
  try {
    return await base44.entities.User.list();
  } catch (e) {
    console.error(e);
    return [];
  }
}

// Remove duplicates and (optionally) the person who triggered the action
function uniqueTargets(users, excludeId) {
  const map = new Map();
  users.forEach((u) => {
    if (u && u.id && u.id !== excludeId) map.set(u.id, u);
  });
  return [...map.values()];
}

// Projects ---------------------------------------------------------------

export async function notifyMilestoneAdded(milestone, project, excludeUserId = null) {
  if (!milestone?.owning_function) return;
  const users = await getUsers();
  const targets = uniqueTargets(
    users.filter((u) => u.department === milestone.owning_function || u.id === milestone.owner),
    excludeUserId
  );
  const text = `New milestone for your function: "${milestone.title}"${project?.name ? ` on ${project.name}` : ''}.`;
  await createMany(targets.map((u) => ({ user: u.id, category: 'task', text, link: project ? `/projects/${project.id}` : '/projects' })));
}

export async function notifyMilestoneStatus(milestone, project, status, excludeUserId = null) {
  if (!milestone?.owning_function) return;
  const users = await getUsers();
  const targets = uniqueTargets(
    users.filter(
      (u) =>
        u.department === milestone.owning_function ||
        u.id === milestone.owner ||
        u.id === project?.project_lead ||
        u.id === project?.sponsor
    ),
    excludeUserId
  );
  const text = `Milestone "${milestone.title}" is now ${status}${project?.name ? ` on ${project.name}` : ''}.`;
  await createMany(
    targets.map((u) => ({ user: u.id, category: status === 'Blocked' ? 'task' : 'update', text, link: project ? `/projects/${project.id}` : '/projects' }))
  );
}

// Notifies EVERY project participant: lead, sponsor, approver, all milestone
// owners, everyone in an involved function, and the function being waited on.
export async function notifyBottleneckFlagged(bottleneck, project, milestones = [], excludeUserId = null) {
  const users = await getUsers();
  const fns = project?.functions_involved || [];
  const ownerIds = new Set((milestones || []).map((m) => m.owner).filter(Boolean));
  const targets = uniqueTargets(
    users.filter(
      (u) =>
        u.id === project?.project_lead ||
        u.id === project?.sponsor ||
        u.id === project?.approver ||
        ownerIds.has(u.id) ||
        fns.includes(u.department) ||
        u.department === bottleneck?.waiting_on
    ),
    excludeUserId
  );
  const text = `Bottleneck flagged on ${project?.name || 'a project'}: "${bottleneck?.title}"${bottleneck?.waiting_on ? ` — waiting on ${bottleneck.waiting_on}` : ''}.`;
  await createMany(targets.map((u) => ({ user: u.id, category: 'task', text, link: project ? `/projects/${project.id}` : '/projects' })));
}

export async function notifyBottleneckCleared(bottleneck, project, milestones = [], excludeUserId = null) {
  const users = await getUsers();
  const fns = project?.functions_involved || [];
  const ownerIds = new Set((milestones || []).map((m) => m.owner).filter(Boolean));
  const targets = uniqueTargets(
    users.filter(
      (u) =>
        u.id === project?.project_lead ||
        u.id === project?.sponsor ||
        u.id === project?.approver ||
        ownerIds.has(u.id) ||
        fns.includes(u.department)
    ),
    excludeUserId
  );
  const text = `Bottleneck cleared on ${project?.name || 'a project'}: "${bottleneck?.title}".`;
  await createMany(targets.map((u) => ({ user: u.id, category: 'update', text, link: project ? `/projects/${project.id}` : '/projects' })));
}

export async function notifyProjectDone(project, excludeUserId = null) {
  const users = await getUsers();
  const targets = uniqueTargets(
    users.filter((u) => u.id === project?.sponsor || u.id === project?.approver),
    excludeUserId
  );
  const text = `"${project?.name}" was marked Done — your impact review is needed.`;
  await createMany(targets.map((u) => ({ user: u.id, category: 'task', text, link: project ? `/projects/${project.id}` : '/projects' })));
}

// New chat message — tell every project participant except the sender
export async function notifyProjectMessage(message, project, milestones = [], sender = null) {
  const users = await getUsers();
  const fns = project?.functions_involved || [];
  const ownerIds = new Set((milestones || []).map((m) => m.owner).filter(Boolean));
  const targets = uniqueTargets(
    users.filter(
      (u) =>
        u.id === project?.project_lead ||
        u.id === project?.sponsor ||
        u.id === project?.approver ||
        ownerIds.has(u.id) ||
        fns.includes(u.department)
    ),
    sender?.id
  );
  const full = message?.text || '';
  const snippet = full.length > 80 ? `${full.slice(0, 80)}…` : full;
  const text = `${nameOf(sender)} posted in ${project?.name || 'a project'}: "${snippet}"`;
  await createMany(
    targets.map((u) => ({ user: u.id, category: 'update', text, link: project ? `/projects/${project.id}` : '/projects' }))
  );
}

// Challenges -------------------------------------------------------------

export async function notifyChallengeApplication(application, challenge, applicant, sponsorUser) {
  if (!sponsorUser) return;
  const text = `${nameOf(applicant)} applied to your challenge "${challenge?.title}".`;
  await createMany([{ user: sponsorUser.id, category: 'task', text, link: challenge ? `/challenges/${challenge.id}` : '/challenges' }]);
}

export async function notifyApplicationAccepted(application, challenge) {
  const users = await getUsers();
  const applicant = users.find((u) => u.id === application?.user);
  if (!applicant) return;
  const text = `You were accepted onto "${challenge?.title}".`;
  await createMany([{ user: applicant.id, category: 'task', text, link: challenge ? `/challenges/${challenge.id}` : '/challenges' }]);
}

// Mentorship -------------------------------------------------------------

export async function notifyMentorRequest(match, offer, mentee, mentor) {
  if (!mentor) return;
  const text = `${nameOf(mentee)} requested mentorship with you.`;
  await createMany([{ user: mentor.id, category: 'task', text, link: '/mentors' }]);
}

export async function notifyMentorInvite(match, offer, mentor, mentee) {
  if (!mentee) return;
  const text = `${nameOf(mentor)} invited you to mentor with them.`;
  await createMany([{ user: mentee.id, category: 'task', text, link: '/mentors' }]);
}

export async function notifyMatchResolved(match, offer) {
  const users = await getUsers();
  const accepted = match.status === 'Active';
  if (match.initiated_by === 'Mentee requested') {
    const mentee = users.find((u) => u.id === match.mentee);
    if (!mentee) return;
    const text = accepted ? 'Your mentorship request was accepted.' : 'Your mentorship request was declined.';
    await createMany([{ user: mentee.id, category: accepted ? 'task' : 'update', text, link: '/mentors' }]);
  } else {
    const mentor = users.find((u) => u.id === offer?.mentor);
    if (!mentor) return;
    const text = accepted ? 'Your mentorship invite was accepted.' : 'Your mentorship invite was declined.';
    await createMany([{ user: mentor.id, category: accepted ? 'task' : 'update', text, link: '/mentors' }]);
  }
}

// Goals ------------------------------------------------------------------

export async function notifyChallengeForGoals(challenge) {
  try {
    const goals = await base44.entities.Goal.list('-created_date', 500);
    const tags = new Set(challenge?.skill_tags || []);
    if (!tags.size) return;
    const userSet = new Set();
    goals.filter((g) => !g.archived).forEach((g) => {
      if ((g.matching_skill_tags || []).some((t) => tags.has(t))) userSet.add(g.user);
    });
    if (!userSet.size) return;
    const text = `New challenge "${challenge.title}" matches your goal.`;
    await createMany([...userSet].map((uid) => ({ user: uid, category: 'update', text, link: `/challenges/${challenge.id}` })));
  } catch (e) {
    console.error(e);
  }
}

export async function notifyMentorOfferForGoals(offer, mentorUser) {
  try {
    const goals = await base44.entities.Goal.list('-created_date', 500);
    const tags = new Set(offer?.skill_tags || []);
    if (!tags.size) return;
    const userSet = new Set();
    goals.filter((g) => !g.archived).forEach((g) => {
      if ((g.matching_skill_tags || []).some((t) => tags.has(t))) userSet.add(g.user);
    });
    userSet.delete(mentorUser?.id);
    if (!userSet.size) return;
    const text = `New mentor offer from ${nameOf(mentorUser)} matches your goal.`;
    await createMany([...userSet].map((uid) => ({ user: uid, category: 'update', text, link: '/mentors' })));
  } catch (e) {
    console.error(e);
  }
}