import React, { useState } from 'react';

function DataControls({ locations, pollutants, dateRange, onApplyFilters, loading }) {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [timeRangeOption, setTimeRangeOption] = useState('custom');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPollutants, setSelectedPollutants] = useState(['PM2.5', 'NO2', 'O3']);

  const handlePollutantToggle = (pollutant) => {
    if (selectedPollutants.includes(pollutant)) {
      setSelectedPollutants(selectedPollutants.filter(p => p !== pollutant));
    } else {
      setSelectedPollutants([...selectedPollutants, pollutant]);
    }
  };

  const handleTimeRangeChange = (option) => {
    setTimeRangeOption(option);
    
    if (option !== 'custom' && dateRange.max) {
      const endDate = new Date(dateRange.max.split(' ')[0]);
      const startDate = new Date(endDate);
      
      switch(option) {
        case '24h':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          break;
      }
      
      setStartDate(startDate.toISOString().split('T')[0]);
      setEndDate(endDate.toISOString().split('T')[0]);
    }
  };

  const handleApplyFilters = () => {
    if (!selectedLocation || !startDate || !endDate || selectedPollutants.length === 0) {
      alert('Please select all filters: Location, Date Range, and at least one Pollutant');
      return;
    }

    const filters = {
      cities: [selectedLocation],
      start_date: startDate,
      end_date: endDate,
      pollutants: selectedPollutants
    };

    onApplyFilters(filters);
  };

  return (
    <div className="data-controls">
      <div className="card-header">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        Data Controls
      </div>

      {/* Location */}
      <div className="control-group">
        <label>Location</label>
        <select 
          value={selectedLocation} 
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <option value="">Select a city...</option>
          {locations.map(location => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>
      </div>

      {/* Time Range */}
      <div className="control-group">
        <label>Time Range</label>
        <select 
          value={timeRangeOption} 
          onChange={(e) => handleTimeRangeChange(e.target.value)}
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="1y">Last 1 Year</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {timeRangeOption === 'custom' && (
        <>
          <div className="control-group">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={dateRange.min?.split(' ')[0]}
              max={dateRange.max?.split(' ')[0]}
            />
          </div>

          <div className="control-group">
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || dateRange.min?.split(' ')[0]}
              max={dateRange.max?.split(' ')[0]}
            />
          </div>
        </>
      )}

      {timeRangeOption !== 'custom' && startDate && endDate && (
        <div className="date-range-display">
          <small>{startDate} to {endDate}</small>
        </div>
      )}

      {/* Pollutants */}
      <div className="control-group">
        <label>Pollutants</label>
        <div className="pollutant-grid">
          {pollutants.slice(0, 9).map(pollutant => (
            <button
              key={pollutant.field}
              className={`pollutant-btn ${selectedPollutants.includes(pollutant.field) ? 'selected' : ''}`}
              onClick={() => handlePollutantToggle(pollutant.field)}
            >
              {pollutant.field}
            </button>
          ))}
        </div>
      </div>

      {/* Apply Button */}
      <button 
        className="apply-btn" 
        onClick={handleApplyFilters}
        disabled={loading}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '20px', height: '20px'}}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {loading ? 'Loading...' : 'Apply Filters'}
      </button>
    </div>
  );
}

export default DataControls;
