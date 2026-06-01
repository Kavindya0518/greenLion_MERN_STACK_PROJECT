import React from 'react';

export const Spinner = ({ size = 'base', className = '' }) => {
  const sizeClass = size === 'sm' ? 'spinner-sm' : 'spinner';
  
  return <div className={`${sizeClass} ${className}`} />;
};

export const LoadingOverlay = ({ message = 'Loading...' }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      gap: '1rem'
    }}>
      <Spinner />
      <p style={{ color: 'white', fontSize: '1rem', fontWeight: 600 }}>
        {message}
      </p>
    </div>
  );
};

export const LoadingSkeleton = ({ width = '100%', height = '20px', className = '' }) => {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{ width, height }}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="card" style={{ padding: 'var(--space-6)' }}>
      <LoadingSkeleton height="150px" className="mb-4" />
      <LoadingSkeleton width="80%" height="24px" className="mb-4" />
      <LoadingSkeleton width="100%" height="16px" className="mb-2" />
      <LoadingSkeleton width="100%" height="16px" className="mb-2" />
      <LoadingSkeleton width="60%" height="16px" />
    </div>
  );
};

export default Spinner;

