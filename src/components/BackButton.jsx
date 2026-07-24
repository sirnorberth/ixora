import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ className }) {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };
  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Back"
      className={`inline-flex items-center justify-center w-9 h-9 -ml-1 rounded-xl text-stone-600 hover:bg-orange-50 hover:text-[#EA580C] transition ${className || ''}`}
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );
}