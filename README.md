# 📊 Project Dashboard - Auto-Updating from Google Sheets

A modern, real-time dashboard that displays project data from Google Sheets with automatic updates every hour.

---

## 🚀 Quick Start

### 1. Start All Servers
```bash
start-all-servers.bat
```

This will start:
- ✅ **Frontend** (React/Vite) - http://localhost:5173
- ✅ **Backend** (Flask Auth API) - http://localhost:5000
- ✅ **Data Server** (Node.js) - http://localhost:3001
- ✅ **Auto-Updater** (Python) - Updates every 1 hour

### 2. Start Only Dashboard
```bash
start-dashboard.bat
```

Use this if you only want to run the frontend and data server (no authentication).

---

## 📁 Project Structure

```
project-dashboard/
├── src/                        # React frontend source code
│   ├── pages/
│   │   ├── SignIn.jsx         # Login page
│   │   ├── SignUp.jsx         # Registration page
│   │   ├── Dashboard.jsx      # Main dashboard layout
│   │   └── ProjectDataView.jsx # Data visualization
│   ├── config.js              # API configuration
│   └── ...
├── backend/                    # Python Flask backend
│   ├── app.py                 # Authentication API
│   ├── smart_auto.py          # Auto-updater (1 hour interval)
│   └── requirements.txt       # Python dependencies
├── server.js                  # Node.js data server
├── project_data_new.csv       # Current dashboard data
├── project_data_new.json      # JSON version of data
└── start-all-servers.bat      # Launch all servers
```

---

## 🔄 How Auto-Update Works

The `smart_auto.py` script runs in the background and:

1. **Every 1 hour**, opens your Google Apps Script URL in a browser
2. Downloads the latest CSV file to your Downloads folder
3. Processes and renames columns to match dashboard format
4. Updates `project_data_new.csv` and `project_data_new.json`
5. The Node.js server detects the file change and reloads data
6. The dashboard automatically reflects the new data

### Column Mapping
The auto-updater automatically maps Google Sheets columns:
- `Designers` → `Designer Name`
- `Started Date & Time` → `Start Date`
- `Ended Date & Time` → `End Date`
- `Actual Avaliability Hrs` → `Actual Hours`
- `Raised BM Hrs` → `Raised Benchmarking Hours`

---

## 🎯 Manual Refresh

The dashboard has a **Refresh** button that allows users to manually refresh the data at any time:

1. Click the **Refresh** button in the Project Details section
2. The button shows a loading spinner while fetching new data
3. Data refreshes instantly without page reload
4. "Last updated" timestamp is updated

---

## ⚙️ Configuration

### Change Auto-Update Interval

Edit `backend/smart_auto.py`:

```python
CHECK_INTERVAL = 3600  # 1 hour (in seconds)

# Examples:
# 1800  = 30 minutes
# 900   = 15 minutes
# 300   = 5 minutes
```

### Change Google Sheets URL

Edit `backend/smart_auto.py`:

```python
CSV_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE"
```

### Change Downloads Folder

Edit `backend/smart_auto.py`:

```python
DOWNLOADS_FOLDER = r"C:\Your\Custom\Path"
```

---

## 🛠️ Development

### Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

### Run Servers Individually

**Frontend only:**
```bash
npm run dev
```

**Backend only:**
```bash
cd backend
python app.py
```

**Data server only:**
```bash
node server.js
```

**Auto-updater only:**
```bash
cd backend
python smart_auto.py
```

---

## 📊 Dashboard Features

- ✅ Real-time data updates every hour
- ✅ Manual refresh button with loading indicator
- ✅ Total designers count
- ✅ Top performer identification
- ✅ Projects completed today
- ✅ Detailed project table with sorting
- ✅ Team performance charts
- ✅ Export functionality (coming soon)
- ✅ User authentication (optional)

---

## 🔒 Authentication (Optional)

If you want to use authentication:

1. Start all servers with `start-all-servers.bat`
2. Sign up at http://localhost:5173/signup
3. Sign in at http://localhost:5173/signin
4. View dashboard at http://localhost:5173/dashboard

To disable authentication, just use `start-dashboard.bat` instead.

---

## 📝 Notes

- The auto-updater runs in a separate terminal window
- Keep all terminal windows open while using the dashboard
- Data is cached in memory for fast access
- CSV files are watched for changes automatically
- Latest update time is displayed on the dashboard

---

## 🆘 Troubleshooting

**Dashboard shows old data?**
- Click the Refresh button
- Check if `smart_auto.py` is running
- Verify the latest CSV exists in Downloads folder

**Servers won't start?**
- Check if ports 3001, 5000, 5173 are available
- Kill existing Node.js or Python processes
- Restart with `start-all-servers.bat`

**Auto-updater not working?**
- Verify the Google Apps Script URL is correct
- Check Downloads folder permissions
- Restart `smart_auto.py`

---

## 📄 License

© 2025 Valeo Project Dashboard

---

**Built with:** React ⚛️ | Vite ⚡ | Tailwind CSS 🎨 | Flask 🐍 | Node.js 🟢
