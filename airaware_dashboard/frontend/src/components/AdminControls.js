import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

function AdminControls() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [retrainStatus, setRetrainStatus] = useState('');
  const [selectedModel, setSelectedModel] = useState('prophet');
  const [isUploading, setIsUploading] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setUploadStatus('');
      } else {
        setUploadStatus('Please select a CSV file');
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Uploading...');

    try {
      const formData = new FormData();
      formData.append('dataset', selectedFile);

      const response = await axios.post(`${API_BASE_URL}/api/admin/upload-dataset`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadStatus(`✅ Success! Uploaded ${selectedFile.name} - ${response.data.recordsProcessed || 0} records processed`);
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`❌ Upload failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetrain = async () => {
    setIsRetraining(true);
    setRetrainStatus('Starting model retraining...');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/retrain-models`, {
        model: selectedModel
      });

      setRetrainStatus(`✅ Success! ${selectedModel.toUpperCase()} model retrained successfully. New RMSE: ${response.data.rmse?.toFixed(2) || 'N/A'}`);
      
    } catch (error) {
      console.error('Retrain error:', error);
      setRetrainStatus(`❌ Retraining failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsRetraining(false);
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: '2px solid #ff9800'
      }}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '28px', height: '28px', color: '#ff9800'}}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <div>
          <h2 style={{ margin: 0, color: '#ff9800', fontSize: '1.5rem' }}>Admin Controls</h2>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
            Upload new datasets and retrain forecasting models
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '25px'
      }}>
        {/* Upload Dataset Section */}
        <div style={{
          padding: '20px',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '2px solid #e5e7eb'
        }}>
          <h3 style={{
            margin: '0 0 15px 0',
            color: '#424242',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📤</span>
            Upload New Dataset
          </h3>

          <div style={{ marginBottom: '15px' }}>
            <label 
              htmlFor="file-upload"
              style={{
                display: 'block',
                padding: '40px 20px',
                background: 'white',
                border: '2px dashed #cbd5e1',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.background = '#f0f9ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.background = 'white';
              }}
            >
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📁</div>
              <div style={{ color: '#424242', fontWeight: '600', marginBottom: '5px' }}>
                {selectedFile ? selectedFile.name : 'Choose CSV file'}
              </div>
              <div style={{ color: '#666', fontSize: '0.85rem' }}>
                {selectedFile 
                  ? `Size: ${(selectedFile.size / 1024).toFixed(2)} KB`
                  : 'Click to browse or drag and drop'
                }
              </div>
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            style={{
              width: '100%',
              padding: '12px',
              background: selectedFile && !isUploading 
                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                : '#cbd5e1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: selectedFile && !isUploading ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isUploading ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              <>📤 Upload Dataset</>
            )}
          </button>

          {uploadStatus && (
            <div style={{
              marginTop: '12px',
              padding: '10px',
              background: uploadStatus.startsWith('✅') ? '#d1fae5' : uploadStatus.startsWith('❌') ? '#fee2e2' : '#dbeafe',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#424242'
            }}>
              {uploadStatus}
            </div>
          )}
        </div>

        {/* Retrain Models Section */}
        <div style={{
          padding: '20px',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '2px solid #e5e7eb'
        }}>
          <h3 style={{
            margin: '0 0 15px 0',
            color: '#424242',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🤖</span>
            Retrain ML Models
          </h3>

          <div style={{ marginBottom: '15px' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: '#424242',
              marginBottom: '8px'
            }}>
              Select Model Type
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '0.95rem',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="prophet">Prophet</option>
              <option value="arima">ARIMA</option>
              <option value="xgboost">XGBoost</option>
              <option value="all">All Models</option>
            </select>
          </div>

          <div style={{
            padding: '15px',
            background: 'white',
            borderRadius: '8px',
            marginBottom: '15px',
            fontSize: '0.85rem',
            color: '#666'
          }}>
            <div style={{ marginBottom: '8px', fontWeight: '600', color: '#424242' }}>
              Model Information:
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Prophet: Best for seasonal patterns</li>
              <li>ARIMA: Classical time series</li>
              <li>XGBoost: Machine learning approach</li>
            </ul>
          </div>

          <button
            onClick={handleRetrain}
            disabled={isRetraining}
            style={{
              width: '100%',
              padding: '12px',
              background: !isRetraining 
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : '#cbd5e1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: !isRetraining ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isRetraining ? (
              <>
                <span className="spinner"></span>
                Training...
              </>
            ) : (
              <>🚀 Start Retraining</>
            )}
          </button>

          {retrainStatus && (
            <div style={{
              marginTop: '12px',
              padding: '10px',
              background: retrainStatus.startsWith('✅') ? '#d1fae5' : retrainStatus.startsWith('❌') ? '#fee2e2' : '#fef3c7',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#424242'
            }}>
              {retrainStatus}
            </div>
          )}
        </div>
      </div>

      {/* Warning Notice */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#fffbeb',
        border: '2px solid #fbbf24',
        borderRadius: '8px',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start'
      }}>
        <span style={{ fontSize: '1.5rem' }}>⚠️</span>
        <div style={{ fontSize: '0.85rem', color: '#78350f' }}>
          <strong>Important:</strong> Retraining models can take several minutes depending on dataset size. 
          The dashboard will continue to use existing models until retraining completes successfully.
        </div>
      </div>
    </div>
  );
}

export default AdminControls;
