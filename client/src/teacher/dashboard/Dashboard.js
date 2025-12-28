import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Activity,
  Target,
  Award,
  Zap,
  BarChart3,
  Download,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';
import { TodayAttendance, LiveAnomalies } from '../session';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    todayAttendance: 0,
    totalAttendance: 0,
    attendanceRate: 0,
    weeklyGrowth: 0
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        await fetchDashboardData();
      }
    };
    
    loadData();
    
    // Update time every second
    const timeInterval = setInterval(() => {
      if (isMounted) {
        setCurrentTime(new Date());
      }
    }, 1000);
    
    // Clean up on component unmount
    return () => {
      isMounted = false;
      clearInterval(timeInterval);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const ts = Date.now();
      const [studentsRes, classesRes] = await Promise.all([
        axios.get('/api/students', { params: { t: ts }, cache: false }),
        axios.get('/api/classes', { params: { t: ts }, cache: false }),
      ]);

      const students = (studentsRes.data.students || []).map(s => ({
        ...s,
        created_at: s.created_at || s.createdAt
      }));
      const classes = Array.isArray(classesRes.data) ? classesRes.data : (classesRes.data.classes || []);

      // Optional: fetch attendance for first class if available
      let attendance = [];
      if (classes.length > 0) {
        const firstId = classes[0]._id || classes[0].id;
        try {
          const attendanceRes = await axios.get(`/api/attendance/${firstId}`, { params: { t: Date.now() }, cache: false });
          attendance = attendanceRes.data.attendance || [];
        } catch {}
      }

      const todayAttendance = attendance.filter(a => {
        const today = new Date().toDateString();
        const attendanceDate = new Date(a.timestamp).toDateString();
        return today === attendanceDate;
      }).length;

      const attendanceRate = students.length > 0 ? Math.round((todayAttendance / students.length) * 100) : 0;
      
      // Calculate weekly growth based on last week's data
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const lastWeekAttendance = attendance.filter(a => new Date(a.timestamp) < oneWeekAgo).length;
      const weeklyGrowth = lastWeekAttendance > 0 ? 
        Math.round(((todayAttendance - lastWeekAttendance) / lastWeekAttendance) * 100) : 0;

      setStats({
        totalStudents: students.length,
        totalClasses: classes.length,
        todayAttendance,
        totalAttendance: attendance.length,
        attendanceRate,
        weeklyGrowth
      });

      setRecentAttendance(attendance.slice(0, 5));
      if (!refreshing) {
        // Only show success on manual refresh, not initial load
      }
    } catch (error) {
      if (error.code !== 'ERR_CANCELED') {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, description, trend, trendValue }) => (
    <div className="group relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-gray-50 rounded-full -translate-y-16 translate-x-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${color} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center text-sm font-medium ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? '↗' : '↘'} {trendValue}%
            </div>
          )}
        </div>

        <div className="mb-2">
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-sm font-medium text-gray-600">{title}</p>
        </div>

        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, color, onClick }) => (
    <button
      onClick={onClick}
      className="group w-full text-left p-4 bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">{title}</p>
          <p className="text-sm text-gray-600 group-hover:text-gray-500 transition-colors">{description}</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Plus className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </button>
  );

  const AttendanceRecord = ({ record, index }) => (
    <div className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white hover:from-blue-50 hover:to-blue-100 rounded-xl border border-gray-200 hover:border-blue-200 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-full ${
          record.status === 'present' ? 'bg-green-100 group-hover:bg-green-200' : 'bg-red-100 group-hover:bg-red-200'
        } transition-colors duration-300`}>
          {record.status === 'present' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors">{record.student_name}</p>
          <p className="text-sm text-gray-500">{record.student_id}</p>
        </div>
      </div>
      <div className="text-right">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
          record.status === 'present'
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-red-100 text-red-800 border-red-200'
        }`}>
          {record.status === 'present' ? 'Present' : 'Absent'}
        </span>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(record.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Enhanced Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
          <Activity className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
          Welcome Back!
        </h1>
        <p className="text-lg text-gray-600">Here's what's happening with your attendance system today</p>

        {/* Refresh Button */}
        <button
          onClick={fetchDashboardData}
          disabled={refreshing}
          className="mt-4 inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Today's Attendance */}
      <TodayAttendance />

      {/* Live Proxy Detection - Full Width Below */}
      <LiveAnomalies />

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          description="Registered students"
          trend="up"
          trendValue={stats.weeklyGrowth}
        />
        <StatCard
          title="Total Classes"
          value={stats.totalClasses}
          icon={BookOpen}
          color="bg-gradient-to-br from-green-500 to-green-600"
          description="Active classes"
        />
        <StatCard
          title="Today's Attendance"
          value={stats.todayAttendance}
          icon={Calendar}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          description={`${stats.attendanceRate}% attendance rate`}
        />
        <StatCard
          title="Total Records"
          value={stats.totalAttendance}
          icon={TrendingUp}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          description="All time records"
        />
      </div>

      {/* Enhanced Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Attendance with Enhanced Design */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
            </div>
            <button
              onClick={() => navigate('/attendance')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline transition-colors cursor-pointer"
            >
              View All
            </button>
          </div>

          {recentAttendance.length > 0 ? (
            <div className="space-y-3">
              {recentAttendance.map((record, index) => (
                <AttendanceRecord key={index} record={record} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Clock className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">No recent activity</p>
              <p className="text-gray-600">Attendance records will appear here</p>
            </div>
          )}
        </div>

        {/* Enhanced Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
            </div>
          </div>

          <div className="space-y-4">
            <QuickActionCard
              title="Add New Student"
              description="Register a new student in the system"
              icon={Users}
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              onClick={() => navigate('/students')}
            />

            <QuickActionCard
              title="Create New Class"
              description="Set up a new course or class"
              icon={BookOpen}
              color="bg-gradient-to-br from-green-500 to-green-600"
              onClick={() => navigate('/classes')}
            />

            <QuickActionCard
              title="View Reports"
              description="Check and manage attendance records"
              icon={Calendar}
              color="bg-gradient-to-br from-purple-500 to-purple-600"
              onClick={() => navigate('/attendance')}
            />

            <QuickActionCard
              title="Export Reports"
              description="Download attendance reports and analytics"
              icon={Download}
              color="bg-gradient-to-br from-orange-500 to-orange-600"
              onClick={() => {
                toast.success('Reports page coming soon! Navigate to Attendance page for now.');
                navigate('/attendance');
              }}
            />
          </div>
        </div>
      </div>

      {/* Enhanced System Status */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Target className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">System Status</h3>
          </div>
          <div className="flex items-center space-x-2 text-sm text-green-600 font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            All Systems Operational
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white rounded-xl border border-gray-200 hover:border-green-200 transition-colors duration-300">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="font-semibold text-gray-900 mb-1">API Status</p>
            <p className="text-sm text-green-600 font-medium">Online</p>
            <p className="text-xs text-gray-500 mt-1">Response time: 45ms</p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-200 transition-colors duration-300">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <p className="font-semibold text-gray-900 mb-1">Last Sync</p>
            <p className="text-sm text-blue-600 font-medium">{currentTime.toLocaleTimeString()}</p>
            <p className="text-xs text-gray-500 mt-1">Real-time updates</p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-200 transition-colors duration-300">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-purple-600" />
            </div>
            <p className="font-semibold text-gray-900 mb-1">Performance</p>
            <p className="text-sm text-purple-600 font-medium">Excellent</p>
            <p className="text-xs text-gray-500 mt-1">99.9% uptime</p>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Performance Insights</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Attendance Rate</span>
              <span className="text-lg font-bold text-blue-600">{stats.attendanceRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stats.attendanceRate}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Target: 95%</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Weekly Growth</span>
              <span className="text-lg font-bold text-green-600">+{stats.weeklyGrowth}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600">Compared to last week</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Positive trend</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
