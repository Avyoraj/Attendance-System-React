import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Users, CheckCircle, XCircle, Clock, Filter, Download, Eye, RefreshCw, BarChart3, TrendingUp, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [showStats, setShowStats] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchAttendance = useCallback(async () => {
    if (!selectedClass || !selectedDate) return;
    
    try {
      const response = await axios.get(`/api/attendance/${selectedClass}`, {
        params: { date: selectedDate }
      });
      
      const attendanceData = response.data.attendance || [];
      setAttendance(attendanceData);
      
      // Create comprehensive attendance list - match by student_id field
      const classStudents = students.filter(s => s.class_id === selectedClass || !s.class_id);
      const comprehensiveAttendance = classStudents.map(student => {
        // Match using student_id field (the string ID like "STU001")
        const studentIdToMatch = student.student_id || student.id;
        const existingRecord = attendanceData.find(a => 
          (a.student_id === studentIdToMatch) || (a.studentId === studentIdToMatch)
        );
        return {
          ...student,
          status: existingRecord?.status || 'absent',
          timestamp: existingRecord?.check_in_time || existingRecord?.checkInTime || existingRecord?.timestamp || null,
          attendance_id: existingRecord?.id || null,
        };
      });
      
      setFilteredAttendance(comprehensiveAttendance);
    } catch (error) {
      if (error.code !== 'ERR_CANCELED') {
        console.error('Failed to fetch attendance:', error);
        toast.error('Failed to load attendance data');
      }
    }
  }, [selectedClass, selectedDate, students]);

  useEffect(() => {
    fetchData();
    
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [classesRes, studentsRes] = await Promise.all([
        axios.get('/api/classes'),
        axios.get('/api/students'),
      ]);

      // Handle both array and object response formats from backend
      const classesData = classesRes.data;
      const parsedClasses = Array.isArray(classesData) ? classesData : (classesData.classes || classesData || []);
      
      const studentsData = studentsRes.data;
      const parsedStudents = Array.isArray(studentsData) ? studentsData : (studentsData.students || studentsData || []);

      setClasses(parsedClasses);
      setStudents(parsedStudents);
      
      if (parsedClasses.length > 0) {
        // Use class_id or id field
        setSelectedClass(parsedClasses[0].class_id || parsedClasses[0].id);
      }
    } catch (error) {
      if (error.code !== 'ERR_CANCELED') {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAttendance = async (studentId, status) => {
    try {
      const attendanceData = {
        student_id: studentId,
        class_id: selectedClass,
        status: status,
        timestamp: new Date().toISOString(),
      };

      if (attendance.find(a => a.student_id == studentId)) {
        // Update existing attendance
        await axios.put(`/api/attendance/${studentId}`, attendanceData);
        toast.success('Attendance updated successfully');
      } else {
        // Create new attendance record
        await axios.post('/api/attendance', attendanceData);
        toast.success('Attendance marked successfully');
      }
      
      fetchAttendance();
    } catch (error) {
      toast.error('Failed to mark attendance');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'late':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const exportAttendance = () => {
    const csvContent = [
      ['Student ID', 'Name', 'Status', 'Time', 'Date'],
      ...filteredAttendance.map(record => [
        record.student_id,
        record.name,
        record.status,
        record.timestamp ? new Date(record.timestamp).toLocaleTimeString() : 'Not marked',
        selectedDate
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Attendance exported successfully!');
  };

  const getAttendanceStats = () => {
    const total = filteredAttendance.length;
    const present = filteredAttendance.filter(a => a.status === 'present').length;
    const absent = filteredAttendance.filter(a => a.status === 'absent').length;
    const late = filteredAttendance.filter(a => a.status === 'late').length;
    const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, late, attendanceRate };
  };

  const filteredStudents = filteredAttendance.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = getAttendanceStats();

  return (
    <div className="space-y-6 p-6">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Management</h1>
          <p className="text-gray-600">Track and manage student attendance records</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={exportAttendance}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setShowStats(!showStats)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>
        </div>
      </div>

      {/* Attendance Stats */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Present</p>
                <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-xl">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Absent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="relative">
          <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search students by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Student Attendance - {selectedDate}</h3>
          <p className="text-sm text-gray-600">Click on status to mark attendance</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.student_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(student.status)}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(student.status)}`}>
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.timestamp ? new Date(student.timestamp).toLocaleTimeString() : 'Not marked'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => markAttendance(student.id, 'present')}
                        className={`p-2 rounded-lg transition-colors ${
                          student.status === 'present' 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => markAttendance(student.id, 'absent')}
                        className={`p-2 rounded-lg transition-colors ${
                          student.status === 'absent' 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => markAttendance(student.id, 'late')}
                        className={`p-2 rounded-lg transition-colors ${
                          student.status === 'late' 
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                            : 'text-yellow-600 hover:bg-yellow-50'
                        }`}
                      >
                        <Clock className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">No students found</p>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
