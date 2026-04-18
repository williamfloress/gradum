import React from 'react';

interface SemesterAlertProps {
  hasPendingPrevious: boolean;
}

export const SemesterAlert: React.FC<SemesterAlertProps> = ({ hasPendingPrevious }) => {
  if (!hasPendingPrevious) return null;

  return (
    <div className="gradum-success" style={{ 
      background: 'rgba(251, 191, 36, 0.12)', 
      color: '#fcd34d', 
      borderColor: 'rgba(251, 191, 36, 0.35)',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem'
    }}>
      <span style={{ fontSize: '1.25rem' }}>⚠️</span>
      <div>
        <strong>Materias pendientes</strong>
        <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>
          Tienes materias de semestres anteriores que aún no han sido aprobadas. 
        </p>
      </div>
    </div>
  );
};
