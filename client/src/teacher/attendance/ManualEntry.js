import React, { useState, useEffect } from 'react';
import { UserPlus, Calendar, BookOpen, CheckCircle, Loader2, Search } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const ManualEntry = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    studentId: '',
    classId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, classesRes] = await Promise.all([
        axios.get('/api/students'),
        axios.get('/api/sessions/classes')
      ]);
      
      const studentsData = studentsRes.data.students || studentsRes.data || [];
      setStudents(studentsData.map(s => ({
        ...s,
        studentId: s.student_id || s.studentId
      })));
      
      const classesData = classesRes.data.classes || classesRes.data || [];
      setClasses(classesData.map(c => ({
        ...c,
        classId: c.class_id || c.classId
      })));
    } catch (error) {
      if (error.code !== 'ERR_CANCELED') {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.studentId || !formData.classId || !formData.date) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post('/api/attendance/manual', formData);
      toast.success('Attendance recorded successfully');
      
      // Reset form
      setFormData({
        studentId: '',
        classId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        notes: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to record attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.studentId || s.student_id)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Manual Attendance Entry</h3>
              <p className="text-blue-100 text-sm">Add or update attendance records manually</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Student *
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Choose a student...</option>
              {filteredStudents.map((student) => (
                <option key={student.studentId || student.student_id} value={student.studentId || student.student_id}>
                  {student.name} ({student.studentId || student.student_id})
                </option>
              ))}
            </select>
          </div>

          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="inline h-4 w-4 mr-1" />
              Select Class *
            </label>
            <select
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Choose a class...</option>
              {classes.map((cls) => (
                <option key={cls.classId || cls.class_id} value={cls.classId || cls.class_id}>
                  {cls.name} {cls.subject ? `(${cls.subject})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attendance Status *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['present', 'absent', 'excused'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFormData({ ...formData, status })}
                  className={`px-4 py-3 rounded-xl border-2 font-medium capitalize transition-all ${
                    formData.status === status
                      ? status === 'present'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : status === 'absent'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this entry..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            <span>{submitting ? 'Recording...' : 'Record Attendance'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManualEntry;
