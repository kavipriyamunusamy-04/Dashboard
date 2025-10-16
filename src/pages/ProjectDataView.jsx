import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API_CONFIG from '../config'
import Navbar from '../components/Navbar'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from 'recharts'

function ProjectDataView({ navbarSearchQuery = '' }) {
  const navigate = useNavigate();
  // State management
  const [projectData, setProjectData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [visibleRows, setVisibleRows] = useState(15); // Show 15 rows initially
  const [selectedDesigner, setSelectedDesigner] = useState(null); // For confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false); // Confirmation dialog visibility
  const [isRefreshing, setIsRefreshing] = useState(false); // Refresh loading state
  
  // Filter states
  const [selectedDesignerFilter, setSelectedDesignerFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Apply filters function
  const applyFilters = () => {
    let filtered = [...projectData];

    // Filter by designer
    if (selectedDesignerFilter) {
      filtered = filtered.filter(project => {
        const designer = project.designerName || project['Designer Name'] || '';
        return designer.toLowerCase().includes(selectedDesignerFilter.toLowerCase());
      });
    }

    // Filter by date range
    if (startDate) {
      filtered = filtered.filter(project => {
        const projStartDate = project.startDate || project['Start Date'] || '';
        if (!projStartDate) return false;
        return new Date(projStartDate) >= new Date(startDate);
      });
    }

    if (endDate) {
      filtered = filtered.filter(project => {
        const projEndDate = project.endDate || project['End Date'] || '';
        if (!projEndDate) return false;
        return new Date(projEndDate) <= new Date(endDate);
      });
    }

    // Apply navbar search
    if (navbarSearchQuery) {
      filtered = filtered.filter(project => {
        const designer = (project.designerName || project['Designer Name'] || '').toLowerCase();
        const team = (project.teamName || project['Team Name'] || '').toLowerCase();
        const query = navbarSearchQuery.toLowerCase();
        return designer.includes(query) || team.includes(query);
      });
    }

    setFilteredData(filtered);
  };

  // Reset filters
  const resetFilters = () => {
    setSelectedDesignerFilter('');
    setStartDate('');
    setEndDate('');
  };

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFilters();
  }, [projectData, selectedDesignerFilter, startDate, endDate, navbarSearchQuery]);

  // Get unique designers for dropdown
  const uniqueDesigners = [...new Set(projectData.map(p => p.designerName || p['Designer Name']).filter(Boolean))];

  // Use filtered data for display
  const displayData = filteredData.length > 0 || selectedDesignerFilter || startDate || endDate || navbarSearchQuery 
    ? filteredData 
    : projectData;
  // Fetch data from API (CSV or Google Sheets)
  const fetchData = async (isManualRefresh = false) => {
    try {      if (isManualRefresh) {
        setIsRefreshing(true);
        
        // Trigger manual refresh on server (downloads fresh data from Google Sheets)
        console.log('🔄 Triggering manual refresh...');
        const refreshResponse = await fetch('http://localhost:3001/api/manual-refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!refreshResponse.ok) {
          const errorData = await refreshResponse.json().catch(() => ({}));
          console.error('Refresh error details:', errorData);
          throw new Error(errorData.error || 'Failed to trigger manual refresh');
        }
        
        const refreshResult = await refreshResponse.json();
        console.log('✅ Manual refresh complete:', refreshResult.message);
        
        // Small delay to ensure file is written
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Choose API URL based on mode
      const apiUrl = API_CONFIG.USE_CSV_MODE ? API_CONFIG.API_URL : API_CONFIG.GOOGLE_SHEETS_API_URL;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Debug: Log the first row to see field names
        console.log('First row data:', result.data[0]);
        console.log('All field names:', result.data[0] ? Object.keys(result.data[0]) : 'No data');
        
        setProjectData(result.data);
        setLastUpdated(new Date());
        
        if (isManualRefresh) {
          console.log('✅ Dashboard updated with fresh data!');
        }
      } else {
        throw new Error('Invalid data format received from API');
      }
        } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  // Fetch data on component mount
  useEffect(() => {
    fetchData();
    
    // Auto-refresh disabled - use manual refresh button instead
    // const interval = setInterval(fetchData, API_CONFIG.REFRESH_INTERVAL);
    // return () => clearInterval(interval);
  }, []);

  // Auto-dismiss notification after 8 seconds
  useEffect(() => {
    if (showConfirmDialog) {
      const timer = setTimeout(() => {
        setShowConfirmDialog(false);
        setSelectedDesigner(null);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [showConfirmDialog]);  // Calculate statistics (use displayData for filtered results)
  const totalDesigners = displayData.length > 0 ? new Set(displayData.map(p => p.designerName || p['Designer Name'])).size : 0;
  
  // Find top performer (designer with most projects)
  const designerProjectCounts = {};
  displayData.forEach(project => {
    const designer = project.designerName || project['Designer Name'] || 'Unknown';
    designerProjectCounts[designer] = (designerProjectCounts[designer] || 0) + 1;
  });
  
  // Get top performer and extract first name from email
  let topPerformer = 'N/A';
  if (Object.keys(designerProjectCounts).length > 0) {
    const topEmail = Object.entries(designerProjectCounts).sort((a, b) => b[1] - a[1])[0][0];
    // Extract first name from email (e.g., "venkatesh.naganathan@valeo.com" -> "Venkatesh")
    if (topEmail && topEmail !== 'Unknown' && topEmail.includes('@')) {
      const namePart = topEmail.split('@')[0]; // Get part before @
      const firstName = namePart.split('.')[0]; // Get part before first dot
      topPerformer = firstName.charAt(0).toUpperCase() + firstName.slice(1); // Capitalize first letter
    } else {
      topPerformer = topEmail;
    }
  }
    // Calculate projects completed today
  const today = new Date().toDateString();
  const projectsCompletedToday = displayData.filter(project => {
    const endDate = project.endDate || project['End Date'] || '';
    if (!endDate) return false;
    try {
      return new Date(endDate).toDateString() === today;
    } catch {
      return false;
    }  }).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSearch={(query) => {
        // Handle search from navbar
        setSelectedDesignerFilter('');
        setStartDate('');
        setEndDate('');
        const filtered = projectData.filter(project => {
          const designer = project.designerName || project['Designer Name'] || '';
          const team = project.team || project['Team'] || '';
          return designer.toLowerCase().includes(query.toLowerCase()) || 
                 team.toLowerCase().includes(query.toLowerCase());
        });
        setFilteredData(filtered);
      }} />
      
      {/* Filter Section */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 py-5">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {/* Designer Filter */}
            <div className="flex items-center gap-3">
              <label className="text-base font-semibold text-gray-700">Designer:</label>
              <select
                value={selectedDesignerFilter}
                onChange={(e) => setSelectedDesignerFilter(e.target.value)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#82E600] focus:border-transparent bg-white text-base font-medium min-w-[220px]"
              >
                <option value="">All Designers</option>
                {uniqueDesigners.map((designer, idx) => (
                  <option key={idx} value={designer}>{designer}</option>
                ))}
              </select>
            </div>

            {/* Date Range Filters */}
            <div className="flex items-center gap-3">
              <label className="text-base font-semibold text-gray-700">Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#82E600] focus:border-transparent text-base font-medium"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-base font-semibold text-gray-700">End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#82E600] focus:border-transparent text-base font-medium"
              />
            </div>

            {/* Reset Filters Button */}
            <button
              onClick={resetFilters}
              className="px-7 py-2.5 text-base font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
            >
              Reset Filters
            </button>

            {/* Filter Results Info */}
            {(selectedDesignerFilter || startDate || endDate || navbarSearchQuery) && (
              <div className="flex items-center gap-2 text-base">
                <span className="text-gray-600 font-medium">Showing:</span>
                <span className="font-bold text-[#82E600]">{displayData.length}</span>
                <span className="text-gray-600 font-medium">of {projectData.length} projects</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-4 py-8">
        
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#82E600]"></div>
              <p className="mt-4 text-gray-600">Loading data from Google Sheets...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-8">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-red-800 font-semibold">Error loading data</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
                <button onClick={fetchData} className="mt-2 text-sm text-red-600 underline hover:text-red-800">
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && projectData.length === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg mb-8">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-yellow-800 font-semibold">No data found</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Please add data to your Google Sheet and refresh the page.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Statistics Cards */}
        {!loading && !error && projectData.length > 0 && (
        <>        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-[#00699E] uppercase tracking-wide">DASHBOARD</h2>
          {lastUpdated && (
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Designers */}          <div className="relative bg-gradient-to-br from-[#005587] to-[#003d5c] rounded-2xl shadow-2xl p-8 fade-in hover:scale-105 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <svg className="w-12 h-12 text-white opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs font-semibold border-2 border-white border-opacity-40 px-3 py-1 rounded-full text-white">ACTIVE</span>
            </div>
            <p className="text-white text-opacity-80 text-sm font-medium uppercase tracking-wider mb-2">Total Designers</p>
            <p className="text-5xl font-black text-white mb-3">{totalDesigners}</p>
            <div className="flex items-center gap-2 text-white text-opacity-70">
              <span className="text-xs font-medium">Team members working</span>
            </div>
          </div>

          {/* Top Performer */}
          <div className="relative bg-gradient-to-br from-[#82E600] to-[#6BC700] rounded-2xl shadow-2xl p-8 fade-in hover:scale-105 transition-all duration-300" style={{animationDelay: '0.1s'}}>
            <div className="flex items-start justify-between mb-4">
              <svg className="w-12 h-12 text-white opacity-90" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <div className="bg-yellow-400 text-green-900 text-xs font-black px-3 py-1 rounded-full">#1</div>
            </div>
            <p className="text-white text-opacity-80 text-sm font-medium uppercase tracking-wider mb-2">Top Performer</p>
            <p className="text-3xl font-black text-white mb-3 truncate">{topPerformer}</p>
            <div className="flex items-center gap-2 text-white text-opacity-70">
              <span className="text-xs font-medium">Highest completion rate</span>
            </div>
          </div>

          {/* Projects Completed Today */}
          <div className="relative bg-gradient-to-br from-[#FF6B35] to-[#E84A25] rounded-2xl shadow-2xl p-8 fade-in hover:scale-105 transition-all duration-300" style={{animationDelay: '0.2s'}}>
            <div className="flex items-start justify-between mb-4">
              <svg className="w-12 h-12 text-white opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <svg className="w-6 h-6 text-white opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white text-opacity-80 text-sm font-medium uppercase tracking-wider mb-2">Completed Today</p>
            <p className="text-5xl font-black text-white mb-3">{projectsCompletedToday}</p>
            <div className="flex items-center gap-2 text-white text-opacity-70">
              <span className="text-xs font-medium">Projects finished</span>
            </div>
          </div>
        </div>

        {/* Data Table */}        <div className="dashboard-card slide-in">          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[#00699E] uppercase tracking-wide">PROJECT DETAILS</h2>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>            <div className="flex gap-3">
              <button 
                onClick={() => fetchData(true)} 
                disabled={isRefreshing}
                className={`px-6 py-3 bg-gradient-to-r from-[#82E600] to-[#6BC700] hover:from-[#6BC700] hover:to-[#82E600] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 ${isRefreshing ? 'opacity-70 cursor-not-allowed scale-100' : ''}`}
              >
                {isRefreshing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Designer Name</th>
                  <th>Team Name</th>
                  <th>Start Date & Time</th>
                  <th>End Date & Time</th>
                  <th>Actual Hours</th>
                  <th>Benchmark Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayData.slice(0, visibleRows).map((project, index) => {
                  // Get values using actual Google Sheets column names
                  const actualHours = project.actualHours 
                    || project['Actual Hours']
                    || 0;
                    
                  const benchmarkHours = project.raisedBenchmarkingHours 
                    || project['Raised Benchmarking Hours']
                    || 0;
                    
                  const startDate = project.startDate 
                    || project['Start Date']
                    || 'N/A';
                    
                  const endDate = project.endDate 
                    || project['End Date']
                    || 'N/A';
                    const efficiency = benchmarkHours > 0 ? ((actualHours / benchmarkHours) * 100) : 0;
                  const status = efficiency <= 100 ? 'On Track' : 'Over Budget';
                  const statusColor = efficiency <= 100 ? 'text-green-700 bg-green-100 border-green-300' : 'text-red-700 bg-red-100 border-red-300';
                  
                  const designerName = project.designerName || project['Designer Name'] || 'N/A';
                  
                  return (
                    <tr key={project.id || index}>
                      <td 
                        className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline transition-colors"
                        onClick={() => {
                          if (designerName !== 'N/A') {
                            setSelectedDesigner(designerName);
                            setShowConfirmDialog(true);
                          }
                        }}
                      >
                        {designerName}
                      </td>
                      <td>{project.teamName || project['Team Name'] || 'N/A'}</td>
                      <td>{startDate}</td>
                      <td>{endDate}</td>
                      <td className="font-semibold">{actualHours}h</td>
                      <td className="font-semibold">{benchmarkHours}h</td>
                      <td>
                        <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-semibold border whitespace-nowrap ${statusColor}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Show More Button */}
          {displayData.length > visibleRows && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setVisibleRows(prev => prev + 15)}
                className="px-8 py-3 bg-[#4E6B7C] hover:bg-[#5a7a8f] text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
              >
                <span>Show More</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <p className="mt-3 text-sm text-gray-600">
                Showing {visibleRows} of {displayData.length} projects
              </p>
            </div>
          )}

          {/* Show All Loaded Message */}
          {displayData.length > 15 && visibleRows >= displayData.length && (
            <div className="mt-6 text-center">
              <p className="text-sm font-semibold text-[#82E600] flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                All {displayData.length} projects loaded
              </p>
            </div>
          )}
        </div>        {/* Top Best Teams Section - Custom 3D Bars */}
        <div className="mt-8 dashboard-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-[#00699E] to-[#0080BB] rounded-lg p-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>            <div>
              <h3 className="text-3xl font-bold text-[#00699E] uppercase tracking-wide">TOP BEST TEAMS</h3>
              <p className="text-sm text-gray-600">Efficiency: Total Benchmark Hours / Total Actual Hours</p>
            </div>
          </div>

          {/* Custom 3D Bar Chart */}
          {(() => {
            // Calculate team efficiency
            const teamStats = {};
            
            projectData.forEach(project => {
              const teamName = project.teamName || project['Team Name'] || 'Unknown';
              const actualHours = parseFloat(project.actualHours || project['Actual Hours'] || 0);
              const benchmarkHours = parseFloat(project.raisedBenchmarkingHours || project['Raised Benchmarking Hours'] || 0);
              
              if (!teamStats[teamName]) {
                teamStats[teamName] = {
                  totalActual: 0,
                  totalBenchmark: 0,
                  projectCount: 0
                };
              }
              
              teamStats[teamName].totalActual += actualHours;
              teamStats[teamName].totalBenchmark += benchmarkHours;
              teamStats[teamName].projectCount += 1;
            });
              
            // Calculate efficiency ratio and sort - Top 15 teams for better visualization
            const chartData = Object.entries(teamStats)
              .map(([team, stats]) => ({
                name: team,
                efficiency: stats.totalActual > 0 ? (stats.totalBenchmark / stats.totalActual) * 100 : 0,
                actualHours: stats.totalActual,
                benchmarkHours: stats.totalBenchmark,
                projects: stats.projectCount
              }))
              .filter(t => t.efficiency > 0 && t.name !== 'Unknown')
              .sort((a, b) => b.efficiency - a.efficiency)
              .slice(0, 15);            // Calculate real-time statistics from chart data
            const bestTeam = chartData.length > 0 ? chartData[0] : null;
            const avgEfficiency = chartData.length > 0 
              ? chartData.reduce((sum, t) => sum + t.efficiency, 0) / chartData.length 
              : 0;
            const totalTeamsCount = chartData.length;
            const totalProjectsCount = chartData.reduce((sum, t) => sum + t.projects, 0);
            const totalHours = chartData.reduce((sum, t) => sum + t.actualHours, 0);

            // Simple bar chart colors
            const CHART_COLORS = [
              '#FF8C42', '#FDB913', '#FFE66D', '#B8E986', '#4ECDC4',
              '#5DADE2', '#00A8E8', '#9B59B6', '#E74C3C', '#82C43C',
              '#FF8C42', '#FDB913', '#FFE66D', '#B8E986', '#4ECDC4'
            ];
            
            // Custom label component with dotted line and circle
            const CustomLabel = (props) => {
              const { x, y, width, index, value } = props;
              const barColor = CHART_COLORS[index % CHART_COLORS.length];
              const labelNumber = String(index + 1).padStart(2, '0');
              
              return (
                <g>
                  {/* Dotted line */}
                  <line
                    x1={x + width / 2}
                    y1={y - 50}
                    x2={x + width / 2}
                    y2={y - 10}
                    stroke={barColor}
                    strokeWidth="2"
                    strokeDasharray="3,3"
                  />
                  {/* Circle */}
                  <circle
                    cx={x + width / 2}
                    cy={y - 55}
                    r="8"
                    fill={barColor}
                  />
                  {/* Number label on bar */}
                  <text
                    x={x + width / 2}
                    y={y + 30}
                    textAnchor="middle"
                    fill="white"
                    fontSize="18"
                    fontWeight="bold"
                  >
                    {labelNumber}
                  </text>
                </g>
              );
            };

            return chartData.length > 0 ? (
              <>
                {/* Real-time Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* Best Performing Team */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md border-l-4 border-green-500 p-5 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="bg-green-500 rounded-lg p-2.5">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                      <span className="text-2xl font-black text-green-600">#1</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Best Team</p>
                    <p className="text-lg font-bold text-gray-800 truncate mb-1">{bestTeam.name}</p>
                    <p className="text-2xl font-black text-green-600">{bestTeam.efficiency.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500 mt-2">{bestTeam.projects} projects</p>
                  </div>

                  {/* Average Efficiency */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md border-l-4 border-blue-500 p-5 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="bg-blue-500 rounded-lg p-2.5">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Avg Efficiency</p>
                    <p className="text-3xl font-black text-blue-600">{avgEfficiency.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500 mt-2">Across all teams</p>
                  </div>

                  {/* Total Teams */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md border-l-4 border-purple-500 p-5 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="bg-purple-500 rounded-lg p-2.5">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Total Teams</p>
                    <p className="text-3xl font-black text-purple-600">{totalTeamsCount}</p>
                    <p className="text-xs text-gray-500 mt-2">Top performers</p>
                  </div>

                  {/* Total Projects & Hours */}
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-md border-l-4 border-orange-500 p-5 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="bg-orange-500 rounded-lg p-2.5">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Total Projects</p>
                    <p className="text-3xl font-black text-orange-600">{totalProjectsCount}</p>
                    <p className="text-xs text-gray-500 mt-2">{totalHours.toFixed(0)}h total</p>
                  </div>
                </div>                {/* Chart */}
                <div className="relative w-full bg-white rounded-2xl shadow-lg p-8 overflow-hidden">
                {/* World Map Background */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
                    <path d="M150,100 L180,90 L200,100 L220,95 L240,105 L260,100 L280,110 L300,105 L320,115 L340,110 L360,120 L380,115 M150,140 L170,135 L190,145 L210,140 L230,150 L250,145 L270,155 L290,150 M400,120 L420,115 L440,125 L460,120 L480,130 L500,125 L520,135 L540,130 M350,180 L370,175 L390,185 L410,180 L430,190 L450,185 L470,195 L490,190 M200,220 L220,215 L240,225 L260,220 L280,230 L300,225 L320,235 L340,230" 
                      stroke="#D1D5DB" 
                      strokeWidth="1.5" 
                      fill="none" 
                      opacity="0.5"/>
                  </svg>
                </div>

                {/* Chart Container */}
                <div className="relative">
                  <ResponsiveContainer width="100%" height={500}>
                    <BarChart 
                      data={chartData}
                      margin={{ top: 80, right: 30, left: 20, bottom: 100 }}
                    >
                      <defs>
                        {chartData.map((entry, index) => (
                          <linearGradient key={`gradient-${index}`} id={`barGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.95}/>
                            <stop offset="100%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.75}/>
                          </linearGradient>
                        ))}
                      </defs>
                      
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={120}
                        tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }}
                        interval={0}
                        axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                        tickLine={false}
                      />
                      <YAxis 
                        hide
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                          border: '2px solid #E5E7EB',
                          borderRadius: '12px',
                          padding: '12px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value, name, props) => {
                          if (name === 'efficiency') {
                            return [
                              <div key="tooltip" className="space-y-1">
                                <div className="text-base font-bold text-gray-800">{props.payload.name}</div>
                                <div className="text-sm"><strong>Efficiency:</strong> {value.toFixed(1)}%</div>
                                <div className="text-sm"><strong>Benchmark:</strong> {props.payload.benchmarkHours.toFixed(1)}h</div>
                                <div className="text-sm"><strong>Actual:</strong> {props.payload.actualHours.toFixed(1)}h</div>
                                <div className="text-sm"><strong>Projects:</strong> {props.payload.projects}</div>
                              </div>
                            ];
                          }
                          return [value, name];
                        }}
                      />
                      <Bar 
                        dataKey="efficiency" 
                        radius={[8, 8, 0, 0]}
                        label={<CustomLabel />}
                      >
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`url(#barGradient-${index})`}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>              </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No team data available</p>
              </div>            );})()}
        </div>

        {/* Hours Analysis Section - Pie Chart + Comparison Bar Chart */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - Hours Distribution */}
          <div className="dashboard-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#00699E] uppercase tracking-wide">Hours Distribution</h2>
                <p className="text-sm text-gray-500 mt-1">Total hours by project status</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={[
                    { 
                      name: 'On Track', 
                      value: displayData.filter(p => {
                        const actual = p.actualHours || p['Actual Hours'] || 0;
                        const benchmark = p.raisedBenchmarkingHours || p['Raised Benchmarking Hours'] || 0;
                        return benchmark > 0 && ((actual / benchmark) * 100) <= 100;
                      }).reduce((sum, p) => sum + (p.actualHours || p['Actual Hours'] || 0), 0),
                      color: '#10B981'
                    },
                    { 
                      name: 'Over Budget', 
                      value: displayData.filter(p => {
                        const actual = p.actualHours || p['Actual Hours'] || 0;
                        const benchmark = p.raisedBenchmarkingHours || p['Raised Benchmarking Hours'] || 0;
                        return benchmark > 0 && ((actual / benchmark) * 100) > 100;
                      }).reduce((sum, p) => sum + (p.actualHours || p['Actual Hours'] || 0), 0),
                      color: '#EF4444'
                    }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent, value}) => `${name}: ${value.toFixed(0)}h (${(percent * 100).toFixed(1)}%)`}
                  outerRadius={130}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'On Track', color: '#10B981' },
                    { name: 'Over Budget', color: '#EF4444' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => `${value.toFixed(0)} hours`}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart - Actual vs Benchmark Hours */}
          <div className="dashboard-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-3 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#00699E] uppercase tracking-wide">Actual vs Benchmark</h2>
                <p className="text-sm text-gray-500 mt-1">Hours comparison by team</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={(() => {
                  const teamGroups = {};
                  displayData.forEach(project => {
                    const teamName = project.teamName || project['Team Name'] || 'Unknown';
                    const actualHours = project.actualHours || project['Actual Hours'] || 0;
                    const benchmarkHours = project.raisedBenchmarkingHours || project['Raised Benchmarking Hours'] || 0;
                    
                    if (!teamGroups[teamName]) {
                      teamGroups[teamName] = {
                        name: teamName,
                        actualHours: 0,
                        benchmarkHours: 0,
                        projects: 0
                      };
                    }
                    
                    teamGroups[teamName].actualHours += actualHours;
                    teamGroups[teamName].benchmarkHours += benchmarkHours;
                    teamGroups[teamName].projects += 1;
                  });
                  
                  return Object.values(teamGroups)
                    .sort((a, b) => b.actualHours - a.actualHours)
                    .slice(0, 8);
                })()}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }}
                  interval={0}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fill: '#6B7280', fontWeight: 600 } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value, name) => {
                    const label = name === 'actualHours' ? 'Actual Hours' : 'Benchmark Hours';
                    return [`${value.toFixed(1)}h`, label];
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="rect"
                  formatter={(value) => {
                    return value === 'actualHours' ? 'Actual Hours' : 'Benchmark Hours';
                  }}
                />
                <Bar 
                  dataKey="actualHours" 
                  fill="#10B981" 
                  radius={[8, 8, 0, 0]}
                  name="actualHours"
                />
                <Bar 
                  dataKey="benchmarkHours" 
                  fill="#EF4444" 
                  radius={[8, 8, 0, 0]}
                  name="benchmarkHours"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        </>
        )}
      </main>
      
      {/* System Notification Toast - Centered */}
      {showConfirmDialog && selectedDesigner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-200 p-6 w-[480px] max-w-[90vw] pointer-events-auto animate-scale-in">            {/* Header */}
            <div className="flex items-start gap-4 mb-5">
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Designer Details</h3>
                <p className="text-base text-gray-600">
                  View performance data for<br/>
                  <span className="font-bold text-blue-600 text-base">{selectedDesigner}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setSelectedDesigner(null);
                }}
                className="flex-shrink-0 text-gray-400 hover:text-gray-700 transition-colors hover:bg-gray-100 rounded-full p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  navigate(`/designer/${encodeURIComponent(selectedDesigner)}`);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-base font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                View Details
              </button>
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setSelectedDesigner(null);
                }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-semibold rounded-lg transition-all duration-200 border-2 border-gray-300"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}      {/* Footer */}
      <footer className="bg-[#2C2C2C] border-t border-gray-700 mt-12">
        <div className="max-w-[1800px] mx-auto px-4 py-6">
          <p className="text-center text-gray-300 text-sm">
            © 2025 Project Dashboard - Built with React + Vite + Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}

export default ProjectDataView;
