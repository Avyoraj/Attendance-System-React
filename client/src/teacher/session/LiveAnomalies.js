import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Shield, RefreshCw, Wifi, Eye, XCircle, CheckCircle, TrendingUp, Users } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

/**
 * LiveAnomalies - Real-time Proxy Detection Widget
 * 
 * Shows live anomaly detection status on dashboard.
 * Auto-refreshes every 5 seconds to catch proxy attempts in real-time.
 */
const LiveAnomalies = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [reviewing, setReviewing] = useState(null);

  const fetchAnomalies = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await axios.get('/api/anomalies', { params: { status: 'pending', t: Date.now() } });
      setAnomalies(res.data.anomalies || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch anomalies:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnomalies();
    // Real-time polling every 5 seconds
    const interval = setInterval(fetchAnomalies, 5000);
    return () => clearInterval(interval);
  }, [fetchAnomalies]);

  const handleReview = async (anomalyId, action) => {
    try {
      setReviewing(anomalyId);
      await axios.put(`/api/anomalies/${anomalyId}/review`, { action });
      toast.success(action === 'confirmed_proxy' ? '🚫 Proxy confirmed - attendance cancelled' : '✓ Marked as false positive');
      fetchAnomalies();
    } catch (error) {
      toast.error('Failed to review anomaly');
    } finally {
      setReviewing(null);
    }
  };

  const getCorrelationColor = (score) => {
    if (score >= 0.95) return 'text-red-600 bg-red-50';
    if (score >= 0.9) return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
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
              {anomalies.length > 0 ? `${anomalies.length} suspicious pattern${anomalies.length > 1 ? 's' : ''} detected` : 'No suspicious activity'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`flex items-center text-xs sm:text-sm ${anomalies.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
            <Wifi className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-pulse" />
            Live
          </div>
          <button
            onClick={fetchAnomalies}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Banner */}
      {anomalies.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-green-500 mx-auto mb-2" />
          <p className="text-green-800 font-medium text-sm sm:text-base">All Clear!</p>
          <p className="text-green-600 text-xs sm:text-sm">No proxy attendance detected</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
          {anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Severity & Time */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {anomaly.severity === 'critical' ? 'Critical' : 'Warning'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(anomaly.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {/* Students */}
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {anomaly.student_id_1}
                    </span>
                    <span className="text-gray-400">&</span>
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {anomaly.student_id_2}
                    </span>
                  </div>
                  
                  {/* Correlation Score */}
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-red-500" />
                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${getCorrelationColor(anomaly.correlation_score)}`}>
                      ρ = {anomaly.correlation_score?.toFixed(3)}
                    </span>
                    <span className="text-xs text-gray-500">correlation</span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => handleReview(anomaly.id, 'confirmed_proxy')}
                    disabled={reviewing === anomaly.id}
                    className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
                    title="Confirm as Proxy (Cancel Attendance)"
                  >
                    <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <button
                    onClick={() => handleReview(anomaly.id, 'false_positive')}
                    disabled={reviewing === anomaly.id}
                    className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50"
                    title="Mark as False Positive"
                  >
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
              
              {/* Warning Message */}
              <div className="mt-2 pt-2 border-t border-red-200">
                <p className="text-xs text-red-700">
                  ⚠️ These students have highly correlated RSSI patterns - possible proxy attendance
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Last Update */}
      {lastUpdate && (
        <p className="text-xs text-gray-400 text-center mt-3">
          Updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default LiveAnomalies;
