import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BookOpen, Plus, Search, Edit, Trash2, Users, Calendar, RefreshCw, Download, X, GraduationCap } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const now = Date.now();
      const [classesRes, studentsRes] = await Promise.all([
        axios.get('/api/classes', { params: { t: now }, cache: false }),
        axios.get('/api/students', { params: { t: now }, cache: false }),
      ]);

      // Normalize classes (support both array and {classes: []}) and fields
      const rawClasses = Array.isArray(classesRes.data) ? classesRes.data : (classesRes.data.classes || []);
      const normalizedClasses = rawClasses.map(c => ({
        ...c,
        id: c.id || c._id,
        created_at: c.created_at || c.createdAt || c.created_at,
      }));
      setClasses(normalizedClasses);

      // Normalize students: handle both array and object response formats
      const studentsData = studentsRes.data;
      const rawStudents = Array.isArray(studentsData) ? studentsData : (studentsData.students || studentsData || []);
      const normalizedStudents = rawStudents.map(s => ({
        ...s,
        subjects: Array.isArray(s.subjects) ? s.subjects.map(x => x?.toString()) : [],
      }));
      setStudents(normalizedStudents);
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

  const onSubmit = async (data) => {
    try {
      if (editingClass) {
        // Update existing class
        await axios.put(`/api/classes/${editingClass.id}`, { name: data.name });
        toast.success('Class updated successfully');
      } else {
        // Create new class
        await axios.post('/api/classes', { name: data.name });
        toast.success('Class created successfully');
      }
      
      fetchData();
      handleCloseForm();
    } catch (error) {
      const message = error.response?.data?.error || 'Operation failed';
      toast.error(message);
    }
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    reset({
      name: cls.name,
    });
    setShowForm(true);
  };

  const handleDelete = async (classId) => {
    if (window.confirm('Are you sure you want to delete this class? This will also remove all associated students.')) {
      try {
        await axios.delete(`/api/classes/${classId}`);
        toast.success('Class deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete class');
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingClass(null);
    reset();
  };

  const getStudentCount = (classId) => {
    const classIdStr = (classId || '').toString();
    return students.filter(student => Array.isArray(student.subjects) && student.subjects
      .some(sub => (sub || '').toString() === classIdStr)).length;
  };

  const exportClasses = () => {
    const csvContent = [
      ['Class Name', 'Student Count', 'Created Date'],
      ...filteredClasses.map(cls => [
        cls.name,
        getStudentCount(cls.id),
        new Date(cls.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'classes.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Classes exported successfully!');
  };

  const filteredClasses = classes
    .filter(cls => cls.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'student_count':
          return getStudentCount(b.id) - getStudentCount(a.id);
        case 'created_at':
          return new Date(b.created_at) - new Date(a.created_at);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Class Management</h1>
          <p className="text-gray-600">Manage course classes and student assignments</p>
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
            onClick={exportClasses}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Class
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {classes.filter(c => {
                  const monthAgo = new Date();
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  return new Date(c.created_at) > monthAgo;
                }).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Search className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Filtered</p>
              <p className="text-2xl font-bold text-gray-900">{filteredClasses.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search classes by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
            >
              <option value="name">Sort by Name</option>
              <option value="student_count">Sort by Student Count</option>
              <option value="created_at">Sort by Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls) => (
          <div key={cls.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(cls)}
                  className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(cls.id)}
                  className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">{cls.name}</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Students</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {getStudentCount(cls.id)} enrolled
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Created</span>
                <span className="text-sm text-gray-500">
                  {new Date(cls.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">No classes found</p>
          <p className="text-gray-600">Try adjusting your search or create a new class</p>
        </div>
      )}

      {/* Enhanced Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingClass ? 'Edit Class' : 'Create New Class'}
                </h2>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class Name</label>
                  <input
                    type="text"
                    {...register('name', { required: 'Class name is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    placeholder="Enter class name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* teacher_id is determined on the server; omit from form */}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {editingClass ? 'Update' : 'Create'} Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
