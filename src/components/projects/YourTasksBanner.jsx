// YourTasksBanner.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Mail, ChevronRight, AlertCircle } from 'lucide-react';

export default function YourTasksBanner({ myTasks, projects, onNotify, notifying }) {
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState('');

  const byProject = {};
  myTasks.forEach((m) => {
    byProject[m.project] = (byProject[m.project] || 0) + 1;
  });
  const projectEntries = Object.entries(byProject);
  const count = myTasks.length;

  const handleNotify = async () => {
    setFailed('');
    setDone(false);
    try {
      await onNotify();
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      // Tell the truth instead of claiming success
      setFailed(e?.message || 'Could not send the email. Please try again.');
      setTimeout(() => setFailed(''), 6000);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#EA580C] to-[#c2410c] rounded-2xl shadow-sm p-4 text-white">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          <h3 className="font-semibold">Your tasks</h3>
        </div>
        <span className="text-2xl font-bold leading-none">{count}</span>
      </div>
      <p className="mt-1 text-sm text-orange-50">
        {count
          ? `${count} open task${count > 1 ? 's' : ''} matching your function/role across ${projectEntries.length} project${projectEntries.length > 1 ? 's' : ''}.`
          : 'No open tasks match your function or role right now.'}
      </p>

      {projectEntries.length > 0 && (
        <div className="mt-3 space-y-1">
          {projectEntries.map(([pid, n]) => {
            const p = projects.find((x) => x.id === pid);
            return (
              <Link
                key={pid}
                to={`/projects/${pid}`}
                className="flex items-center justify-between bg-white/15 hover:bg-white/25 rounded-lg px-3 py-2 transition"
              >
                <span className="text-sm font-medium truncate">{p?.name || 'Project'}</span>
                <span className="flex items-center gap-1 text-xs text-orange-50 shrink-0">
                  {n} task{n > 1 ? 's' : ''}<ChevronRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-3">
        <button
          type="button"
          onClick={handleNotify}
          disabled={notifying}
          className="inline-flex items-center text-sm font-semibold bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl transition disabled:opacity-60"
        >
          <Mail className="w-4 h-4 mr-1.5" /> {notifying ? 'Sending…' : 'Email me my tasks'}
        </button>
      </div>
      {done && <p className="mt-2 text-xs text-orange-50">Summary sent to your inbox.</p>}
      {failed && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-white bg-red-900/30 rounded-lg px-2.5 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {failed}
        </p>
      )}
    </div>
  );
}