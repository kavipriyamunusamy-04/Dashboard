// Production-ready Express server to serve CSV data as JSON
import express from 'express';
import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001; // Use environment PORT for deployment

// Configuration
const CSV_FILE_PATH = path.join(__dirname, 'project_data_new.csv');

// Enable CORS for all origins (you can restrict this later)
app.use(cors());
app.use(express.json());

// Cache data in memory to avoid file locking issues
let cachedData = null;
let lastUpdate = null;

// Function to read CSV into memory cache
async function readCSVToCache() {
  const csvFilePath = CSV_FILE_PATH;
  
  if (!fs.existsSync(csvFilePath)) {
    console.log('⚠️ CSV file not found at:', csvFilePath);
    return null;
  }
  
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on('data', (data) => {
        // Convert string numbers to actual numbers
        Object.keys(data).forEach(key => {
          const value = data[key];
          if (value && !isNaN(value) && value.trim() !== '') {
            data[key] = parseFloat(value);
          }
        });
        results.push(data);
      })
      .on('end', () => {
        cachedData = results;
        lastUpdate = new Date();
        console.log(`✅ Loaded ${results.length} records into cache`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV:', error);
        reject(error);
      });
  });
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Project Dashboard API',
    endpoints: {
      projects: '/api/projects',
      health: '/health',
      manualRefresh: '/api/manual-refresh (POST)'
    },
    status: 'running'
  });
});

// Endpoint to get project data from cache
app.get('/api/projects', async (req, res) => {
  try {
    // If no cache, try to read from file
    if (!cachedData) {
      console.log('📥 Cache empty, loading from CSV...');
      await readCSVToCache();
    }
    
    if (!cachedData || cachedData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data available. CSV file may be empty or missing.'
      });
    }
    
    res.json({
      success: true,
      data: cachedData,
      timestamp: new Date().toISOString(),
      lastUpdate: lastUpdate?.toISOString(),
      source: 'CSV file (cached)',
      records: cachedData.length
    });
  } catch (error) {
    console.error('❌ Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manual refresh endpoint - triggers Python script to download fresh data
app.post('/api/manual-refresh', async (req, res) => {
  try {
    console.log('\n🔄 Manual refresh requested!');
    console.log('='.repeat(60));
    
    const pythonScriptPath = path.join(__dirname, 'backend', 'smart_auto.py');
    
    // Check if Python script exists
    if (!fs.existsSync(pythonScriptPath)) {
      console.log('⚠️ Python script not found, reloading CSV only...');
      await readCSVToCache();
      
      return res.json({
        success: true,
        message: 'Data reloaded from existing CSV',
        records: cachedData?.length || 0,
        timestamp: new Date().toISOString(),
        note: 'Python script not available in production'
      });
    }
    
    // Step 1: Run Python script to download and process data
    console.log('🐍 Running smart_auto.py in manual mode...');
    
    try {
      const { stdout, stderr } = await execAsync(`python "${pythonScriptPath}" --manual`, {
        timeout: 30000,
        cwd: path.join(__dirname, 'backend')
      });
      
      if (stdout) console.log('📋 Python output:', stdout);
      if (stderr && stderr.length > 0) console.warn('⚠️ Python warnings:', stderr);
      
      console.log('✅ Python script completed');
    } catch (pythonError) {
      console.error('❌ Python script error:', pythonError.message);
      
      if (!fs.existsSync(CSV_FILE_PATH)) {
        throw new Error('Python script failed and no CSV file exists');
      }
      console.log('⚠️ Continuing with existing CSV...');
    }
    
    // Step 2: Wait for file system
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Reload cache
    console.log('🔄 Reloading data cache...');
    await readCSVToCache();
    
    console.log(`✅ Manual refresh complete! ${cachedData?.length || 0} records loaded`);
    console.log('='.repeat(60));
    
    res.json({
      success: true,
      message: 'Data refreshed successfully',
      records: cachedData?.length || 0,
      timestamp: new Date().toISOString(),
      source: 'smart_auto.py'
    });
      
  } catch (error) {
    console.error('❌ Manual refresh failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      details: error.stack
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const csvExists = fs.existsSync(CSV_FILE_PATH);
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    csvExists,
    cachedRecords: cachedData?.length || 0,
    lastUpdate: lastUpdate?.toISOString() || 'Never'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log('='.repeat(60));
  console.log('🚀 CSV DATA SERVER');
  console.log('='.repeat(60));
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`API Endpoint: http://localhost:${PORT}/api/projects`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(60));
  
  // Load existing CSV file
  console.log('\n📄 Loading CSV data...\n');
  try {
    await readCSVToCache();
    if (cachedData && cachedData.length > 0) {
      console.log(`✅ Server ready with ${cachedData.length} records!\n`);
    } else {
      console.log('⚠️ CSV file is empty or not found\n');
    }
  } catch (error) {
    console.log('⚠️ Could not load CSV file:', error.message, '\n');
  }
});