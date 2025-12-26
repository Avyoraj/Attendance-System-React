import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye,
  Loader2,
  TrendingUp,
  Users,
  Calendar,
  Activity
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const AnomalyReview = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchAnomalies();
  }, [filter]);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/anomalies', { params: { status: filter } });
      setAnomalies(res.data.anomalies || res.data || []);
    } catch (error) {
      // Don't show error for canceled requests or 404
      if (error.code !== 'ERR_CANCELED') {
        console.error('Failed to fetch anomalies:', error);
        if (error.response?.status !== 404) {
          toast.error('Failed to load anomalies');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (anomalyId, action) => {
    try {
      setReviewing(true);
      await axios.put(`/api/anomalies/${anomalyId}/review`, { action });
      toast.success(`Anomaly marked as ${action.replace('_', ' ')}`);
      fetchAnomalies();
      setSelectedAnomaly(null);
    } catch (error) {
      toast.error('Failed to update anomaly');
    } finally {
      setReviewing(false);
    }
  };

  const getSeverityBadge = (severity) => {
    if (severity === 'critical') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Critical
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Warning
      </span>
    );
  };

  const getCorrelationColor = (score) => {
    if (score >= 0.9) return 'text-red-600';
    if (score >= 0.8) return 'text-amber-600';
    return 'text-green-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Anomaly Review</h1>
          <p className="text-gray-600">Review flagged proxy attendance patterns</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {['pending', 'confirmed_proxy', 'false_positive', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status === 'all' ? '' : status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                (filter === status || (filter === '' && status === 'all'))
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Activity className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">About Correlation Analysis</h3>
            <p className="text-sm text-gray-600 mt-1">
              The system analyzes RSSI (signal strength) patterns from student devices. 
              When two students have highly correlated patterns (ρ ≥ 0.9), it may indicate 
              proxy attendance (one person carrying multiple phones).
            </p>
          </div>
        </div>
      </div>

      {/* Anomalies List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : anomalies.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Anomalies Found</h3>
          <p className="text-gray-600">
            {filter === 'pending' 
              ? 'No pending anomalies to review. Great job!'
              : 'No anomalies match the current filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getSeverityBadge(anomaly.severity)}
                    <span className="text-sm text-gray-500">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      {anomaly.session_date}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Students Involved</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{anomaly.student_id_1}</span>
                        <span className="text-gray-400">&</span>
                        <span className="font-medium">{anomaly.student_id_2}</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Class</p>
                      <p className="font-medium mt-1">{anomaly.class_id}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Correlation Score</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <TrendingUp className={`h-4 w-4 ${getCorrelationColor(anomaly.correlation_score)}`} />
                        <span className={`text-xl font-bold ${getCorrelationColor(anomaly.correlation_score)}`}>
                          ρ = {anomaly.correlation_score?.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setSelectedAnomaly(anomaly)}
                    className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  
                  {anomaly.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleReview(anomaly.id, 'confirmed_proxy')}
                        disabled={reviewing}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Confirm as Proxy"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleReview(anomaly.id, 'false_positive')}
                        disabled={reviewing}
                        className="p-2 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Mark as False Positive"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {anomaly.status !== 'pending' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className={`text-sm font-medium ${
                    anomaly.status === 'confirmed_proxy' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    Status: {anomaly.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  {anomaly.reviewed_at && (
                    <span className="text-sm text-gray-500 ml-4">
                      Reviewed: {new Date(anomaly.reviewed_at).toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Anomaly Details</h3>
                <button
                  onClick={() => setSelectedAnomaly(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Student 1</p>
                  <p className="font-semibold text-lg">{selectedAnomaly.student_id_1}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Student 2</p>
                  <p className="font-semibold text-lg">{selectedAnomaly.student_id_2}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-2">Correlation Analysis</p>
                <div className="flex items-center space-x-4">
                  <span className={`text-3xl font-bold ${getCorrelationColor(selectedAnomaly.correlation_score)}`}>
                    ρ = {selectedAnomaly.correlation_score?.toFixed(4)}
                  </span>
                  <div className="text-sm text-gray-600">
                    <p>• ρ ≥ 0.9: High likelihood of proxy</p>
                    <p>• ρ 0.7-0.9: Suspicious pattern</p>
                    <p>• ρ &lt; 0.7: Normal variation</p>
                  </div>
                </div>
              </div>
              
              {/* RSSI Chart Placeholder */}
              <div className="bg-gray-100 rounded-xl p-8 text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">RSSI Time-Series Chart</p>
                <p className="text-sm text-gray-400">Coming soon - will show signal patterns for both students</p>
              </div>
              
              {selectedAnomaly.notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Notes</p>
                  <p className="text-gray-700">{selectedAnomaly.notes}</p>
                </div>
              )}
            </div>
            
            {selectedAnomaly.status === 'pending' && (
              <div className="p-6 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={() => handleReview(selectedAnomaly.id, 'confirmed_proxy')}
                  disabled={reviewing}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  Confirm as Proxy
                </button>
                <button
                  onClick={() => handleReview(selectedAnomaly.id, 'false_positive')}
                  disabled={reviewing}
                  className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
                >
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
