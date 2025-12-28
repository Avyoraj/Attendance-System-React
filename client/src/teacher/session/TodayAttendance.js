import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Clock, XCircle, Users, RefreshCw, Wifi } from 'lucide-react';
import axios from 'axios';

/**
 * TodayAttendance - Simplified Demo Component
 * 
 * Shows ALL today's attendance without needing session activation.
 * Perfect for demo: one class, one device, one teacher.
 * 
 * Flow: Student opens app → detects beacon → auto check-in → shows here
 */
const TodayAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({ total: 0, confirmed: 0, provisional: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAttendance = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await axios.get('/api/attendance/today-all', { params: { t: Date.now() } });
      
      setAttendance(res.data.attendance || []);
      setSummary(res.data.summary || { total: 0, confirmed: 0, provisional: 0, cancelled: 0 });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
    
    // Auto-refresh every 10 seconds for live updates
    const interval = setInterval(fetchAttendance, 10000);
    return () => clearInterval(interval);
  }, [fetchAttendance]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmed
          </span>
        );
      case 'provisional':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Provisional
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 col-span-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Today's Attendance</h3>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Live indicator */}
          <div className="flex items-center text-sm text-green-600">
            <Wifi className="w-4 h-4 mr-1 animate-pulse" />
            Live
          </div>
          
          <button
            onClick={fetchAttendance}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{summary.total}</p>
          <p className="text-xs text-blue-600 font-medium">Total</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{summary.confirmed}</p>
          <p className="text-xs text-green-600 font-medium">Confirmed</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{summary.provisional}</p>
          <p className="text-xs text-yellow-600 font-medium">Provisional</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{summary.cancelled}</p>
          <p className="text-xs text-red-600 font-medium">Cancelled</p>
        </div>
      </div>

      {/* Attendance List */}
      {attendance.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">No attendance yet</p>
          <p className="text-gray-600">Students will appear here when they check in via the app</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {attendance.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  record.status === 'confirmed' ? 'bg-green-100' :
                  record.status === 'provisional' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <span className="text-sm font-bold text-gray-700">
                    {record.studentName?.charAt(0) || record.studentId?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{record.studentName || record.studentId}</p>
                  <p className="text-sm text-gray-500">{record.studentId}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">{formatTime(record.checkInTime)}</p>
                  {record.rssi && (
                    <p className="text-xs text-gray-400">RSSI: {record.rssi} dBm</p>
                  )}
                </div>
                {getStatusBadge(record.status)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Last update */}
      {lastUpdate && (
        <p className="text-xs text-gray-400 text-center mt-4">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default TodayAttendance;
