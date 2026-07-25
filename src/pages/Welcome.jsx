import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      // Give Supabase a moment to process the token in the URL
      await new Promise((r) => setTimeout(r, 600));
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    return (
      <div className="min-h-[100dvh] bg-[#FFF8F2] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#EA580C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FFF8F2] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-stone-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-[#EA580C]" />
        </div>
        <h1 className="text-2xl font-bold text-stone-800">Email confirmed</h1>
        <p className="mt-2 text-stone-600">
          {user
            ? `Welcome to Ixora${user.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}. Your account is ready.`
            : 'Your account is confirmed. Log in to get started.'}
        </p>
        <button
          onClick={() => navigate(user ? '/' : '/login')}
          className="mt-6 w-full h-12 rounded-xl bg-[#EA580C] hover:bg-[#c2410c] text-white font-semibold transition"
        >
          {user ? 'Go to Ixora' : 'Log in'}
        </button>
      </div>
    </div>
  );
}