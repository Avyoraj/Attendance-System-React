import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Use axios defaults baseURL (set in AuthContext) - calls should include /api prefix
const DeviceBindings = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resettingId, setResettingId] = useState(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/students');
      setStudents(response.data || []);
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

  const handleResetDevice = async (studentId) => {
    if (!window.confirm(`Reset device binding for student ${studentId}?\n\nThis will allow them to login from a new device.`)) {
      return;
    }

    try {
      setResettingId(studentId);
      await axios.post(`/api/students/${studentId}/reset-device`);
      toast.success(`Device binding reset for ${studentId}`);
      fetchStudents();
    } catch (error) {
      toast.error('Failed to reset device binding');
      console.error('Reset device error:', error);
    } finally {
      setResettingId(null);
    }
  };

  const filteredStudents = students.filter(student => 
    student.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const boundStudents = filteredStudents.filter(s => s.device_id);
  const unboundStudents = filteredStudents.filter(s => !s.device_id);

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
          <h1 className="text-2xl font-bold text-gray-900">Device Bindings</h1>
          <p className="text-gray-600 mt-1">
            Manage student device bindings for attendance tracking
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
          placeholder="Search by student ID or name..."
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
          <div className="text-2xl font-bold text-green-700">{boundStudents.length}</div>
          <div className="text-sm text-green-600">Device Bound</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-700">{unboundStudents.length}</div>
          <div className="text-sm text-gray-600">Not Yet Bound</div>
        </div>
      </div>

      {/* Bound Students */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">
            Students with Device Binding ({boundStudents.length})
          </h2>
        </div>
        
        {boundStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No students with device bindings found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {boundStudents.map((student) => (
              <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{student.id}</div>
                    <div className="text-sm text-gray-500">{student.name || 'No name'}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-gray-500">Device ID</div>
                    <div className="text-sm font-mono text-gray-700 truncate max-w-[200px]">
                      {student.device_id?.substring(0, 16)}...
                    </div>
                  </div>
                  <button
                    onClick={() => handleResetDevice(student.id)}
                    disabled={resettingId === student.id}
                    className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50"
                  >
                    {resettingId === student.id ? 'Resetting...' : 'Reset'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unbound Students */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">
            Students Without Device ({unboundStudents.length})
          </h2>
        </div>
        
        {unboundStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            All students have device bindings
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {unboundStudents.map((student) => (
              <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{student.id}</div>
                    <div className="text-sm text-gray-500">{student.name || 'No name'}</div>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                  Not bound
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceBindings;
