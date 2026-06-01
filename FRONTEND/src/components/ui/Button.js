import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'base', 
  onClick, 
  disabled = false, 
  className = '',
  type = 'button',
  icon,
  fullWidth = false,
  loading = false
}) => {
  const baseClasses = 'btn';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
  };
  
  const sizeClasses = {
    sm: 'btn-sm',
    base: '',
    lg: 'btn-lg',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      style={{ width: fullWidth ? '100%' : 'auto' }}
    >
      {loading && (
        <div className="spinner-sm" />
      )}
      {!loading && icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;

