/**
 * Pre-compute ALL dashboard data for instant loading
 * - Average AQI (last 100 records per city)
 * - Pollutant concentrations (last 48 hours per city per pollutant)
 * Run this script once to generate optimized data files
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const CSV_PATH = path.join(__dirname, '../../ml_service/city_hour_final.csv');
const OUTPUT_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'precomputed-dashboard-data.json');

console.log('🚀 Starting pre-computation of dashboard data...\n');
console.log(`📂 Reading CSV: ${CSV_PATH}`);
console.log(`💾 Output file: ${OUTPUT_FILE}\n`);

// Available pollutants from CSV
const POLLUTANTS = ['PM2.5', 'NO', 'NO2', 'NOx', 'NH3', 'CO', 'SO2', 'O3', 'Benzene', 'Toluene'];

// Store all city data
const cityDataMap = {};

// Read CSV and collect all data by city
const startTime = Date.now();
let rowCount = 0;

fs.createReadStream(CSV_PATH)
  .pipe(csv())
  .on('data', (row) => {
    rowCount++;
    
    if (rowCount % 100000 === 0) {
      console.log(`📊 Processed ${rowCount.toLocaleString()} rows...`);
    }

    const city = row.City;
    if (!city) return;

    // Initialize city data if not exists
    if (!cityDataMap[city]) {
      cityDataMap[city] = [];
    }

    // Parse and store all pollutant values
    const record = {
      datetime: row.Datetime,
      timestamp: new Date(row.Datetime).getTime(),
      aqi: parseFloat(row.AQI),
      aqiBucket: row.AQI_Bucket,
      pollutants: {}
    };

    // Add all pollutants
    POLLUTANTS.forEach(pollutant => {
      const value = parseFloat(row[pollutant]);
      record.pollutants[pollutant] = isNaN(value) ? 0 : value;
    });

    // Only add if AQI is valid
    if (!isNaN(record.aqi)) {
      cityDataMap[city].push(record);
    }
  })
  .on('end', () => {
    console.log(`\n✅ CSV parsing complete! Processed ${rowCount.toLocaleString()} rows`);
    console.log(`📍 Found ${Object.keys(cityDataMap).length} cities\n`);

    // Sort all city data by timestamp (newest first)
    console.log('🔄 Sorting data by timestamp...');
    Object.keys(cityDataMap).forEach(city => {
      cityDataMap[city].sort((a, b) => b.timestamp - a.timestamp);
    });

    // Generate pre-computed data
    const precomputedData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalRows: rowCount,
        cities: Object.keys(cityDataMap).length,
        pollutants: POLLUTANTS,
        methodology: {
          avgAQI: 'Average of last 100 hourly records',
          pollutantTrends: 'Last 48 hourly records per pollutant'
        }
      },
      cities: {}
    };

    console.log('💻 Computing averages and trends for each city...\n');

    // Process each city
    Object.keys(cityDataMap).forEach(city => {
      const allRecords = cityDataMap[city];
      const recentRecords = allRecords.slice(0, Math.min(100, allRecords.length));
      
      console.log(`  📍 ${city}: ${allRecords.length.toLocaleString()} total records, using ${recentRecords.length} recent`);

      // Calculate average AQI
      const avgAQI = recentRecords.reduce((sum, r) => sum + r.aqi, 0) / recentRecords.length;

      // Determine AQI category
      let category, color;
      if (avgAQI <= 50) {
        category = 'Good';
        color = '#4ade80';
      } else if (avgAQI <= 100) {
        category = 'Satisfactory';
        color = '#fbbf24';
      } else if (avgAQI <= 200) {
        category = 'Moderate';
        color = '#fb923c';
      } else if (avgAQI <= 300) {
        category = 'Poor';
        color = '#ef4444';
      } else if (avgAQI <= 400) {
        category = 'Very Poor';
        color = '#a855f7';
      } else {
        category = 'Severe';
        color = '#7c2d12';
      }

      // Calculate average pollutant concentrations
      const avgPollutants = {};
      POLLUTANTS.forEach(pollutant => {
        const avg = recentRecords.reduce((sum, r) => sum + r.pollutants[pollutant], 0) / recentRecords.length;
        avgPollutants[pollutant] = Math.round(avg * 100) / 100;
      });

      // Get last 48 hours trend for each pollutant
      const pollutantTrends = {};
      const last48Records = allRecords.slice(0, Math.min(48, allRecords.length)).reverse(); // Chronological order

      POLLUTANTS.forEach(pollutant => {
        pollutantTrends[pollutant] = last48Records.map(r => ({
          datetime: r.datetime,
          value: r.pollutants[pollutant]
        }));
      });

      // Store city data
      precomputedData.cities[city] = {
        currentAQI: {
          aqi: Math.round(avgAQI),
          category: category,
          color: color,
          timestamp: recentRecords[0].datetime,
          recordsUsed: recentRecords.length,
          pollutants: avgPollutants
        },
        pollutantTrends: pollutantTrends,
        dataAvailability: {
          totalRecords: allRecords.length,
          latestDate: allRecords[0].datetime,
          oldestDate: allRecords[allRecords.length - 1].datetime
        }
      };
    });

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Write to file
    console.log('\n💾 Writing pre-computed data to file...');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(precomputedData, null, 2));

    const fileSize = fs.statSync(OUTPUT_FILE).size;
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ ✅ ✅ PRE-COMPUTATION COMPLETE! ✅ ✅ ✅\n');
    console.log(`📊 Summary:`);
    console.log(`   ├─ Total rows processed: ${rowCount.toLocaleString()}`);
    console.log(`   ├─ Cities processed: ${Object.keys(precomputedData.cities).length}`);
    console.log(`   ├─ Pollutants tracked: ${POLLUTANTS.length}`);
    console.log(`   ├─ Output file size: ${fileSizeMB} MB`);
    console.log(`   └─ Total time: ${totalTime} seconds`);
    console.log(`\n📁 Output saved to: ${OUTPUT_FILE}`);
    console.log(`\n🚀 Dashboard will now load INSTANTLY! ⚡\n`);
  })
  .on('error', (error) => {
    console.error('❌ Error reading CSV:', error);
    process.exit(1);
  });
