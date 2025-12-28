import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Download,
  UserCheck,
  UserX,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

/**
 * Live Attendance Component
 * 
 * Shows real-time attendance for the active session.
 * Auto-refreshes every 10 seconds.
 */
const LiveAttendance = ({ session }) => {
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState({ total: 0, confirmed: 0, provisional: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAttendance = useCallback(async () => {
    if (!session) return;

    try {
      setRefreshing(true);
      const sessionId = session.sessionId || session._id;
      const response = await axios.get(`/api/sessions/${sessionId}/attendance`);
      
      // Map Supabase snake_case to camelCase for frontend
      const mappedAttendance = (response.data.attendance || []).map(a => ({
        _id: a.id,
        studentId: a.student_id,
        classId: a.class_id,
        sessionId: a.session_id,
        deviceId: a.device_id,
        status: a.status,
        checkInTime: a.check_in_time,
        confirmedAt: a.confirmed_at,
        cancelledAt: a.cancelled_at,
        cancellationReason: a.cancellation_reason,
        rssi: a.rssi,
        distance: a.distance,
        beaconMajor: a.beacon_major,
        beaconMinor: a.beacon_minor,
        sessionDate: a.session_date,
        isManual: a.is_manual
      }));
      
      setAttendance(mappedAttendance);
      setSummary(response.data.summary || { total: 0, confirmed: 0, provisional: 0 });
    } catch (error) {
      if (error.code !== 'ERR_CANCELED') {
        console.error('Failed to fetch attendance:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchAttendance();
      
      // Auto-refresh every 10 seconds
      const interval = setInterval(fetchAttendance, 10000);
      return () => clearInterval(interval);
    }
  }, [session, fetchAttendance]);

  const handleExport = () => {
    if (attendance.length === 0) {
      toast.error('No attendance data to export');
      return;
    }

    // Create CSV content
    const headers = ['Student ID', 'Status', 'Check-in Time', 'Confirmed At', 'RSSI', 'Distance'];
    const rows = attendance.map(a => [
      a.studentId,
      a.status,
      new Date(a.checkInTime).toLocaleString(),
      a.confirmedAt ? new Date(a.confirmedAt).toLocaleString() : '-',
      a.rssi || '-',
      a.distance ? `${a.distance.toFixed(1)}m` : '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${session.className}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Attendance exported successfully');
  };

  if (!session) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Start a class to see live attendance</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Live Attendance</h3>
              <p className="text-sm text-gray-500">{session.className}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchAttendance}
              disabled={refreshing}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExport}
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Export CSV"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b border-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{summary.confirmed}</div>
          <div className="text-xs text-gray-500">Confirmed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">{summary.provisional}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="max-h-96 overflow-y-auto">
        {attendance.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Waiting for students to check in...</p>
            <p className="text-sm text-gray-400 mt-1">Attendance will appear here automatically</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {attendance.map((record, index) => (
              <div
                key={record._id || index}
                className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    record.status === 'confirmed' 
                      ? 'bg-green-100' 
                      : record.status === 'provisional'
                      ? 'bg-amber-100'
                      : 'bg-red-100'
                  }`}>
                    {record.status === 'confirmed' ? (
                      <UserCheck className="h-4 w-4 text-green-600" />
                    ) : record.status === 'provisional' ? (
                      <Clock className="h-4 w-4 text-amber-600" />
                    ) : (
                      <UserX className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{record.studentId}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(record.checkInTime).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    record.status === 'confirmed'
                      ? 'bg-green-100 text-green-800'
                      : record.status === 'provisional'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {record.status === 'confirmed' ? 'Confirmed' : 
                     record.status === 'provisional' ? 'Pending' : 'Cancelled'}
                  </span>
                  {record.rssi && (
                    <p className="text-xs text-gray-400 mt-1">
                      RSSI: {record.rssi} dBm
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="px-6 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          Auto-refreshes every 10 seconds
        </p>
      </div>
    </div>
  );
};

export default LiveAttendance;
