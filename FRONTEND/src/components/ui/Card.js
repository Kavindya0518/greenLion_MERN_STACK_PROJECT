import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  elevated = false,
  hover = true,
  onClick,
  style = {}
}) => {
  const hoverClass = hover ? 'hover-lift' : '';
  const elevatedClass = elevated ? 'card-elevated' : '';
  
  return (
    <div
      className={`card ${elevatedClass} ${hoverClass} ${className}`}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`heading-3 ${className}`}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 pt-4 ${className}`} style={{ borderTop: '1px solid var(--color-gray-200)' }}>
    {children}
  </div>
);

export default Card;

