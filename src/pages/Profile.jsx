import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Eye, EyeOff, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import SetGoalCard from '@/components/goals/SetGoalCard';
import GoalCard from '@/components/goals/GoalCard';
import GoalFormDialog from '@/components/goals/GoalFormDialog';
import AppHeader from '@/components/AppHeader';
import AvatarUpload from '@/components/AvatarUpload';

export default function Profile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [applications, setApplications] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [mentorMatches, setMentorMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { logout } = useAuth();

  const refresh = async () => {
    const [me, gs, apps, chs, mm] = await Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.Goal.list('-created_date', 100),
      base44.entities.Application.list('-created_date', 500),
      base44.entities.Challenge.list('-created_date', 200),
      base44.entities.MentorMatch.list('-created_date', 200).catch(() => []),
    ]);
    setCurrentUser(me);
    setGoals(gs);
    setApplications(apps);
    setChallenges(chs);
    setMentorMatches(mm);
  };

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const myGoals = goals.filter((g) => g.user === currentUser?.id);
  const activeGoals = myGoals.filter((g) => !g.archived);
  const archivedGoals = myGoals.filter((g) => g.archived);

  const handleCreate = async (values) => {
    const created = await base44.entities.Goal.create(values);
    setGoals((prev) => [created, ...prev]);
  };
  const handleEdit = async (values) => {
    await base44.entities.Goal.update(editing.id, values);
    const updated = await base44.entities.Goal.get(editing.id);
    setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  };
  const handleSubmit = (values) => (editing ? handleEdit(values) : handleCreate(values));

  const handleArchive = async (goal) => {
    await base44.entities.Goal.update(goal.id, { archived: !goal.archived });
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, archived: !g.archived } : g)));
  };
  const handleDelete = async (goal) => {
    if (!window.confirm(`Delete "${goal.goal_text}"? This can't be undone.`)) return;
    await base44.entities.Goal.delete(goal.id);
    setGoals((prev) => prev.filter((g) => g.id !== goal.id));
  };
  const handleToggleVisibility = async (goal, val) => {
    await base44.entities.Goal.update(goal.id, { visible_to_manager_and_mentor: val });
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, visible_to_manager_and_mentor: val } : g)));
  };
  const handleUpdateLessons = async (goal, val) => {
    await base44.entities.Goal.update(goal.id, { lessons_done: val });
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, lessons_done: val } : g)));
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (goal) => {
    setEditing(goal);
    setFormOpen(true);
  };

  const goalProps = (g) => ({
    goal: g,
    applications,
    challenges,
    mentorMatches,
    currentUser,
    onEdit: () => openEdit(g),
    onArchive: () => handleArchive(g),
    onDelete: () => handleDelete(g),
    onToggleVisibility: (val) => handleToggleVisibility(g, val),
  });

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#FFF8F2] flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-orange-200 border-t-[#EA580C] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FFF8F2]">
      <AppHeader
        right={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#c2410c] px-3 py-2 rounded-xl transition"
          >
            <Plus className="w-4 h-4" /> New goal
          </button>
        }
      />

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-5">
        <h2 className="text-xl font-bold text-stone-800 px-1">Profile</h2>
        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
          <div className="flex items-start gap-4">
            <AvatarUpload
              currentUser={currentUser}
              onUpdated={(url) => setCurrentUser((u) => (u ? { ...u, avatar_url: url } : u))}
            />
            <div className="min-w-0 pt-1">
              <div className="font-semibold text-stone-800 truncate">
                {currentUser?.full_name || currentUser?.email || '—'}
              </div>
              {currentUser?.email && currentUser?.full_name && (
                <div className="text-xs text-stone-500 truncate">{currentUser.email}</div>
              )}
              {currentUser?.role && (
                <span className="mt-1 inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                  {currentUser.role}
                </span>
              )}
            </div>
          </div>

          {(currentUser?.department || currentUser?.job_title || currentUser?.years_of_experience != null) && (
            <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-2 gap-3 text-sm">
              {currentUser?.job_title && (
                <div>
                  <div className="text-xs text-stone-400 font-medium">Job Title</div>
                  <div className="text-stone-700">{currentUser.job_title}</div>
                </div>
              )}
              {currentUser?.department && (
                <div>
                  <div className="text-xs text-stone-400 font-medium">Department</div>
                  <div className="text-stone-700">{currentUser.department}</div>
                </div>
              )}
              {currentUser?.years_of_experience != null && (
                <div>
                  <div className="text-xs text-stone-400 font-medium">Experience</div>
                  <div className="text-stone-700">
                    {currentUser.years_of_experience}{' '}
                    {Number(currentUser.years_of_experience) === 1 ? 'year' : 'years'}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {activeGoals.length === 0 ? (
          <SetGoalCard currentUser={currentUser} onComplete={refresh} />
        ) : (
          <div className="space-y-4">
            {activeGoals.map((g) => (
              <GoalCard key={g.id} {...goalProps(g)} />
            ))}
          </div>
        )}

        {archivedGoals.length > 0 && (
          <section className="space-y-3">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-stone-600 px-1 hover:text-[#EA580C]"
            >
              {showArchived ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showArchived ? 'Hide archived' : 'Show archived'} ({archivedGoals.length})
            </button>
            {showArchived && (
              <div className="space-y-4">
                {archivedGoals.map((g) => (
                  <GoalCard key={g.id} {...goalProps(g)} />
                ))}
              </div>
            )}
          </section>
        )}
        {/* Account */}
        <section className="pt-2 pb-2">
          {confirmLogout ? (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
              <p className="text-sm text-stone-700">Log out of Ixora on this device?</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => logout()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-3 py-2.5 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" /> Log out
                </button>
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="flex-1 text-sm font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 px-3 py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmLogout(true)}
              className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-stone-600 bg-white border border-stone-200 hover:border-red-200 hover:text-red-600 px-3 py-3 rounded-2xl transition"
            >
              <LogOut className="w-4 h-4" /> Log out
            </button>
          )}
          {currentUser?.email && (
            <p className="mt-2 text-center text-[11px] text-stone-400">
              Signed in as {currentUser.email}
            </p>
          )}
        </section>
      </main>

      <GoalFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        currentUser={currentUser}
        goal={editing}
        onSubmit={handleSubmit}
      />
    </div>
  );
}