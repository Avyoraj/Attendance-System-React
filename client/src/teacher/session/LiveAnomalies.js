import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, Shield, RefreshCw, Users, XCircle, CheckCircle, 
  Activity, Wifi, Clock, BarChart2, Loader2 
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

/**
 * LiveAnomalies - Real-time Proxy Detection with Auto-Analysis
 * Shows RSSI streams, runs correlation analysis automatically, displays detailed results
 */
const LiveAnomalies = () => {
  const [streams, setStreams] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [reviewing, setReviewing] = useState(null);

  // Fetch RSSI streams and anomalies
  const fetchData = useCallback(async () => {
    try {
      const [streamsRes, anomaliesRes] = await Promise.all([
        axios.get('/api/rssi/streams', { params: { date: new Date().toISOString() } }),
        axios.get('/api/anomalies', { params: { status: 'pending' } })
      ]);
      
      setStreams(streamsRes.data.streams || []);
      setAnomalies(anomaliesRes.data.anomalies || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run correlation analysis
  const runAnalysis = useCallback(async () => {
    if (streams.length < 2) return;
    
    try {
      setAnalyzing(true);
      const res = await axios.post('/api/rssi/analyze', {});
      setAnalysisResult(res.data.results);
      
      // Refresh anomalies after analysis
      const anomaliesRes = await axios.get('/api/anomalies', { params: { status: 'pending' } });
      setAnomalies(anomaliesRes.data.anomalies || []);
      
      if (res.data.results?.flagged > 0) {
        toast.error(`🚨 ${res.data.results.flagged} proxy pattern detected!`);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  }, [streams.length]);

  // Initial load and polling
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchData]);

  // Auto-analyze when we have 2+ streams
  useEffect(() => {
    if (streams.length >= 2 && !analyzing && !analysisResult) {
      runAnalysis();
    }
  }, [streams.length, analyzing, analysisResult, runAnalysis]);

  // Handle anomaly review
  const handleReview = async (anomalyId, action) => {
    try {
      setReviewing(anomalyId);
      // Map frontend action to backend status (must match DB constraints)
      // DB allows: 'pending', 'confirmed_proxy', 'false_positive', 'investigating'
      const status = action === 'confirmed_proxy' ? 'confirmed_proxy' : 'false_positive';
      
      await axios.put(`/api/anomalies/${anomalyId}`, { 
        status,
        reviewNotes: action === 'confirmed_proxy' ? 'Confirmed by teacher via dashboard' : 'Marked as false positive by teacher'
      });

      toast.success(action === 'confirmed_proxy' ? '🚫 Proxy confirmed' : '✓ Marked as false positive');
      fetchData();
    } catch (error) {
      console.error('Review error:', error);
      toast.error('Failed to review');
    } finally {
      setReviewing(null);
    }
  };

  const getCorrelationColor = (score) => {
    if (score >= 0.85) return 'text-red-600';
    if (score >= 0.7) return 'text-orange-500';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getCorrelationBg = (score) => {
    if (score >= 0.85) return 'bg-red-50 border-red-200';
    if (score >= 0.7) return 'bg-orange-50 border-orange-200';
    if (score >= 0.5) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl ${anomalies.length > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
            {anomalies.length > 0 ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : (
              <Shield className="h-5 w-5 text-green-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Proxy Detection</h3>
            <p className="text-xs text-gray-500">Real-time RSSI correlation analysis</p>
          </div>
        </div>
        <button
          onClick={() => { setAnalysisResult(null); runAnalysis(); }}
          disabled={analyzing || streams.length < 2}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          title="Re-analyze"
        >
          <RefreshCw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* RSSI Streams Status */}
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Wifi className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Active RSSI Streams</span>
          </div>
          <span className={`text-sm font-bold ${streams.length >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
            {streams.length} device{streams.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {streams.length === 0 ? (
          <p className="text-xs text-gray-500">No devices streaming RSSI data today</p>
        ) : (
          <div className="space-y-1">
            {streams.slice(0, 4).map((stream, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-2 py-1.5 border border-gray-100">
                <span className="font-medium text-gray-700">{stream.student_id}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">{stream.sample_count || stream.rssi_data?.length || 0} samples</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            ))}
            {streams.length > 4 && (
              <p className="text-xs text-gray-400 text-center">+{streams.length - 4} more</p>
            )}
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {streams.length >= 2 && (
        <div className={`rounded-xl p-3 border ${analysisResult ? getCorrelationBg(analysisResult.correlation || 0) : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center space-x-2 mb-2">
            <BarChart2 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Correlation Analysis</span>
            {analyzing && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
          </div>

          {analyzing ? (
            <div className="text-xs text-blue-600">Analyzing RSSI patterns...</div>
          ) : analysisResult ? (
            <div className="space-y-2">
              {/* Main Result */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Pairs analyzed:</span>
                <span className="text-sm font-bold text-gray-800">{analysisResult.analyzed || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Suspicious pairs:</span>
                <span className={`text-sm font-bold ${analysisResult.flagged > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {analysisResult.flagged || 0}
                </span>
              </div>

              {/* Conclusion */}
              <div className={`mt-2 p-2 rounded-lg ${analysisResult.flagged > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                {analysisResult.flagged > 0 ? (
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-medium text-red-700">
                      Proxy pattern detected! Review flagged pairs below.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700">
                      All clear - no proxy patterns detected
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">Waiting for analysis...</div>
          )}
        </div>
      )}

      {/* Pending Anomalies */}
      {anomalies.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-gray-700">Flagged Pairs</span>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{anomalies.length}</span>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {anomalies.map((anomaly) => (
              <div key={anomaly.id} className="bg-red-50 border border-red-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-gray-800">
                      {anomaly.student_id_1} & {anomaly.student_id_2}
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${getCorrelationColor(anomaly.correlation_score)}`}>
                    ρ = {anomaly.correlation_score?.toFixed(3)}
                  </span>
                </div>
                
                {/* Detailed info */}
                <div className="text-xs text-gray-600 mb-2 bg-white rounded-lg p-2 border border-red-100">
                  {anomaly.notes || 'High correlation detected - possible proxy attendance'}
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleReview(anomaly.id, 'confirmed_proxy')}
                    disabled={reviewing === anomaly.id}
                    className="px-2 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-xs font-medium disabled:opacity-50 flex items-center space-x-1"
                  >
                    <XCircle className="h-3 w-3" />
                    <span>Confirm Proxy</span>
                  </button>
                  <button
                    onClick={() => handleReview(anomaly.id, 'false_positive')}
                    disabled={reviewing === anomaly.id}
                    className="px-2 py-1 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg text-xs font-medium disabled:opacity-50 flex items-center space-x-1"
                  >
                    <CheckCircle className="h-3 w-3" />
                    <span>False Positive</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Streams Warning */}
      {streams.length < 2 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600">Need 2+ devices for analysis</p>
          <p className="text-xs text-gray-500">Currently {streams.length} device streaming</p>
        </div>
      )}

      {/* All Clear State */}
      {streams.length >= 2 && anomalies.length === 0 && analysisResult && !analyzing && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-700">All Clear!</p>
          <p className="text-xs text-green-600">No proxy patterns detected in {streams.length} devices</p>
        </div>
      )}

      {/* Last Update */}
      {lastUpdate && (
        <div className="flex items-center justify-center space-x-1 text-xs text-gray-400">
          <Clock className="h-3 w-3" />
          <span>Updated {lastUpdate.toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
};

export default LiveAnomalies;
