import React from 'react';

function AlertPanel({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <p>No alerts at this time</p>
      </div>
    );
  }

  const getAlertStyle = (type) => {
    const styles = {
      error: {
        background: '#fee2e2',
        borderColor: '#ef4444',
        iconBg: '#fecaca',
        textColor: '#7f1d1d'
      },
      warning: {
        background: '#fef3c7',
        borderColor: '#f59e0b',
        iconBg: '#fde68a',
        textColor: '#78350f'
      },
      success: {
        background: '#d1fae5',
        borderColor: '#10b981',
        iconBg: '#a7f3d0',
        textColor: '#064e3b'
      },
      info: {
        background: '#dbeafe',
        borderColor: '#3b82f6',
        iconBg: '#bfdbfe',
        textColor: '#1e3a8a'
      }
    };
    return styles[type] || styles.info;
  };

  return (
    <div style={{ 
      maxHeight: '300px', 
      overflowY: 'auto',
      paddingRight: '5px'
    }}>
      {alerts.map((alert, index) => {
        const style = getAlertStyle(alert.type);
        
        return (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              marginBottom: '10px',
              background: style.background,
              borderLeft: `4px solid ${style.borderColor}`,
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(4px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Icon */}
            <div style={{
              width: '36px',
              height: '36px',
              background: style.iconBg,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '1.2rem'
            }}>
              {alert.icon}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '0.95rem',
                fontWeight: '600',
                color: style.textColor,
                marginBottom: '4px'
              }}>
                {alert.message}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: style.textColor,
                opacity: 0.8
              }}>
                {alert.time}
              </div>
            </div>

            {/* Severity Badge */}
            {alert.severity && alert.severity !== 'info' && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '4px 8px',
                background: style.borderColor,
                color: 'white',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: '700',
                textTransform: 'uppercase'
              }}>
                {alert.severity}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default AlertPanel;
