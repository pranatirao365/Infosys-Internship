import React from 'react';

function DataQuality({ quality }) {
  if (!quality) {
    return (
      <div className="data-controls card">
        <div className="card-header">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Data Quality
        </div>
        <p style={{color: '#999', fontSize: '0.9rem'}}>Apply filters to see data quality metrics</p>
      </div>
    );
  }

  return (
    <div className="data-controls card">
      <div className="card-header">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Data Quality
      </div>

      <div className="quality-item">
        <div className="quality-label">
          <span>Completeness:</span>
          <span style={{fontWeight: 'bold', color: '#2e7d32'}}>{quality.completeness}%</span>
        </div>
        <div className="quality-bar">
          <div className="quality-fill" style={{width: `${quality.completeness}%`}}></div>
        </div>
      </div>

      <div className="quality-item">
        <div className="quality-label">
          <span>Validity:</span>
          <span style={{fontWeight: 'bold', color: '#2e7d32'}}>{quality.validity}%</span>
        </div>
        <div className="quality-bar">
          <div className="quality-fill" style={{width: `${quality.validity}%`}}></div>
        </div>
      </div>

      {quality.totalRecords && (
        <div style={{marginTop: '1rem', fontSize: '0.85rem', color: '#666'}}>
          <p><strong>Total Records:</strong> {quality.totalRecords.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

export default DataQuality;
