import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Clock, XCircle, Users, RefreshCw, Wifi, Download, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

/**
 * TodayAttendance - Simplified Demo Component (Mobile Responsive)
 * 
 * Shows ALL today's attendance without needing session activation.
 * Perfect for demo: one class, one device, one teacher.
 */
const TodayAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({ total: 0, confirmed: 0, provisional: 0, flagged: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAttendance = useCallback(async (signal) => {
    try {
      setRefreshing(true);
      const res = await axios.get('/api/attendance/today-all', { 
        params: { t: Date.now() },
        signal 
      });
      
      // Handle both wrapped and direct array responses
      const attendanceData = Array.isArray(res.data) 
        ? res.data 
        : (res.data.attendance || []);
      const summaryData = res.data.summary || { 
        total: attendanceData.length, 
        confirmed: attendanceData.filter(a => a.status === 'confirmed').length,
        provisional: attendanceData.filter(a => a.status === 'provisional').length,
        flagged: attendanceData.filter(a => a.status === 'flagged').length,
        cancelled: attendanceData.filter(a => a.status === 'cancelled').length
      };
      
      setAttendance(attendanceData);
      setSummary(summaryData);
      setLastUpdate(new Date());
    } catch (error) {
      // Ignore abort errors (happens on cleanup or duplicate request cancellation)
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAttendance(controller.signal);
    const interval = setInterval(() => fetchAttendance(controller.signal), 10000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchAttendance]);

  const exportToCSV = () => {
    if (attendance.length === 0) {
      toast.error('No attendance data to export');
      return;
    }

    const headers = ['Student ID', 'Student Name', 'Status', 'Check-in Time', 'Confirmed At', 'RSSI'];
    const rows = attendance.map(r => [
      r.studentId,
      r.studentName || r.studentId,
      r.status,
      r.checkInTime ? new Date(r.checkInTime).toLocaleString() : '-',
      r.confirmedAt ? new Date(r.confirmedAt).toLocaleString() : '-',
      r.rssi || '-'
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Attendance exported!');
  };

  const getStatusBadge = (status) => {
    const badges = {
      confirmed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Confirmed' },
      provisional: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Provisional' },
      flagged: { bg: 'bg-orange-100', text: 'text-orange-800', icon: AlertTriangle, label: '🚨 Flagged' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Cancelled' }
    };
    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock, label: status };
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3 mr-1 hidden sm:inline" />
        <span className="hidden sm:inline">{badge.label}</span>
        <span className="sm:hidden">{badge.label.charAt(0)}</span>
      </span>
    );
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4">
            {[1,2,3,4].map(i => <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>)}
          </div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">Today's Attendance</h3>
            <p className="text-xs sm:text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3">
          <div className="flex items-center text-xs sm:text-sm text-green-600">
            <Wifi className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-pulse" />
            Live
          </div>
          
          <button
            onClick={exportToCSV}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Export CSV"
          >
            <Download className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          
          <button
            onClick={fetchAttendance}
            disabled={refreshing}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Stats - Mobile: 2x2 grid, Desktop: 5 cols */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-blue-50 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{summary.total}</p>
          <p className="text-xs text-blue-600 font-medium">Total</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-green-600">{summary.confirmed}</p>
          <p className="text-xs text-green-600 font-medium">Confirmed</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-yellow-600">{summary.provisional}</p>
          <p className="text-xs text-yellow-600 font-medium">Provisional</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-orange-600">{summary.flagged || 0}</p>
          <p className="text-xs text-orange-600 font-medium">🚨 Flagged</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-xl sm:text-2xl font-bold text-red-600">{summary.cancelled}</p>
          <p className="text-xs text-red-600 font-medium">Cancelled</p>
        </div>
      </div>

      {/* Attendance List - Mobile Optimized */}
      {attendance.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-gray-500">
          <Users className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-300 mb-3 sm:mb-4" />
          <p className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">No attendance yet</p>
          <p className="text-sm text-gray-600">Students appear here when they check in</p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
          {attendance.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  record.status === 'confirmed' ? 'bg-green-100' :
                  record.status === 'provisional' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <span className="text-xs sm:text-sm font-bold text-gray-700">
                    {record.studentName?.charAt(0) || record.studentId?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                    {record.studentName || record.studentId}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{record.studentId}</p>
                  {record.status === 'cancelled' && record.cancellationReason && (
                    <p className="text-xs text-red-500 truncate mt-0.5 font-medium">
                      Reason: {record.cancellationReason}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-sm text-gray-600">{formatTime(record.checkInTime)}</p>
                  {record.rssi && <p className="text-xs text-gray-400">{record.rssi} dBm</p>}
                </div>
                <div className="text-right sm:hidden">
                  <p className="text-xs text-gray-500">{formatTime(record.checkInTime)}</p>
                </div>
                {getStatusBadge(record.status)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Last update */}
      {lastUpdate && (
        <p className="text-xs text-gray-400 text-center mt-3 sm:mt-4">
          Updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

export default TodayAttendance;
