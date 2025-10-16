import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_CONFIG from '../config';
import Navbar from '../components/Navbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function DesignerDetails() {
  const { designerName } = useParams();
  const navigate = useNavigate();
  const [designerData, setDesignerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    onTrack: 0,
    overBudget: 0,
    efficiency: 0
  });

  const fetchDesignerData = async () => {
    try {
      setLoading(true);
      const apiUrl = API_CONFIG.USE_CSV_MODE ? API_CONFIG.API_URL : API_CONFIG.GOOGLE_SHEETS_API_URL;
      const response = await fetch(apiUrl);
      const result = await response.json();
      
      if (result.success && result.data) {
        const filtered = result.data.filter(project => {
          const designer = project.designerName || project['Designer Name'] || '';
          return designer === designerName;
        });
        
        setDesignerData(filtered);
        
        const totalProjects = filtered.length;
        let onTrack = 0;
        let overBudget = 0;
        let totalEfficiency = 0;
        
        filtered.forEach(project => {
          const actualHours = project.actualHours || project['Actual Hours'] || 0;
          const benchmarkHours = project.raisedBenchmarkingHours || project['Raised Benchmarking Hours'] || 0;
          const efficiency = benchmarkHours > 0 ? (actualHours / benchmarkHours) * 100 : 0;
          
          if (efficiency <= 100) onTrack++;
          else overBudget++;
          
          totalEfficiency += efficiency;
        });
        
        setStats({
          totalProjects,
          onTrack,
          overBudget,
          efficiency: totalProjects > 0 ? (totalEfficiency / totalProjects).toFixed(1) : 0
        });
      }
    } catch (error) {
      console.error('Error fetching designer data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (designerName) {
      fetchDesignerData();
    }
  }, [designerName]);

  const teamData = {};
  designerData.forEach(project => {
    const team = project.teamName || project['Team Name'] || 'Unknown';
    teamData[team] = (teamData[team] || 0) + 1;
  });
  
  const teamChartData = Object.entries(teamData).map(([name, value]) => ({ name, value }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#005587' }}></div>
          <p className="mt-4 text-gray-600">Loading designer details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSearch={() => {}} />
      
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-[1800px] mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-[#00699E]">Designer Performance</h1>
          <div className="w-32"></div>
        </div>
      </div>      <main className="max-w-[1800px] mx-auto px-4 py-8">        <div className="rounded-xl shadow-lg p-8 mb-8 text-white" style={{ background: 'linear-gradient(to right, #005587, #003d5c)' }}>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <svg className="w-12 h-12" style={{ color: '#005587' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-1 text-white">{designerName}</h2>
              <p className="text-white opacity-90">Performance Overview</p>
            </div>
          </div>
        </div><div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4" style={{ borderLeftColor: '#005587' }}>
            <p className="text-sm font-semibold text-gray-500 uppercase mb-2">Total Projects</p>
            <p className="text-4xl font-bold" style={{ color: '#005587' }}>{stats.totalProjects}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <p className="text-sm font-semibold text-gray-500 uppercase mb-2">On Track</p>
            <p className="text-4xl font-bold text-green-600">{stats.onTrack}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <p className="text-sm font-semibold text-gray-500 uppercase mb-2">Over Budget</p>
            <p className="text-4xl font-bold text-red-600">{stats.overBudget}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <p className="text-sm font-semibold text-gray-500 uppercase mb-2">Efficiency</p>
            <p className="text-4xl font-bold text-purple-600">{stats.efficiency}%</p>
          </div>
        </div>        {/* Charts Section: Pie Chart + Comparison Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart - Team Distribution */}
          {teamChartData.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Team Distribution</h3>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={teamChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {teamChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bar Chart - Actual Hours vs Benchmark Hours */}
          {designerData.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Actual vs Benchmark Hours</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={designerData.map((project, idx) => ({
                    name: `P${idx + 1}`,
                    actualHours: project.actualHours || project['Actual Hours'] || 0,
                    benchmarkHours: project.raisedBenchmarkingHours || project['Raised Benchmarking Hours'] || 0
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }}
                    labelStyle={{ fontWeight: 'bold', color: '#333' }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Bar 
                    dataKey="actualHours" 
                    fill="#22c55e" 
                    name="Actual Hours" 
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar 
                    dataKey="benchmarkHours" 
                    fill="#ef4444" 
                    name="Benchmark Hours" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">All Projects</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: '#005587' }} className="text-white">
                  <th className="px-6 py-3 text-left text-sm font-semibold">Team Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Start Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">End Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actual Hours</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Benchmark Hours</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {designerData.map((project, index) => {
                  const actualHours = project.actualHours || project['Actual Hours'] || 0;
                  const benchmarkHours = project.raisedBenchmarkingHours || project['Raised Benchmarking Hours'] || 0;
                  const efficiency = benchmarkHours > 0 ? (actualHours / benchmarkHours) * 100 : 0;
                  const status = efficiency <= 100 ? 'On Track' : 'Over Budget';
                  const statusColor = efficiency <= 100 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{project.teamName || project['Team Name'] || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm">{project.startDate || project['Start Date'] || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm">{project.endDate || project['End Date'] || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{actualHours}h</td>
                      <td className="px-6 py-4 text-sm font-semibold">{benchmarkHours}h</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DesignerDetails;
