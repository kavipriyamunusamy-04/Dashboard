// Simple Express server to serve CSV data as JSON
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
const PORT = 3001;

// Configuration
const CSV_FILE_PATH = path.join(__dirname, 'project_data_new.csv');
const DOWNLOADS_FOLDER = "C:\\Users\\kmunusa1\\Downloads";

// Enable CORS for React app
app.use(cors());

// Cache data in memory to avoid file locking issues
let cachedData = null;
let lastUpdate = null;

// Function to read CSV into memory cache
async function readCSVToCache() {
  const csvFilePath = CSV_FILE_PATH;
  
  if (!fs.existsSync(csvFilePath)) {
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
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Endpoint to get project data from cache
app.get('/api/projects', async (req, res) => {
  try {
    // If no cache, try to read from file
    if (!cachedData) {
      await readCSVToCache();
    }
    
    if (!cachedData || cachedData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data available. Waiting for first update...'
      });
    }
    
    res.json({
      success: true,
      data: cachedData,
      timestamp: new Date().toISOString(),
      lastUpdate: lastUpdate?.toISOString(),
      source: 'CSV file (cached)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });  }
});

// Manual refresh endpoint - triggers Python script to download fresh data
app.post('/api/manual-refresh', async (req, res) => {
  try {
    console.log('\n🔄 Manual refresh requested!');
    console.log('=' .repeat(60));    // Step 1: Run Python script to download and process data
    console.log('🐍 Running smart_auto.py in manual mode...');
    const pythonScriptPath = path.join(__dirname, 'backend', 'smart_auto.py');
    
    try {
      // Execute Python script with --manual flag for one-time execution
      const { stdout, stderr } = await execAsync(`python "${pythonScriptPath}" --manual`, {
        timeout: 30000, // 30 second timeout
        cwd: path.join(__dirname, 'backend') // Run from backend directory
      });
      
      if (stdout) {
        console.log('📋 Python script output:');
        console.log(stdout);
      }
      if (stderr && stderr.length > 0) {
        console.warn('⚠️ Python warnings:', stderr);
      }
      
      console.log('✅ Python script completed successfully');
    } catch (pythonError) {
      console.error('❌ Python script error:', pythonError.message);
      // Check if CSV file was still updated despite error
      if (!fs.existsSync(CSV_FILE_PATH)) {
        throw new Error('Python script failed and no CSV file was generated');
      }
      console.log('⚠️ Continuing with existing CSV file...');
    }
    
    // Step 2: Wait for file system to settle
    console.log('⏳ Waiting for file system...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Verify CSV file exists
    if (!fs.existsSync(CSV_FILE_PATH)) {
      throw new Error('CSV file not found after Python script execution');
    }
      const stats = fs.statSync(CSV_FILE_PATH);
    console.log(`✅ Found CSV file: project_data_new.csv (${(stats.size / 1024).toFixed(2)} KB)`);
      // Step 4: Reload cache from the CSV file (already processed by Python script)
    console.log('🔄 Reloading data cache...');
    await readCSVToCache();
    
    console.log(`✅ Manual refresh complete! ${cachedData.length} records loaded`);
    console.log('=' .repeat(60));
    
    res.json({
      success: true,
      message: 'Data refreshed successfully',
      records: cachedData.length,
      timestamp: new Date().toISOString(),
      source: 'smart_auto.py'
    });
      } catch (error) {
    console.error('❌ Manual refresh failed:', error.message);
    console.error('Full error:', error);
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
    csvExists
  });
});

// Watch for CSV file changes and auto-reload (with debounce to prevent multiple reloads)
// let reloadTimeout = null;
// fs.watch(CSV_FILE_PATH, async (eventType, filename) => {
//   if (eventType === 'change') {
//     // Clear any existing timeout
//     if (reloadTimeout) {
//       clearTimeout(reloadTimeout);
//     }
    
//     // Set a new timeout - only reload after 1 second of no changes
//     reloadTimeout = setTimeout(async () => {
//       console.log(`\n📥 CSV file changed! Reloading data... (${new Date().toLocaleTimeString()})`);
//       try {
//         await readCSVToCache();
//         if (cachedData && cachedData.length > 0) {
//           console.log(`✅ Reloaded ${cachedData.length} records\n`);
//         }
//       } catch (error) {
//         console.log(`⚠️ Error reloading CSV: ${error.message}\n`);
//       }
//       reloadTimeout = null;
//     }, 1000); // Wait 1 second after last change
//   }
// });

// Start server
app.listen(PORT, async () => {
  console.log('='.repeat(60));
  console.log('🚀 CSV DATA SERVER');
  console.log('='.repeat(60));
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`API Endpoint: http://localhost:${PORT}/api/projects`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log('='.repeat(60));
  
  // Load existing CSV file
  console.log('\n📄 Loading CSV data...\n');
  try {
    await readCSVToCache();
    if (cachedData && cachedData.length > 0) {
      console.log(`✅ Loaded ${cachedData.length} records from CSV file`);
      console.log('✅ Server is ready and serving data!\n');
    } else {
      console.log('⚠️ CSV file is empty');
    }
  } catch (error) {
    console.log('⚠️ No CSV file found');
  }
  
  console.log(' Watching for CSV file changes...');
  console.log('💡 CSV updates are handled by smart_auto.py\n');
});
