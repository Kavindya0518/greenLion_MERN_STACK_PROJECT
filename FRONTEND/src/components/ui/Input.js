import React from 'react';

const Input = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  error,
  className = '',
  disabled = false,
  icon,
  ...props
}) => {
  return (
    <div className={`flex-col gap-2 ${className}`} style={{ display: 'flex' }}>
      {label && (
        <label style={{ 
          fontSize: '0.875rem', 
          fontWeight: 600, 
          color: 'var(--color-gray-700)' 
        }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-gray-400)',
            pointerEvents: 'none'
          }}>
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="input"
          style={{
            paddingLeft: icon ? '40px' : '16px',
            borderColor: error ? 'var(--color-error)' : undefined
          }}
          {...props}
        />
      </div>
      {error && (
        <span style={{ 
          fontSize: '0.75rem', 
          color: 'var(--color-error)' 
        }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;

