import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navigation() {
  const location = useLocation();

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)',
      padding: '0',
      borderRadius: '12px',
      marginBottom: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', gap: '0' }}>
        <Link
          to="/"
          style={{
            flex: 1,
            padding: '18px 32px',
            textDecoration: 'none',
            color: location.pathname === '/' ? '#fff' : '#2e7d32',
            background: location.pathname === '/' 
              ? 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)' 
              : 'transparent',
            fontWeight: '700',
            fontSize: '1.05rem',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            borderBottom: location.pathname === '/' ? '4px solid #1b5e20' : '4px solid transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
          onMouseOver={(e) => {
            if (location.pathname !== '/') {
              e.currentTarget.style.background = '#f1f8e9';
            }
          }}
          onMouseOut={(e) => {
            if (location.pathname !== '/') {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '24px', height: '24px'}}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Milestone 1: Data Explorer
        </Link>
        
        <Link
          to="/forecast"
          style={{
            flex: 1,
            padding: '18px 32px',
            textDecoration: 'none',
            color: location.pathname === '/forecast' ? '#fff' : '#2e7d32',
            background: location.pathname === '/forecast' 
              ? 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)' 
              : 'transparent',
            fontWeight: '700',
            fontSize: '1.05rem',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            borderBottom: location.pathname === '/forecast' ? '4px solid #1b5e20' : '4px solid transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
          onMouseOver={(e) => {
            if (location.pathname !== '/forecast') {
              e.currentTarget.style.background = '#f1f8e9';
            }
          }}
          onMouseOut={(e) => {
            if (location.pathname !== '/forecast') {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '24px', height: '24px'}}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Milestone 2: Forecast Engine
        </Link>

        <Link
          to="/monitor"
          style={{
            flex: 1,
            padding: '18px 32px',
            textDecoration: 'none',
            color: location.pathname === '/monitor' ? '#fff' : '#2e7d32',
            background: location.pathname === '/monitor' 
              ? 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)' 
              : 'transparent',
            fontWeight: '700',
            fontSize: '1.05rem',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            borderBottom: location.pathname === '/monitor' ? '4px solid #1b5e20' : '4px solid transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
          onMouseOver={(e) => {
            if (location.pathname !== '/monitor') {
              e.currentTarget.style.background = '#f1f8e9';
            }
          }}
          onMouseOut={(e) => {
            if (location.pathname !== '/monitor') {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '24px', height: '24px'}}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Milestone 3: Alert System
        </Link>

        <Link
          to="/interactive"
          style={{
            flex: 1,
            padding: '18px 32px',
            textDecoration: 'none',
            color: location.pathname === '/interactive' ? '#fff' : '#2e7d32',
            background: location.pathname === '/interactive' 
              ? 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)' 
              : 'transparent',
            fontWeight: '700',
            fontSize: '1.05rem',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            borderBottom: location.pathname === '/interactive' ? '4px solid #1b5e20' : '4px solid transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
          onMouseOver={(e) => {
            if (location.pathname !== '/interactive') {
              e.currentTarget.style.background = '#f1f8e9';
            }
          }}
          onMouseOut={(e) => {
            if (location.pathname !== '/interactive') {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '24px', height: '24px'}}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Milestone 4: Interactive Dashboard
        </Link>
      </div>
    </nav>
  );
}

export default Navigation;
