import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Users, Search, Edit, Trash2, UserPlus, BookOpen, Download, RefreshCw, X, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

const Students = () => {
  // Combined state for better management
  const [data, setData] = useState({
    students: [],
    classes: [],
    totalStudents: 0,
    totalPages: 1
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  
  // Filter and pagination state
  const [filters, setFilters] = useState({
    searchTerm: '',
    selectedClass: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
    currentPage: 1,
    pageSize: 10
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Destructure for easier access
  const { students, classes, totalStudents, totalPages } = data;
  const { searchTerm, selectedClass, sortBy, sortOrder, currentPage, pageSize } = filters;

  const fetchData = useCallback(async () => {
    const source = axios.CancelToken.source();
    
    try {
      setRefreshing(true);
      
      // Fetch classes (avoid cache)
      const classesRes = await axios.get('/api/classes', {
        cancelToken: source.token,
        params: { t: Date.now() },
        cache: false
      });
      
      // Fetch students with pagination parameters
      const studentsRes = await axios.get('/api/students', {
        cancelToken: source.token,
        params: {
          page: currentPage,
          limit: pageSize,
          sortBy,
          sortOrder,
          search: searchTerm || undefined,
          classId: selectedClass !== 'all' ? selectedClass : undefined
        }
      });

      const rawClasses = Array.isArray(classesRes.data) ? classesRes.data : (classesRes.data.classes || []);
      const normalizedClasses = rawClasses.map(c => ({ ...c, id: c.id || c._id }));

      // Handle both array and object response formats from backend
      const studentsData = studentsRes.data;
      const rawStudents = Array.isArray(studentsData) ? studentsData : (studentsData.students || studentsData || []);

      setData({
        students: rawStudents.map(s => ({
          ...s,
          subjects: Array.isArray(s.subjects) ? s.subjects.map(x => x?.toString()) : []
        })),
        classes: normalizedClasses,
        totalStudents: studentsRes.data.totalCount || rawStudents.length,
        totalPages: studentsRes.data.totalPages || 1
      });
    } catch (error) {
      if (!axios.isCancel(error)) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, pageSize, sortBy, sortOrder, searchTerm, selectedClass]);

  // Clean up function for useEffect
  useEffect(() => {
    const source = axios.CancelToken.source();
    let isMounted = true;

    // Fetch data when dependencies change
    const fetchDataWrapper = async () => {
      try {
        if (isMounted) {
          await fetchData();
        }
      } catch (error) {
        if (!axios.isCancel(error) && isMounted) {
          console.error('Error in fetchData:', error);
          toast.error('Failed to load data');
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    fetchDataWrapper();

    // Cleanup function
    return () => {
      isMounted = false;
      source.cancel('Component unmounted, request cancelled');
    };
  }, [currentPage, pageSize, sortBy, sortOrder, searchTerm, selectedClass]);

  const onSubmit = async (data) => {
    try {
      if (editingStudent) {
        // Update existing student
        const studentId = editingStudent._id || editingStudent.id;
        await axios.put(`/api/students/${studentId}`, data);
        toast.success('Student updated successfully');
      } else {
        // Create new student
        await axios.post('/api/students', data);
        toast.success('Student created successfully');
      }
      
      fetchData();
      handleCloseForm();
    } catch (error) {
      const message = error.response?.data?.error || 'Operation failed';
      toast.error(message);
    }
  };

  // Handler functions
  const handleEdit = (student) => {
    setEditingStudent(student);
    reset({
      student_id: student.studentId || student.student_id,
      name: student.name,
      email: student.email,
      year: student.year?.toString(),
      section: student.section,
      subjects: student.subjects || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await axios.delete(`/api/students/${studentId}`);
        toast.success('Student deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete student');
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingStudent(null);
    reset();
  };

  const exportStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/students', {
        params: {
          limit: 1000,
          sortBy,
          sortOrder,
          search: searchTerm || undefined,
          classId: selectedClass !== 'all' ? selectedClass : undefined
        }
      });
      
      const studentsToExport = response.data.students || [];
      
      const csvContent = [
        ['Student ID', 'Name', 'Class', 'Created Date'],
        ...studentsToExport.map(student => [
          student.student_id || student.studentId,
          student.name,
          classes.find(c => c.id === student.class_id)?.name || 'Unknown',
          new Date(student.created_at).toLocaleDateString()
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Students exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export students');
    } finally {
      setLoading(false);
    }
  };

  // Filter handlers - simplified to update all filters at once
  const updateFilters = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change, unless explicitly changing page
      currentPage: newFilters.hasOwnProperty('currentPage') ? newFilters.currentPage : 1
    }));
  };

  // Computed properties
  const filteredStudents = students || [];
  const thisMonthStudents = filteredStudents.filter(s => {
    try {
      if (!s.created_at) return false;
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return new Date(s.created_at) > monthAgo;
    } catch (e) {
      console.error('Error processing student date:', e);
      return false;
    }
  }).length;

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Management</h1>
          <p className="text-gray-600">Manage student registrations and information</p>
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
            onClick={exportStudents}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Student
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-xl">
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Classes</p>
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-xl">
              <UserPlus className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{thisMonthStudents}</p>
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
              <p className="text-2xl font-bold text-gray-900">{filteredStudents.length}</p>
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
                placeholder="Search students by name or ID..."
                value={searchTerm}
                onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedClass}
              onChange={(e) => updateFilters({ selectedClass: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => updateFilters({ sortBy: e.target.value })}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
            >
              <option value="name">Sort by Name</option>
              <option value="student_id">Sort by ID</option>
              <option value="created_at">Sort by Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled Subjects</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student._id || student.id || student.studentId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.studentId || student.student_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {student.subjects && student.subjects.length > 0 ? (
                        student.subjects.map((subjectId, index) => {
                          const subject = classes.find(c => c.id === subjectId || c._id === subjectId);
                          return subject ? (
                            <span key={`${subjectId}-${index}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {subject.name}
                            </span>
                          ) : null;
                        })
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          No subjects enrolled
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(student.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(student)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student._id || student.id)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
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
        
        {/* Pagination Controls */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between">
          <div className="text-sm text-gray-700 mb-4 sm:mb-0">
            Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalStudents)}</span> of{' '}
            <span className="font-medium">{totalStudents}</span> students
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={pageSize}
              onChange={(e) => updateFilters({ pageSize: Number(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
            
            <button
              onClick={() => updateFilters({ currentPage: currentPage - 1 })}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <span className="px-4 py-2 rounded-lg bg-white border border-gray-300">
              {currentPage} / {totalPages}
            </span>
            
            <button
              onClick={() => updateFilters({ currentPage: currentPage + 1 })}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                  <input
                    type="text"
                    {...register('student_id', { required: 'Student ID is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    placeholder="Enter student ID"
                  />
                  {errors.student_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.student_id.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    {...register('name', { required: 'Name is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    placeholder="Enter student name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    placeholder="Enter email (optional - auto-generated if empty)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                    <select
                      {...register('year', { required: 'Year is required' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    >
                      <option value="">Select year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                    {errors.year && (
                      <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                    <select
                      {...register('section', { required: 'Section is required' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    >
                      <option value="">Select section</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                    {errors.section && (
                      <p className="mt-1 text-sm text-red-600">{errors.section.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subjects</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-xl p-3 bg-gray-50">
                    {classes.map((subject) => (
                      <label key={subject._id || subject.id} className="flex items-center space-x-3 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          value={subject._id || subject.id}
                          {...register('subjects')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">{subject.name}</span>
                        <span className="text-xs text-gray-500">({subject.course_code || 'N/A'})</span>
                      </label>
                    ))}
                    {classes.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No subjects available</p>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Select multiple subjects for enrollment</p>
                </div>

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
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {editingStudent ? 'Update' : 'Create'} Student
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

export default Students;
