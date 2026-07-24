import React from 'react';
import { Star, Send, CheckCircle2, UserPlus } from 'lucide-react';
import { isIdealMentor, canRequestMentorship, firstNameOf } from '@/lib/mentorUtils';

export default function MentorOfferCard({ offer, mentorUser, currentUser, goalTags, match, onRequest, onInvite }) {
  const overlaps = (offer.skill_tags || []).some((t) => goalTags.has(t));
  const ideal = isIdealMentor(mentorUser);
  const isOwn = offer.mentor === currentUser?.id;
  const firstName = firstNameOf(mentorUser);
  const topics = (offer.topics || '').split(',').map((s) => s.trim()).filter(Boolean);
  const slots = offer.mentee_slots ?? 0;

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm p-4 ${overlaps ? 'border-orange-300' : 'border-stone-100'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-[#EA580C] font-bold shrink-0">
            {(mentorUser?.full_name || mentorUser?.email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-stone-800 truncate">{mentorUser?.full_name || mentorUser?.email || 'Mentor'}</div>
            {mentorUser?.job_title && <div className="text-xs text-stone-500 truncate">{mentorUser.job_title}</div>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
            {slots} slot{slots === 1 ? '' : 's'}
          </span>
          {ideal && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
              <Star className="w-3 h-3" /> Ideal mentor
            </span>
          )}
        </div>
      </div>

      {topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {topics.map((t) => (
            <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">{t}</span>
          ))}
        </div>
      )}
      {offer.skill_tags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {offer.skill_tags.map((t) => (
            <span
              key={t}
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${goalTags.has(t) ? 'bg-orange-50 text-[#EA580C]' : 'bg-blue-50 text-blue-700'}`}
            >
              {t}
            </span>
          ))}
        </div>
      )}
      {overlaps && (
        <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#EA580C] text-white">
          <Star className="w-3 h-3" /> For your goal
        </span>
      )}

      <div className="mt-4">
        {isOwn ? (
          <button
            onClick={onInvite}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#c2410c] px-3 py-2 rounded-xl transition"
          >
            <UserPlus className="w-4 h-4" /> Invite an employee
          </button>
        ) : match?.status === 'Pending' ? (
          <p className="text-sm font-medium text-stone-600 inline-flex items-center gap-1.5">
            <Send className="w-4 h-4 text-stone-400" /> Request sent — waiting for {firstName} to accept.
          </p>
        ) : match?.status === 'Active' ? (
          <p className="text-sm font-semibold text-emerald-700 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Mentorship active.
          </p>
        ) : !canRequestMentorship(currentUser) ? (
          <p className="text-xs text-stone-400">Directors don't request mentorship.</p>
        ) : (
          <button
            onClick={onRequest}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#c2410c] px-3 py-2 rounded-xl transition"
          >
            <Send className="w-4 h-4" /> Request mentorship
          </button>
        )}
      </div>
    </div>
  );
}