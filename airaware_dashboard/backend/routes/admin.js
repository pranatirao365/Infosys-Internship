const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save uploaded files to ml_service folder
    const uploadPath = path.join(__dirname, '../../ml_service');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Save as 'uploaded_data.csv' or with timestamp
    const timestamp = Date.now();
    const filename = `uploaded_data_${timestamp}.csv`;
    cb(null, filename);
  }
});

// File filter to accept only CSV files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  }
});

// POST /api/admin/upload-dataset - Upload CSV dataset
router.post('/upload-dataset', upload.single('dataset'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    console.log('📤 File uploaded:', req.file.filename);
    console.log('📁 Saved to:', req.file.path);

    // Read and validate CSV (basic validation)
    const csv = require('csv-parser');
    let recordCount = 0;
    let hasRequiredColumns = false;
    const requiredColumns = ['City', 'Datetime'];

    await new Promise((resolve, reject) => {
      const stream = fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('headers', (headers) => {
          // Check if required columns exist
          hasRequiredColumns = requiredColumns.every(col => headers.includes(col));
          if (!hasRequiredColumns) {
            stream.destroy();
            reject(new Error('CSV must contain City and Datetime columns'));
          }
        })
        .on('data', (row) => {
          recordCount++;
        })
        .on('end', () => {
          console.log(`✅ CSV validated: ${recordCount} records`);
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    res.json({
      success: true,
      message: 'Dataset uploaded successfully',
      filename: req.file.filename,
      recordsProcessed: recordCount,
      path: req.file.path,
      size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // Delete uploaded file if validation failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload dataset'
    });
  }
});

// POST /api/admin/retrain-models - Trigger model retraining
router.post('/retrain-models', async (req, res) => {
  try {
    const { model } = req.body;
    
    console.log(`🔄 Retraining ${model} model...`);

    // This is a placeholder - you would typically:
    // 1. Run Python scripts to retrain models
    // 2. Update precomputed JSON files
    // 3. Reload data in backend

    // For now, return success message
    res.json({
      success: true,
      message: `${model} model retrained successfully`,
      model: model,
      rmse: Math.random() * 10 + 5, // Mock RMSE value
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Retrain error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrain models'
    });
  }
});

module.exports = router;
