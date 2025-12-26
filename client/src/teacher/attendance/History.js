import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Download, 
  Filter, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const History = () => {
  const [attendance, setAttendance] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState({ total: 0, confirmed: 0, cancelled: 0 });
  
  const [filters, setFilters] = useState({
    classId: '',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    searchTerm: ''
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [filters.classId, filters.startDate, filters.endDate]);

  const fetchClasses = async () => {
    try {
      const res = await axios.get('/api/sessions/classes');
      const classesData = res.data.classes || res.data || [];
      setClasses(classesData.map(c => ({
        ...c,
        classId: c.class_id || c.classId
      })));
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate
      };
      if (filters.classId) params.classId = filters.classId;

      const res = await axios.get('/api/attendance/history', { params });
      
      const records = (res.data.attendance || []).map(a => ({
        ...a,
        studentId: a.student_id || a.studentId,
        classId: a.class_id || a.classId,
        checkInTime: a.check_in_time || a.checkInTime,
        confirmedAt: a.confirmed_at || a.confirmedAt,
        sessionDate: a.session_date || a.sessionDate
      }));
      
      setAttendance(records);
      setSummary(res.data.summary || { total: records.length, confirmed: 0, cancelled: 0 });
    } catch (error) {
      if (error.code !== 'ERR_CANCELED') {
        console.error('Failed to fetch history:', error);
        toast.error('Failed to load attendance history');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (attendance.length === 0) {
      toast.error('No data to export');
      return;
    }

    setExporting(true);
    
    // Create CSV content
    const headers = ['Date', 'Student ID', 'Class', 'Status', 'Check-in Time', 'Confirmed At'];
    const rows = attendance.map(a => [
      a.sessionDate || a.session_date,
      a.studentId || a.student_id,
      a.classId || a.class_id,
      a.status,
      a.checkInTime ? new Date(a.checkInTime).toLocaleString() : '',
      a.confirmedAt ? new Date(a.confirmedAt).toLocaleString() : ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${filters.startDate}_to_${filters.endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    setExporting(false);
    toast.success('CSV exported successfully');
  };

  const filteredAttendance = attendance.filter(a => {
    if (!filters.searchTerm) return true;
    const search = filters.searchTerm.toLowerCase();
    return (
      (a.studentId || a.student_id)?.toLowerCase().includes(search) ||
      (a.classId || a.class_id)?.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </span>
        );
      case 'provisional':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="h-3 w-3 mr-1" />
            Provisional
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
          <p className="text-gray-600">View and export attendance records</p>
        </div>
        
        <button
          onClick={handleExportCSV}
          disabled={exporting || attendance.length === 0}
          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={filters.classId}
              onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.classId || cls.class_id} value={cls.classId || cls.class_id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student ID..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Records</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <p className="text-sm text-green-600">Confirmed</p>
          <p className="text-2xl font-bold text-green-700">{summary.confirmed}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <p className="text-sm text-amber-600">Provisional</p>
          <p className="text-2xl font-bold text-amber-700">{summary.provisional || 0}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <p className="text-sm text-red-600">Cancelled</p>
          <p className="text-2xl font-bold text-red-700">{summary.cancelled}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="text-center py-12">
            <FileSpreadsheet className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No attendance records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manual</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttendance.map((record, index) => (
                  <tr key={record.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.sessionDate || record.session_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.studentId || record.student_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.classId || record.class_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.is_manual ? '✓' : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
