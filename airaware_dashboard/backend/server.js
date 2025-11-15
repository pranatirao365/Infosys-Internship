const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// CRITICAL: Disable strict SSL verification (development only!)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
const PORT = process.env.BACKEND_PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const forecastRoutes = require('./routes/forecast');
const airQualityRoutes = require('./routes/air-quality');
const adminRoutes = require('./routes/admin');

// Register routes
app.use('/api/forecast', forecastRoutes);
app.use('/api/air-quality', airQualityRoutes);
app.use('/api/admin', adminRoutes);

// MongoDB connection
const MONGODB_URL = process.env.MONGO_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME;

let db;
let collection;
let client;

// Connect to MongoDB
async function connectToDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        console.log(`   Database: ${DATABASE_NAME}`);
        console.log(`   Collection: ${COLLECTION_NAME}`);
        
        const options = {
            tls: true,
            tlsAllowInvalidCertificates: true,
            tlsAllowInvalidHostnames: true,
            serverSelectionTimeoutMS: 30000,
            connectTimeoutMS: 30000,
        };
        
        client = new MongoClient(MONGODB_URL, options);
        await client.connect();
        
        db = client.db(DATABASE_NAME);
        collection = db.collection(COLLECTION_NAME);
        
        await db.command({ ping: 1 });
        
        const stats = await collection.estimatedDocumentCount();
        console.log(`✅ Connected to MongoDB: ${DATABASE_NAME}.${COLLECTION_NAME}`);
        console.log(`📊 Total documents: ${stats.toLocaleString()}`);
        
        return true;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        return false;
    }
}

// Routes

// Home
app.get('/', (req, res) => {
    res.json({
        message: 'AirAware Node.js API is running',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/health', async (req, res) => {
    try {
        if (!collection) {
            return res.status(500).json({
                status: 'unhealthy',
                database: 'disconnected'
            });
        }
        
        const count = await collection.countDocuments();
        
        res.json({
            status: 'healthy',
            database: 'connected',
            total_records: count,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// Get locations
app.get('/api/locations', async (req, res) => {
    try {
        if (!collection) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        
        const cities = await collection.distinct('City');
        cities.sort();
        
        // Get count for each city
        const cityCountsPromises = cities.map(async (city) => {
            const count = await collection.countDocuments({ City: city });
            return { city, record_count: count };
        });
        
        const cityDetails = await Promise.all(cityCountsPromises);
        
        res.json({
            cities: cities,
            city_details: cityDetails,
            total_cities: cities.length
        });
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get date range
app.get('/api/date-range', async (req, res) => {
    try {
        if (!collection) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        
        const result = await collection.aggregate([
            {
                $group: {
                    _id: null,
                    min_date: { $min: '$Datetime' },
                    max_date: { $max: '$Datetime' },
                    total_records: { $sum: 1 }
                }
            }
        ]).toArray();
        
        if (result.length > 0) {
            res.json({
                min_date: result[0].min_date,
                max_date: result[0].max_date,
                total_records: result[0].total_records
            });
        } else {
            res.json({ error: 'No data found' });
        }
    } catch (error) {
        console.error('Error fetching date range:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get available years
app.get('/api/years', async (req, res) => {
    try {
        if (!collection) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        
        console.log('🔍 Fetching available years...');
        
        // Get sample document to see date format
        const sample = await collection.findOne();
        console.log('Sample Datetime field:', sample?.Datetime);
        
        // Extract unique years from Datetime string (format: "YYYY-MM-DD HH:MM:SS")
        const result = await collection.aggregate([
            {
                $project: {
                    year: { $substr: ['$Datetime', 0, 4] }
                }
            },
            {
                $group: {
                    _id: '$year',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]).toArray();
        
        const years = result
            .map(r => ({ year: r._id, record_count: r.count }))
            .filter(y => y.year && y.year !== '');
        
        console.log(`✅ Found ${years.length} unique years:`, years.map(y => y.year));
        
        res.json({
            years: years.map(y => y.year),
            year_details: years,
            total_years: years.length,
            message: `Found ${years.length} unique years in the dataset`
        });
    } catch (error) {
        console.error('Error fetching years:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get pollutants
app.get('/api/pollutants', async (req, res) => {
    try {
        if (!collection) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        
        const sampleDoc = await collection.findOne();
        
        if (!sampleDoc) {
            return res.json({ error: 'No data found' });
        }
        
        const pollutantFields = {
            'PM2.5': 'PM2.5 (Fine Particulate Matter)',
            'NO': 'Nitrogen Oxide',
            'NO2': 'Nitrogen Dioxide',
            'NOx': 'Nitrogen Oxides',
            'NH3': 'Ammonia',
            'CO': 'Carbon Monoxide',
            'SO2': 'Sulfur Dioxide',
            'O3': 'Ozone',
            'Benzene': 'Benzene',
            'Toluene': 'Toluene',
            'AQI': 'Air Quality Index'
        };
        
        const pollutants = [];
        
        for (const [field, description] of Object.entries(pollutantFields)) {
            if (field in sampleDoc || (field === 'PM2.5' && 'PM2' in sampleDoc)) {
                pollutants.push({
                    field: field,
                    name: description,
                    available: true
                });
            }
        }
        
        res.json({
            pollutants: pollutants,
            total_pollutants: pollutants.length
        });
    } catch (error) {
        console.error('Error fetching pollutants:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get filtered data
app.post('/api/data/filtered', async (req, res) => {
    try {
        if (!collection) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        
        const { cities, start_date, end_date, pollutants } = req.body;
        const limit = parseInt(req.query.limit) || 1000;
        
        // Build query
        const query = {};
        
        if (cities && cities.length > 0) {
            query.City = { $in: cities };
        }
        
        if (start_date || end_date) {
            query.Datetime = {};
            if (start_date) query.Datetime.$gte = start_date;
            if (end_date) query.Datetime.$lte = end_date;
        }
        
        console.log('🔍 MongoDB Query:', JSON.stringify(query));
        
        // Count total matching documents
        const totalCount = await collection.countDocuments(query);
        
        // Get limited results
        let documents = await collection.find(query).limit(limit).toArray();
        
        // Process PM2.5 nested structure
        documents = documents.map(doc => {
            if (doc.PM2 && typeof doc.PM2 === 'object' && doc.PM2['5']) {
                doc['PM2.5'] = doc.PM2['5'];
            }
            // Convert ObjectId to string
            doc._id = doc._id.toString();
            return doc;
        });
        
        // Filter pollutants if specified
        if (pollutants && pollutants.length > 0) {
            documents = documents.map(doc => {
                const filtered = {
                    _id: doc._id,
                    City: doc.City,
                    Datetime: doc.Datetime
                };
                
                pollutants.forEach(pollutant => {
                    if (pollutant in doc) {
                        filtered[pollutant] = doc[pollutant];
                    }
                });
                
                return filtered;
            });
        }
        
        res.json({
            data: documents,
            total_records: totalCount,
            returned_records: documents.length,
            message: `Successfully retrieved ${documents.length} records out of ${totalCount} total matches`
        });
        
    } catch (error) {
        console.error('Error fetching filtered data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get sample data
app.get('/api/data/sample', async (req, res) => {
    try {
        if (!collection) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        
        const limit = parseInt(req.query.limit) || 10;
        
        let documents = await collection.find().limit(limit).toArray();
        
        // Process PM2.5 and convert ObjectId
        documents = documents.map(doc => {
            if (doc.PM2 && typeof doc.PM2 === 'object' && doc.PM2['5']) {
                doc['PM2.5'] = doc.PM2['5'];
            }
            doc._id = doc._id.toString();
            return doc;
        });
        
        res.json({
            sample_data: documents,
            count: documents.length,
            message: `Sample of ${documents.length} records`
        });
        
    } catch (error) {
        console.error('Error fetching sample data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get statistics summary
app.get('/api/stats/summary', async (req, res) => {
    try {
        if (!collection) {
            return res.status(500).json({ error: 'Database not connected' });
        }
        
        const result = await collection.aggregate([
            {
                $group: {
                    _id: null,
                    total_records: { $sum: 1 },
                    avg_aqi: { $avg: '$AQI' },
                    max_aqi: { $max: '$AQI' },
                    min_aqi: { $min: '$AQI' },
                    avg_no2: { $avg: '$NO2' },
                    avg_co: { $avg: '$CO' },
                    avg_so2: { $avg: '$SO2' },
                    avg_o3: { $avg: '$O3' }
                }
            }
        ]).toArray();
        
        if (result.length > 0) {
            const stats = result[0];
            res.json({
                summary: {
                    total_records: stats.total_records,
                    aqi_stats: {
                        average: stats.avg_aqi ? Math.round(stats.avg_aqi * 100) / 100 : null,
                        maximum: stats.max_aqi,
                        minimum: stats.min_aqi
                    },
                    pollutant_averages: {
                        NO2: stats.avg_no2 ? Math.round(stats.avg_no2 * 100) / 100 : null,
                        CO: stats.avg_co ? Math.round(stats.avg_co * 100) / 100 : null,
                        SO2: stats.avg_so2 ? Math.round(stats.avg_so2 * 100) / 100 : null,
                        O3: stats.avg_o3 ? Math.round(stats.avg_o3 * 100) / 100 : null
                    }
                }
            });
        } else {
            res.json({ error: 'No statistical data available' });
        }
    } catch (error) {
        console.error('Error generating summary:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
async function startServer() {
    const connected = await connectToDatabase();
    
    if (!connected) {
        console.error('❌ Failed to connect to database. Server will start but API calls may fail.');
    }
    
    app.listen(PORT, () => {
        console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
        console.log(`   Health check: http://localhost:${PORT}/health`);
        console.log(`   API endpoints: http://localhost:${PORT}/api/*`);
    });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    if (client) {
        await client.close();
        console.log('✅ MongoDB connection closed');
    }
    process.exit(0);
});

// Start the server
startServer();
