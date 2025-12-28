import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const StudentProfiles = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/students`);
      // Map Supabase snake_case to camelCase for frontend
      const mappedStudents = (response.data || []).map(s => ({
        id: s.student_id || s.id, // Use student_id as the display ID
        uuid: s.id, // Keep UUID for internal reference
        name: s.name || '',
        email: s.email || '',
        year: s.year || '',
        section: s.section || '',
        department: s.department || '',
        deviceId: s.device_id,
        isActive: s.is_active,
        createdAt: s.created_at
      }));
      setStudents(mappedStudents);
    } catch (error) {
      if (error.code !== 'ERR_CANCELED') {
        toast.error('Failed to load students');
        console.error('Failed to fetch students:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleEdit = (student) => {
    setEditingStudent(student.id);
    setEditForm({
      name: student.name || '',
      email: student.email || '',
      year: student.year || '1',
      section: student.section || 'A',
      department: student.department || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingStudent(null);
    setEditForm({});
  };

  const handleSaveProfile = async (studentId) => {
    try {
      setSaving(true);
      await axios.put(`${API_BASE}/students/${studentId}/profile/admin`, editForm);
      toast.success(`Profile updated for ${studentId}`);
      setEditingStudent(null);
      setEditForm({});
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
      console.error('Update profile error:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completeProfiles = filteredStudents.filter(s => s.name && s.name.trim() !== '');
  const incompleteProfiles = filteredStudents.filter(s => !s.name || s.name.trim() === '');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Profiles</h1>
          <p className="text-gray-600 mt-1">
            View and edit student profile information
          </p>
        </div>
        <button
          onClick={fetchStudents}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by student ID, name, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{students.length}</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-700">{completeProfiles.length}</div>
          <div className="text-sm text-green-600">Complete Profiles</div>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="text-2xl font-bold text-amber-700">{incompleteProfiles.length}</div>
          <div className="text-sm text-amber-600">Incomplete Profiles</div>
        </div>
      </div>

      {/* Incomplete Profiles (show first) */}
      {incompleteProfiles.length > 0 && (
        <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
            <h2 className="font-semibold text-amber-900">
              ⚠️ Incomplete Profiles ({incompleteProfiles.length})
            </h2>
            <p className="text-sm text-amber-700 mt-1">
              These students haven't completed their profile setup yet
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {incompleteProfiles.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                isEditing={editingStudent === student.id}
                editForm={editForm}
                setEditForm={setEditForm}
                onEdit={() => handleEdit(student)}
                onCancel={handleCancelEdit}
                onSave={() => handleSaveProfile(student.id)}
                saving={saving}
              />
            ))}
          </div>
        </div>
      )}

      {/* Complete Profiles */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">
            All Students ({completeProfiles.length})
          </h2>
        </div>
        
        {completeProfiles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No students with complete profiles found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {completeProfiles.map((student) => (
              <StudentRow
                key={student.id}
                student={student}
                isEditing={editingStudent === student.id}
                editForm={editForm}
                setEditForm={setEditForm}
                onEdit={() => handleEdit(student)}
                onCancel={handleCancelEdit}
                onSave={() => handleSaveProfile(student.id)}
                saving={saving}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Student Row Component
const StudentRow = ({ student, isEditing, editForm, setEditForm, onEdit, onCancel, onSave, saving }) => {
  if (isEditing) {
    return (
      <div className="p-4 bg-indigo-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
            <input
              type="text"
              value={student.id}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="student@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={editForm.year}
              onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={editForm.section}
              onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {['A', 'B', 'C', 'D', 'E'].map(s => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <input
              type="text"
              value={editForm.department}
              onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Computer Science"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || !editForm.name?.trim()}
            className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex items-center justify-between hover:bg-gray-50">
      <div className="flex items-center space-x-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          student.name ? 'bg-indigo-100' : 'bg-gray-100'
        }`}>
          <svg className={`w-5 h-5 ${student.name ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <div className="font-medium text-gray-900">{student.id}</div>
          <div className="text-sm text-gray-500">
            {student.name || <span className="text-amber-600 italic">No name set</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right hidden md:block">
          <div className="text-sm text-gray-700">
            {student.year && student.section ? `Year ${student.year} - Section ${student.section}` : '-'}
          </div>
          <div className="text-xs text-gray-500">{student.department || '-'}</div>
        </div>
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
        >
          Edit
        </button>
      </div>
    </div>
  );
};

export default StudentProfiles;
