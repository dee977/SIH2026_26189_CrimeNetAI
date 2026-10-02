import React from 'react';
import { useNavigate } from 'react-router-dom';

export const NotFoundView: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-[var(--text-primary)]">
      <h1 className="text-6xl font-bold text-[var(--danger-color)] mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-[var(--text-secondary)] mb-8 max-w-md text-center">
        The page you are looking for does not exist, has been removed, or is temporarily unavailable.
      </p>
      <button 
        onClick={() => navigate('/dashboard')}
        className="px-6 py-2 bg-[var(--primary-color)] text-[var(--text-primary)] rounded hover:bg-opacity-90 transition-colors"
      >
        Return to Dashboard
      </button>
    </div>
  );
};
