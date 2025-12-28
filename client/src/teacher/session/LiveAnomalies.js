import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Shield, RefreshCw, Wifi, XCircle, CheckCircle, TrendingUp, Users, Play, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

/**
 * LiveAnomalies - Real-time Proxy Detection Widget with Analysis Logs
 */
const LiveAnomalies = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ streams: 0, lastAnalysis: null });

  const addLog = (msg, type = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev.slice(-20), { time, msg, type }]);
  };

  const fetchAnomalies = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await axios.get('/api/anomalies', { params: { status: 'pending', t: Date.now() } });
      const data = res.data.anomalies || [];
      setAnomalies(data);
      setLastUpdate(new Date());
      if (data.length > 0) {
        addLog(`Found ${data.length} pending anomalies`, 'warning');
      }
    } catch (error) {
      addLog(`Error fetching: ${error.message}`, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);
      setLogs([]);
      addLog('🚀 Starting correlation analysis...', 'info');
      addLog('📡 Fetching RSSI streams from database...', 'info');
      
      const res = await axios.post('/api/analyze-correlations', {});
      const { results } = res.data;
      
      addLog(`📊 Found ${results?.streams || 0} RSSI streams`, 'info');
      addLog(`👥 Analyzed ${results?.analyzed || 0} student pairs`, 'info');
      
      if (results?.alignmentMethod) {
        addLog(`🔗 Alignment: ${results.alignmentMethod}`, 'info');
      }
      
      if (results?.flagged > 0) {
        addLog(`🚨 FLAGGED: ${results.flagged} suspicious pairs!`, 'warning');
        toast.success(`Found ${results.flagged} suspicious patterns!`);
      } else {
        addLog(`✅ No suspicious patterns detected`, 'success');
        toast('No suspicious patterns detected', { icon: '✅' });
      }
      
      setStats(prev => ({ ...prev, lastAnalysis: new Date() }));
      fetchAnomalies();
    } catch (error) {
      addLog(`❌ Analysis failed: ${error.message}`, 'error');
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 10000);
    return () => clearInterval(interval);
  }, [fetchAnomalies]);

  const handleReview = async (anomalyId, action) => {
    try {
      setReviewing(anomalyId);
      await axios.put(`/api/anomalies/${anomalyId}/review`, { action });
      addLog(`📝 Anomaly ${action === 'confirmed_proxy' ? 'confirmed as proxy' : 'marked false positive'}`, action === 'confirmed_proxy' ? 'warning' : 'success');
      toast.success(action === 'confirmed_proxy' ? '🚫 Proxy confirmed' : '✓ False positive');
      fetchAnomalies();
    } catch (error) {
      toast.error('Failed to review');
    } finally {
      setReviewing(null);
    }
  };

  const getCorrelationColor = (score) => {
    if (score >= 0.95) return 'text-red-600 bg-red-50';
    if (score >= 0.85) return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${anomalies.length > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
            {anomalies.length > 0 ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : (
              <Shield className="h-5 w-5 text-green-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Proxy Detection</h3>
            <p className="text-xs sm:text-sm text-gray-500">
              {anomalies.length > 0 ? `${anomalies.length} suspicious` : 'All clear'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-1"
          >
            {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            <span>Analyze</span>
          </button>
          <button
            onClick={fetchAnomalies}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Analysis Logs */}
      {logs.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto font-mono text-xs">
          {logs.map((log, i) => (
            <div key={i} className={`${log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : log.type === 'success' ? 'text-green-400' : 'text-gray-300'}`}>
              <span className="text-gray-500">[{log.time}]</span> {log.msg}
            </div>
          ))}
        </div>
      )}

      {/* Status Banner */}
      {anomalies.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <Shield className="h-10 w-10 text-green-500 mx-auto mb-2" />
          <p className="text-green-800 font-medium text-sm">All Clear!</p>
          <p className="text-green-600 text-xs">Click "Analyze" to scan for proxy patterns</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {anomalies.map((anomaly) => (
            <div key={anomaly.id} className="bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {anomaly.severity === 'critical' ? 'Critical' : 'Warning'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm">
                    <Users className="h-3 w-3 text-gray-400" />
                    <span className="font-medium truncate">{anomaly.student_id_1}</span>
                    <span className="text-gray-400">&</span>
                    <span className="font-medium truncate">{anomaly.student_id_2}</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <TrendingUp className="h-3 w-3 text-red-500" />
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${getCorrelationColor(anomaly.correlation_score)}`}>
                      ρ = {anomaly.correlation_score?.toFixed(3)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleReview(anomaly.id, 'confirmed_proxy')}
                    disabled={reviewing === anomaly.id}
                    className="p-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg disabled:opacity-50"
                    title="Confirm Proxy"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleReview(anomaly.id, 'false_positive')}
                    disabled={reviewing === anomaly.id}
                    className="p-1.5 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg disabled:opacity-50"
                    title="False Positive"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {lastUpdate && (
        <p className="text-xs text-gray-400 text-center mt-3">
          Updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default LiveAnomalies;
