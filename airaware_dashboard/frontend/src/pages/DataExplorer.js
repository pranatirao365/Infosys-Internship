import React, { useState, useEffect } from 'react';
import DataControls from '../components/DataControls';
import TimeSeriesChart from '../components/TimeSeriesChart';
import StatisticalSummary from '../components/StatisticalSummary';
import PollutantCorrelations from '../components/PollutantCorrelations';
import DistributionAnalysis from '../components/DistributionAnalysis';
import DataQuality from '../components/DataQuality';
import axios from 'axios';
import './DataExplorer.css';

const API_BASE_URL = 'http://127.0.0.1:8000';

function DataExplorer() {
  const [locations, setLocations] = useState([]);
  const [pollutants, setPollutants] = useState([]);
  const [dateRange, setDateRange] = useState({ min: '', max: '' });
  const [filteredData, setFilteredData] = useState([]);
  const [selectedPollutants, setSelectedPollutants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataQuality, setDataQuality] = useState(null);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch locations
      const locationsRes = await axios.get(`${API_BASE_URL}/api/locations`);
      setLocations(locationsRes.data.cities || []);

      // Fetch pollutants
      const pollutantsRes = await axios.get(`${API_BASE_URL}/api/pollutants`);
      setPollutants(pollutantsRes.data.pollutants || []);

      // Fetch date range
      const dateRangeRes = await axios.get(`${API_BASE_URL}/api/date-range`);
      setDateRange({
        min: dateRangeRes.data.min_date,
        max: dateRangeRes.data.max_date
      });
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const handleApplyFilters = async (filters) => {
    setLoading(true);
    setSelectedPollutants(filters.pollutants || []);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/data/filtered`, filters);
      
      if (response.data && response.data.data) {
        setFilteredData(response.data.data);
        
        // Calculate data quality
        if (response.data.data.length > 0) {
          const totalRecords = response.data.data.length;
          const pollutantsToCheck = filters.pollutants || ['PM2.5', 'NO2', 'O3'];
          
          let validCount = 0;
          let completeCount = 0;
          
          response.data.data.forEach(record => {
            let hasAllPollutants = true;
            let hasValidValues = true;
            
            pollutantsToCheck.forEach(pollutant => {
              const value = pollutant === 'PM2.5' 
                ? (record.PM2 && record.PM2['5']) || record['PM2.5']
                : record[pollutant];
              
              if (value === null || value === undefined) {
                hasAllPollutants = false;
              }
              if (value !== null && value !== undefined && !isNaN(value) && value >= 0) {
                hasValidValues = true;
              }
            });
            
            if (hasAllPollutants) completeCount++;
            if (hasValidValues) validCount++;
          });
          
          setDataQuality({
            completeness: ((completeCount / totalRecords) * 100).toFixed(1),
            validity: ((validCount / totalRecords) * 100).toFixed(1),
            totalRecords
          });
        }
      }
    } catch (error) {
      console.error('Error fetching filtered data:', error);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="data-explorer-page">
      <div className="data-explorer-header">
        <h1>Air Quality Data Explorer</h1>
        <p className="explorer-subtitle">Analyze and visualize air quality trends across India</p>
      </div>
      
      <div className="dashboard-container">
        <aside className="sidebar">
          <DataControls
            locations={locations}
            pollutants={pollutants}
            dateRange={dateRange}
            onApplyFilters={handleApplyFilters}
          />
          {dataQuality && <DataQuality quality={dataQuality} />}
        </aside>

        <main className="main-content">
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading data...</p>
            </div>
          )}

          {!loading && filteredData.length === 0 && (
            <div className="empty-state-container">
              <div className="card">
                <div style={{textAlign: 'center', padding: '4rem 2rem'}}>
                  <svg 
                    fill="none" 
                    stroke="#4caf50" 
                    viewBox="0 0 24 24" 
                    style={{width: '80px', height: '80px', margin: '0 auto 20px'}}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h2 style={{color: '#2e7d32', marginBottom: '12px'}}>Welcome to Air Quality Data Explorer</h2>
                  <p style={{color: '#666', fontSize: '1.1rem'}}>
                    Select location, time range, and pollutants from the sidebar, then click "Apply Filters" to visualize the data.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loading && filteredData.length > 0 && (
            <div className="data-explorer-grid-2x2">
              <div className="chart-item">
                <TimeSeriesChart data={filteredData} selectedPollutants={selectedPollutants} />
              </div>
              
              <div className="chart-item">
                <PollutantCorrelations data={filteredData} selectedPollutants={selectedPollutants} />
              </div>
              
              <div className="chart-item">
                <StatisticalSummary data={filteredData} selectedPollutants={selectedPollutants} />
              </div>
              
              <div className="chart-item">
                <DistributionAnalysis data={filteredData} selectedPollutants={selectedPollutants} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default DataExplorer;
