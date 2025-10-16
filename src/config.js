// API Configuration
export const API_CONFIG = {
  // Option 1: Use local CSV server (recommended)
  API_URL: 'http://localhost:3001/api/projects',
  
  // Option 2: Direct Google Sheets API (fallback)
  GOOGLE_SHEETS_API_URL: 'https://script.google.com/a/macros/valeo.com/s/AKfycbw6omxf2531nke6Eu7jIO6wc36ymPuhXu1gSwnuMOSiv-Qcdn24FGDRPBVV6VXNNbHW2A/exec',
    // Refresh interval in milliseconds (disabled - use manual refresh button instead)
  REFRESH_INTERVAL: 3600000, // 1 hour (same as Python auto-update)
  
  // Use CSV mode (true) or direct Google Sheets (false)
  USE_CSV_MODE: true,
};

export default API_CONFIG;
