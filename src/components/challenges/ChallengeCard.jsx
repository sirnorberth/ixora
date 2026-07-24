import React from 'react';
import { Link } from 'react-router-dom';
import { Archive } from 'lucide-react';
import { CHALLENGE_TYPE_STYLES } from '@/lib/constants';

export default function ChallengeCard({ challenge, applicantsCount = 0, matchesGoal = false }) {
  const ts = CHALLENGE_TYPE_STYLES[challenge.type] || { bg: 'bg-stone-100', text: 'text-stone-600' };
  return (
    <Link
      to={`/challenges/${challenge.id}`}
      className={`block bg-white rounded-2xl border border-stone-100 shadow-sm p-4 hover:shadow-md hover:border-orange-200 transition ${challenge.archived ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {challenge.type && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${ts.bg} ${ts.text}`}>{challenge.type}</span>
        )}
        {challenge.source === 'From project' && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">From project</span>
        )}
        {matchesGoal && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EA580C] text-white">For your goal</span>
        )}
        {challenge.archived && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 inline-flex items-center gap-1">
            <Archive className="w-3 h-3" /> Archived
          </span>
        )}
      </div>
      <h3 className="mt-2 font-semibold text-stone-800 leading-snug">{challenge.title}</h3>
      <div className="mt-2 grid grid-cols-2 gap-y-1 text-xs text-stone-500">
        <span>Sponsor: <span className="font-semibold text-stone-700">{challenge.sponsor_name || '—'}</span></span>
        <span>Duration: <span className="font-semibold text-stone-700">{challenge.duration_weeks ? `${challenge.duration_weeks} wk` : '—'}</span></span>
        <span>Open spots: <span className="font-semibold text-stone-700">{challenge.open_spots ?? '—'}</span></span>
        <span>Applicants: <span className="font-semibold text-stone-700">{applicantsCount}</span></span>
      </div>
    </Link>
  );
}