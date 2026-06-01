export const inventoryHeaderStyles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    background: '#e4f7e8',
    borderBottom: '4px solid #94e798',
    padding: '20px 24px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  title: {
    margin: 0,
    color: '#1a4d24',
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '4px',
    letterSpacing: '-0.3px'
  },
  subtitle: {
    color: '#2d6b3a',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: 500
  },
  primaryButton: {
    background: '#3D8D45',
    color: '#fff',
    border: '1px solid #2e7d32',
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    fontWeight: 500,
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    '&:hover': {
      background: '#2e7d32'
    }
  },
  secondaryButton: {
    background: '#ffffff',
    color: '#1a4d24',
    border: '1px solid #e2e8f0',
    padding: '10px 16px',
    borderRadius: '6px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    fontSize: '14px',
    '&:hover': {
      background: '#f8fafc'
    }
  }
};

export const InventoryHeader = ({ title, subtitle, actions = [] }) => {
  return (
    <div style={inventoryHeaderStyles.header}>
      <div>
        <h1 style={inventoryHeaderStyles.title}>{title}</h1>
        {subtitle && (
          <div style={inventoryHeaderStyles.subtitle}>
            <span>📊</span> {subtitle}
          </div>
        )}
      </div>
      {actions.length > 0 && (
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              style={action.primary ? inventoryHeaderStyles.primaryButton : inventoryHeaderStyles.secondaryButton}
            >
              {action.icon && <span>{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
