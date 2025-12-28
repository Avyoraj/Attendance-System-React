import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye,
  Loader2,
  TrendingUp,
  Users,
  Calendar,
  Activity,
  Play,
  RefreshCw,
  Wifi,
  Zap
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Simple RSSI Chart Component
const RssiChart = ({ data1, data2, label1, label2 }) => {
  if (!data1?.length && !data2?.length) {
    return (
      <div className="bg-gray-100 rounded-xl p-6 sm:p-8 text-center">
        <Activity className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 text-sm sm:text-base">No RSSI data available</p>
      </div>
    );
  }

  const allValues = [...(data1 || []).map(d => d.rssi || d.r), ...(data2 || []).map(d => d.rssi || d.r)];
  const minRssi = Math.min(...allValues, -90);
  const maxRssi = Math.max(...allValues, -30);
  const range = maxRssi - minRssi || 1;

  const width = 600;
  const height = 200;
  const padding = 40;

  const getY = (rssi) => padding + ((maxRssi - rssi) / range) * (height - 2 * padding);
  const getX = (index, total) => padding + (index / (total - 1 || 1)) * (width - 2 * padding);

  const createPath = (data) => {
    if (!data?.length) return '';
    return data.map((d, i) => {
      const x = getX(i, data.length);
      const y = getY(d.rssi || d.r);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h4 className="font-medium text-gray-900 text-sm sm:text-base">RSSI Signal Comparison</h4>
        <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm">
          <span className="flex items-center">
            <span className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mr-1 sm:mr-2"></span>
            {label1}
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full mr-1 sm:mr-2"></span>
            {label2}
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 sm:h-48">
        {[-30, -50, -70, -90].map(rssi => (
          <g key={rssi}>
            <line x1={padding} y1={getY(rssi)} x2={width - padding} y2={getY(rssi)} stroke="#e5e7eb" strokeDasharray="4" />
            <text x={padding - 5} y={getY(rssi) + 4} textAnchor="end" className="text-xs fill-gray-400">{rssi}</text>
          </g>
        ))}
        {data1?.length > 0 && <path d={createPath(data1)} fill="none" stroke="#3b82f6" strokeWidth="2" />}
        {data2?.length > 0 && <path d={createPath(data2)} fill="none" stroke="#ef4444" strokeWidth="2" />}
      </svg>
      <p className="text-xs text-gray-500 mt-2 text-center">Similar patterns = devices moving together (potential proxy)</p>
    </div>
  );
};

// Real-time Analysis Log Component
const AnalysisLog = ({ logs, isRunning }) => (
  <div className="bg-gray-900 rounded-xl p-3 sm:p-4 max-h-48 sm:max-h-64 overflow-y-auto font-mono text-xs sm:text-sm">
    <div className="flex items-center justify-between mb-2">
      <span className="text-green-400 font-semibold">Analysis Log</span>
      {isRunning && (
        <span className="flex items-center text-yellow-400">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Running...
        </span>
      )}
    </div>
    {logs.length === 0 ? (
      <p className="text-gray-500">No analysis running. Click "Run Analysis" to start.</p>
    ) : (
      logs.map((log, i) => (
        <div key={i} className={`py-0.5 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-gray-300'}`}>
          <span className="text-gray-500">[{log.time}]</span> {log.message}
        </div>
      ))
    )}
  </div>
);

const AnomalyReview = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [rssiData, setRssiData] = useState({ data1: [], data2: [] });
  const [loadingRssi, setLoadingRssi] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [analysisLogs, setAnalysisLogs] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  const addLog = (message, type = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setAnalysisLogs(prev => [...prev.slice(-50), { time, message, type }]);
  };

  const fetchAnomalies = useCallback(async () => {
    try {
      const res = await axios.get('/api/anomalies', { params: { status: filter, t: Date.now() } });
      setAnomalies(res.data.anomalies || res.data || []);
      setLastUpdate(new Date());
    } catch (error) {
      if (error.code !== 'ERR_CANCELED') {
        console.error('Failed to fetch anomalies:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Real-time polling every 5 seconds
  useEffect(() => {
    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 5000);
    return () => clearInterval(interval);
  }, [fetchAnomalies]);

  const fetchRssiData = async (anomaly) => {
    try {
      setLoadingRssi(true);
      const res = await axios.get(`/api/rssi-streams/${anomaly.class_id}/${anomaly.session_date}`);
      const streams = res.data.streams || [];
      setRssiData({
        data1: streams.find(s => s.student_id === anomaly.student_id_1)?.rssi_data || [],
        data2: streams.find(s => s.student_id === anomaly.student_id_2)?.rssi_data || []
      });
    } catch (error) {
      setRssiData({ data1: [], data2: [] });
    } finally {
      setLoadingRssi(false);
    }
  };

  const handleSelectAnomaly = (anomaly) => {
    setSelectedAnomaly(anomaly);
    setRssiData({ data1: [], data2: [] });
    fetchRssiData(anomaly);
  };

  const handleRunAnalysis = async () => {
    try {
      setRunningAnalysis(true);
      setAnalysisLogs([]);
      addLog('🚀 Starting correlation analysis...', 'info');
      addLog('📊 Fetching RSSI streams from database...', 'info');
      
      const res = await axios.post('/api/analyze-correlations', {});
      
      addLog(`✅ Analysis complete!`, 'success');
      addLog(`📈 Total pairs analyzed: ${res.data.results?.totalPairs || 0}`, 'info');
      addLog(`🚨 Anomalies flagged: ${res.data.results?.flagged || 0}`, res.data.results?.flagged > 0 ? 'warning' : 'success');
      
      toast.success(`Analysis complete! ${res.data.results?.flagged || 0} anomalies found`);
      fetchAnomalies();
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
      toast.error('Failed to run analysis');
    } finally {
      setRunningAnalysis(false);
    }
  };

  const handleRunTestAnalysis = async () => {
    try {
      setRunningAnalysis(true);
      setAnalysisLogs([]);
      addLog('🧪 Starting TEST analysis with simulated data...', 'info');
      addLog('📱 Generating fake RSSI streams for demo...', 'info');
      
      const res = await axios.get('/api/analyze-correlations/test');
      const results = res.data.results || [];
      
      addLog(`📊 Analyzing ${results.length} student pairs...`, 'info');
      
      results.forEach((r, i) => {
        setTimeout(() => {
          if (r.suspicious) {
            addLog(`🚨 FLAGGED: ${r.student1} & ${r.student2} (ρ=${r.correlation})`, 'warning');
          } else {
            addLog(`✓ OK: ${r.student1} & ${r.student2} (ρ=${r.correlation})`, 'success');
          }
        }, i * 200);
      });
      
      setTimeout(() => {
        const flagged = results.filter(r => r.suspicious);
        addLog(`✅ Test complete! ${flagged.length}/${results.length} pairs flagged`, 'success');
        toast.success(`Test complete! ${flagged.length} suspicious pairs found`);
        setRunningAnalysis(false);
      }, results.length * 200 + 500);
      
    } catch (error) {
      addLog(`❌ Error: ${error.message}`, 'error');
      toast.error('Failed to run test');
      setRunningAnalysis(false);
    }
  };

  const handleReview = async (anomalyId, action) => {
    try {
      setReviewing(true);
      await axios.put(`/api/anomalies/${anomalyId}/review`, { action });
      toast.success(`Anomaly marked as ${action.replace('_', ' ')}`);
      addLog(`📝 Anomaly ${anomalyId} marked as ${action}`, action === 'confirmed_proxy' ? 'warning' : 'success');
      fetchAnomalies();
      setSelectedAnomaly(null);
    } catch (error) {
      toast.error('Failed to update anomaly');
    } finally {
      setReviewing(false);
    }
  };

  const getSeverityBadge = (severity) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      severity === 'critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
    }`}>
      <AlertTriangle className="h-3 w-3 mr-1" />
      <span className="hidden sm:inline">{severity === 'critical' ? 'Critical' : 'Warning'}</span>
      <span className="sm:hidden">{severity === 'critical' ? '!' : '⚠'}</span>
    </span>
  );

  const getCorrelationColor = (score) => score >= 0.9 ? 'text-red-600' : score >= 0.8 ? 'text-amber-600' : 'text-green-600';

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Anomaly Review</h1>
            <p className="text-sm text-gray-600 hidden sm:block">Review flagged proxy attendance patterns</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-xs sm:text-sm text-green-600">
              <Wifi className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-pulse" />
              <span className="hidden sm:inline">Live</span>
            </div>
            <button onClick={fetchAnomalies} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRunTestAnalysis}
            disabled={runningAnalysis}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-purple-200 disabled:opacity-50 flex items-center justify-center space-x-1 sm:space-x-2"
          >
            <Play className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Test Demo</span>
          </button>
          <button
            onClick={handleRunAnalysis}
            disabled={runningAnalysis}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center space-x-1 sm:space-x-2"
          >
            <Zap className={`h-3 w-3 sm:h-4 sm:w-4 ${runningAnalysis ? 'animate-pulse' : ''}`} />
            <span>Run Analysis</span>
          </button>
        </div>
      </div>

      {/* Real-time Analysis Log */}
      <AnalysisLog logs={analysisLogs} isRunning={runningAnalysis} />

      {/* Filter Tabs - Scrollable on mobile */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
        {['pending', 'confirmed_proxy', 'false_positive', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status === 'all' ? '' : status)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              (filter === status || (filter === '' && status === 'all'))
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : status === 'confirmed_proxy' ? 'Confirmed' : status === 'false_positive' ? 'False +' : 'Pending'}
          </button>
        ))}
      </div>

      {/* Info Card - Collapsible on mobile */}
      <details className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
        <summary className="p-3 sm:p-4 cursor-pointer flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
          </div>
          <span className="font-semibold text-gray-900 text-sm sm:text-base">About Correlation Analysis</span>
        </summary>
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          <p className="text-xs sm:text-sm text-gray-600">
            The system analyzes RSSI patterns from student devices. When two students have highly correlated patterns (ρ ≥ 0.9), 
            it may indicate proxy attendance (one person carrying multiple phones).
          </p>
        </div>
      </details>

      {/* Anomalies List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : anomalies.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
          <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Anomalies Found</h3>
          <p className="text-sm text-gray-600">
            {filter === 'pending' ? 'No pending anomalies to review.' : 'No anomalies match the current filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {anomalies.map((anomaly) => (
            <div key={anomaly.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {getSeverityBadge(anomaly.severity)}
                    <span className="text-xs sm:text-sm text-gray-500 flex items-center">
                      <Calendar className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {anomaly.session_date}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Students</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                        <span className="font-medium text-xs sm:text-sm truncate">{anomaly.student_id_1}</span>
                        <span className="text-gray-400">&</span>
                        <span className="font-medium text-xs sm:text-sm truncate">{anomaly.student_id_2}</span>
                      </div>
                    </div>
                    
                    <div className="hidden sm:block">
                      <p className="text-xs text-gray-500">Class</p>
                      <p className="font-medium text-sm mt-1">{anomaly.class_id}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500">Correlation</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <TrendingUp className={`h-3 w-3 sm:h-4 sm:w-4 ${getCorrelationColor(anomaly.correlation_score)}`} />
                        <span className={`text-lg sm:text-xl font-bold ${getCorrelationColor(anomaly.correlation_score)}`}>
                          {anomaly.correlation_score?.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-2">
                  <button onClick={() => handleSelectAnomaly(anomaly)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="View">
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  {anomaly.status === 'pending' && (
                    <>
                      <button onClick={() => handleReview(anomaly.id, 'confirmed_proxy')} disabled={reviewing} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Confirm Proxy">
                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button onClick={() => handleReview(anomaly.id, 'false_positive')} disabled={reviewing} className="p-2 text-green-500 hover:bg-green-50 rounded-lg" title="False Positive">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {anomaly.status !== 'pending' && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
                  <span className={`text-xs sm:text-sm font-medium ${anomaly.status === 'confirmed_proxy' ? 'text-red-600' : 'text-green-600'}`}>
                    {anomaly.status === 'confirmed_proxy' ? '🚫 Confirmed Proxy' : '✓ False Positive'}
                  </span>
                  {anomaly.reviewed_at && (
                    <span className="text-xs text-gray-500">• {new Date(anomaly.reviewed_at).toLocaleDateString()}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Last Update */}
      {lastUpdate && (
        <p className="text-xs text-gray-400 text-center">Updated: {lastUpdate.toLocaleTimeString()}</p>
      )}

      {/* Detail Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Anomaly Details</h3>
              <button onClick={() => setSelectedAnomaly(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Student 1</p>
                  <p className="font-semibold text-base sm:text-lg">{selectedAnomaly.student_id_1}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Student 2</p>
                  <p className="font-semibold text-base sm:text-lg">{selectedAnomaly.student_id_2}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs sm:text-sm text-gray-500 mb-2">Correlation Analysis</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-4">
                  <span className={`text-2xl sm:text-3xl font-bold ${getCorrelationColor(selectedAnomaly.correlation_score)}`}>
                    ρ = {selectedAnomaly.correlation_score?.toFixed(4)}
                  </span>
                  <div className="text-xs sm:text-sm text-gray-600">
                    <p>• ρ ≥ 0.9: High likelihood of proxy</p>
                    <p>• ρ 0.7-0.9: Suspicious pattern</p>
                  </div>
                </div>
              </div>
              
              {loadingRssi ? (
                <div className="bg-gray-100 rounded-xl p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto mb-3" />
                  <p className="text-gray-500">Loading RSSI data...</p>
                </div>
              ) : (
                <RssiChart data1={rssiData.data1} data2={rssiData.data2} label1={selectedAnomaly.student_id_1} label2={selectedAnomaly.student_id_2} />
              )}
            </div>
            
            {selectedAnomaly.status === 'pending' && (
              <div className="sticky bottom-0 bg-white p-4 sm:p-6 border-t border-gray-200 flex space-x-3">
                <button onClick={() => handleReview(selectedAnomaly.id, 'confirmed_proxy')} disabled={reviewing} className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl disabled:opacity-50">
                  Confirm Proxy
                </button>
                <button onClick={() => handleReview(selectedAnomaly.id, 'false_positive')} disabled={reviewing} className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl disabled:opacity-50">
                  False Positive
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnomalyReview;
