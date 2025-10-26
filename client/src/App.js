import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './auth/Login';
import Register from './auth/Register';
import ForgotPassword from './auth/ForgotPassword';
import ResetPassword from './auth/ResetPassword';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './teacher/layout/Layout';
import Dashboard from './teacher/dashboard/Dashboard';
import Students from './teacher/students/Students';
import Classes from './teacher/classes/Classes';
import Attendance from './teacher/attendance/Attendance';
import LoadingSpinner from './teacher/common/LoadingSpinner';
import ClassesAdmin from './components/admin/ClassesAdmin';
import ConnectionStatus from './components/ConnectionStatus';
import axios from 'axios';

function AppRoutes() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Simple, separate Admin UI (distinct from teacher Layout)
  const AdminPage = () => {
    const [loadingAdmin, setLoadingAdmin] = useState(true);
    const [summary, setSummary] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [students, setStudents] = useState([]);
    const [teacherSearch, setTeacherSearch] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [creatingTeacher, setCreatingTeacher] = useState(false);
    const [newTeacher, setNewTeacher] = useState({ name: '', email: '', password: '' });
    const [creatingStudent, setCreatingStudent] = useState(false);
    const [newStudent, setNewStudent] = useState({ student_id: '', name: '', email: '', year: '1', section: 'A' });
    const { logout, user } = useAuth();
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentDetail, setStudentDetail] = useState(null);
    const [loadingStudent, setLoadingStudent] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
      let active = true;
      (async () => {
        try {
          const res = await axios.get('/api/admin/overview');
          if (!active) return;
          console.log('Admin overview response:', res.data);
          setSummary(res.data.summary);
          setTeachers(res.data.teachers || []);
          setStudents(res.data.students || []);
        } catch (e) {
          // Ignore axios cancellation errors from interceptors
          if (axios.isCancel?.(e) || e?.code === 'ERR_CANCELED') {
            if (active) setLoadingAdmin(false);
            return;
          }
          console.error('Error fetching admin overview:', e);
          // Set empty arrays to prevent filter errors
          setTeachers([]);
          setStudents([]);
        } finally {
          if (active) setLoadingAdmin(false);
        }
      })();
      return () => { active = false; };
    }, []);
    
    // Update time every second
    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      
      return () => {
        clearInterval(timer);
      };
    }, []);

    if (loadingAdmin) {
      return <LoadingSpinner />;
    }

    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
        <header className="relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-800 via-blue-700 to-indigo-900 opacity-95" />
          <svg aria-hidden className="absolute -top-10 right-0 h-48 w-48 text-indigo-400 opacity-30" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="currentColor"/></svg>
          <svg aria-hidden className="absolute bottom-0 left-0 h-32 w-32 text-blue-400 opacity-20" viewBox="0 0 200 200"><path d="M45.5,35.8c-17.2,17.2-17.2,45.1,0,62.3s45.1,17.2,62.3,0s17.2-45.1,0-62.3S62.7,18.6,45.5,35.8z" fill="currentColor"/></svg>
          <div className="relative max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 text-white">
            <div className="flex items-start gap-5">
              <div className="h-16 w-16 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg flex items-center justify-center text-xl font-bold border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight">Admin Dashboard</h1>
                <div className="text-sm md:text-base text-indigo-100/90">Welcome, {user?.name || 'Admin'} · {user?.email}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs px-3 py-1 rounded-full bg-white/15 border border-white/20 shadow-sm">Secure · JWT</span>
                  <span className="text-xs px-3 py-1 rounded-full bg-white/15 border border-white/20 shadow-sm">In‑memory demo</span>
                </div>
              </div>
            </div>
            <div className="mt-2 md:mt-0 flex flex-col items-end bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20 shadow-lg">
              <div className="text-2xl font-semibold tracking-tight">
                {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
              </div>
              <div className="text-sm text-indigo-100/90">
                {currentTime.toLocaleDateString([], {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={logout} className="px-5 py-2.5 text-sm font-medium rounded-lg bg-white/10 text-white hover:bg-white/20 border border-white/20 shadow-sm transition-all duration-200 hover:shadow-md flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Log out
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-6 space-y-8 -mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl shadow-md ring-1 ring-gray-100 p-5 hover:shadow-lg transition-all duration-300">
              <div className="text-sm font-medium text-gray-600">Quick Actions</div>
              <div className="mt-3 flex gap-3">
                <button onClick={()=>document.getElementById('teacher-name')?.focus()} className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 shadow-sm hover:shadow-md transition-all duration-300">Add Teacher</button>
                <button onClick={()=>document.getElementById('student-id')?.focus()} className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-900 hover:to-black shadow-sm hover:shadow-md transition-all duration-300">Add Student</button>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md ring-1 ring-gray-100 p-5 hidden sm:block hover:shadow-lg transition-all duration-300">
              <div className="text-sm font-medium text-gray-600">System Mode</div>
              <div className="mt-3 text-sm text-gray-700 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                Demo mode is active for local development
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md ring-1 ring-gray-100 p-5 hidden sm:block hover:shadow-lg transition-all duration-300">
              <div className="text-sm font-medium text-gray-600">System Status</div>
              <div className="mt-3 text-sm text-gray-700 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                API reachable · Database connected · UI synced
              </div>
            </div>
          </div>
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-indigo-700"></div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Teachers</div>
                    <div className="text-4xl font-bold text-gray-900">{summary.teacherCount}</div>
                    <div className="mt-2 text-xs text-gray-500">Active faculty members</div>
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-blue-700"></div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Students</div>
                    <div className="text-4xl font-bold text-gray-900">{summary.studentCount}</div>
                    <div className="mt-2 text-xs text-gray-500">Enrolled in all classes</div>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-purple-700"></div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-1">Classes</div>
                    <div className="text-4xl font-bold text-gray-900">{summary.classCount}</div>
                    <div className="mt-2 text-xs text-gray-500">Active courses</div>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Classes Admin Component */}
          <ClassesAdmin />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Teachers panel */}
              <section className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Teachers</h2>
                </div>
                <div className="relative w-full sm:w-auto">
                  <input 
                    value={teacherSearch} 
                    onChange={(e)=>setTeacherSearch(e.target.value)} 
                    placeholder="Search teachers..." 
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add New Teacher
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="teacher-name" className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                    <input 
                      id="teacher-name"
                      value={newTeacher.name} 
                      onChange={(e)=>setNewTeacher({...newTeacher,name:e.target.value})} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                      placeholder="John Doe" 
                    />
                  </div>
                  <div>
                    <label htmlFor="teacher-email" className="block text-xs font-medium text-gray-500 mb-1">Email Address</label>
                    <input 
                      id="teacher-email"
                      value={newTeacher.email} 
                      onChange={(e)=>setNewTeacher({...newTeacher,email:e.target.value})} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                      placeholder="john.doe@example.com" 
                    />
                  </div>
                  <div>
                    <label htmlFor="teacher-password" className="block text-xs font-medium text-gray-500 mb-1">Password</label>
                    <input 
                      id="teacher-password"
                      value={newTeacher.password} 
                      onChange={(e)=>setNewTeacher({...newTeacher,password:e.target.value})} 
                      type="password" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                      placeholder="••••••••" 
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      disabled={creatingTeacher} 
                      onClick={async()=>{
                        if (!newTeacher.name || !newTeacher.email || !newTeacher.password) {
                          toast.error('Please fill name, email and temporary password');
                          return;
                        }
                        try {
                          setCreatingTeacher(true);
                          await axios.post('/api/auth/register',{ email:newTeacher.email, password:newTeacher.password, name:newTeacher.name, role:'teacher' });
                          toast.success('Teacher added');
                          setNewTeacher({ name:'', email:'', password:'' });
                          const res = await axios.get('/api/admin/overview');
                          setTeachers(res.data.teachers||[]);
                          setSummary(res.data.summary);
                        } catch (e) {
                          const msg = e.response?.data?.error || 'Failed to add teacher';
                          toast.error(msg);
                        } finally { setCreatingTeacher(false); }
                      }} 
                      className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {creatingTeacher ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          Add Teacher
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">Teacher List</h3>
                  <span className="text-xs text-gray-500">{teachers.length} total</span>
                </div>
                <div className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
                  {teachers.filter(t=>`${t.name} ${t.email}`.toLowerCase().includes(teacherSearch.toLowerCase())).map(t => (
                    <div key={t._id || t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{t.name}</div>
                          <div className="text-sm text-gray-500">{t.email}</div>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">Teacher</span>
                    </div>
                  ))}
                  {teachers.length === 0 && (
                    <div className="p-6 text-sm text-gray-500 text-center">No teachers found</div>
                  )}
                </div>
              </div>
            </section>

            {/* Students panel */}
            <section className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Students</h2>
                </div>
                <div className="relative w-full sm:w-auto">
                  <input 
                    value={studentSearch} 
                    onChange={(e)=>setStudentSearch(e.target.value)} 
                    placeholder="Search students..." 
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add New Student
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="student-id" className="block text-xs font-medium text-gray-500 mb-1">Student ID</label>
                    <input 
                      id="student-id" 
                      value={newStudent.student_id} 
                      onChange={(e)=>setNewStudent({...newStudent,student_id:e.target.value})} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                      placeholder="STU12345" 
                    />
                  </div>
                  <div>
                    <label htmlFor="student-name" className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                    <input 
                      id="student-name"
                      value={newStudent.name} 
                      onChange={(e)=>setNewStudent({...newStudent,name:e.target.value})} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                      placeholder="Jane Doe" 
                    />
                  </div>
                  <div>
                    <label htmlFor="student-email" className="block text-xs font-medium text-gray-500 mb-1">Email (Optional)</label>
                    <input 
                      id="student-email"
                      value={newStudent.email} 
                      onChange={(e)=>setNewStudent({...newStudent,email:e.target.value})} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                      placeholder="jane.doe@example.com" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="student-year" className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                      <input 
                        id="student-year"
                        value={newStudent.year} 
                        onChange={(e)=>setNewStudent({...newStudent,year:e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                        placeholder="1" 
                      />
                    </div>
                    <div>
                      <label htmlFor="student-section" className="block text-xs font-medium text-gray-500 mb-1">Section</label>
                      <input 
                        id="student-section"
                        value={newStudent.section} 
                        onChange={(e)=>setNewStudent({...newStudent,section:e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" 
                        placeholder="A" 
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <button 
                      disabled={creatingStudent} 
                      onClick={async()=>{
                        if (!newStudent.student_id || !newStudent.name || !newStudent.year || !newStudent.section) {
                          toast.error('Student ID, name, year and section are required');
                          return;
                        }
                        try {
                          setCreatingStudent(true);
                          await axios.post('/api/students', newStudent);
                          toast.success('Student added');
                          setNewStudent({ student_id:'', name:'', email:'', year:'1', section:'A' });
                          const res = await axios.get('/api/admin/overview');
                          setStudents(res.data.students||[]);
                          setSummary(res.data.summary);
                        } catch (e) {
                          const msg = e.response?.data?.error || 'Failed to add student';
                          toast.error(msg);
                        } finally { setCreatingStudent(false); }
                      }} 
                      className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {creatingStudent ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                          </svg>
                          Add Student
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">Student List</h3>
                  <span className="text-xs text-gray-500">{students.length} total</span>
                </div>
                <div className="divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
                  {students.filter(s=>`${s.name} ${s.email||''}`.toLowerCase().includes(studentSearch.toLowerCase())).map(s => (
                    <button 
                      key={s._id || s.id} 
                      onClick={async()=>{
                        setSelectedStudent(s);
                        setLoadingStudent(true);
                        try {
                          // Show basic info immediately
                          setStudentDetail({
                            student: {
                              id: s._id || s.id,
                              name: s.name,
                              email: s.email || '',
                              studentId: s.studentId || s.student_id || '',
                              year: s.year || '',
                              section: s.section || ''
                            },
                            classes: [],
                            attendance: [],
                            summary: { totalSessions: 0, present: 0, absent: 0 }
                          });
                          const res = await axios.get(`/api/admin/student/${s._id || s.id}`);
                          setStudentDetail(res.data);
                        } catch (e) {
                          // Keep basic info if request fails
                        } finally {
                          setLoadingStudent(false);
                        }
                      }} 
                      className="w-full text-left p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{s.name}</div>
                        <div className="text-sm text-gray-500">{s.email || '—'}</div>
                      </div>
                    </button>
                  ))}
                  {students.length === 0 && (
                    <div className="p-6 text-sm text-gray-500 text-center">No students found</div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Student detail drawer */}
          {selectedStudent && (
            <div className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={()=>{ setSelectedStudent(null); setStudentDetail(null); }} />
              <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl ring-1 ring-gray-100 p-6 overflow-y-auto rounded-l-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedStudent.name}</h3>
                  </div>
                  <button onClick={()=>{ setSelectedStudent(null); setStudentDetail(null); }} className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-all duration-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                {loadingStudent && 
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-sm text-gray-600">Loading student data...</span>
                  </div>
                }
                {studentDetail && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <div className="text-xs text-blue-600 font-medium mb-1">Student Profile</div>
                      <div className="text-sm">{studentDetail.student.email}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="text-xs text-gray-500 font-medium">Student ID</div>
                        <div className="text-sm font-semibold">{studentDetail.student.studentId}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="text-xs text-gray-500 font-medium">Year</div>
                        <div className="text-sm font-semibold">{studentDetail.student.year}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="text-xs text-gray-500 font-medium">Section</div>
                        <div className="text-sm font-semibold">{studentDetail.student.section}</div>
                      </div>
                    </div>

                    <div className="border-t pt-5">
                      <h4 className="text-sm font-semibold mb-3 text-gray-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        Enrolled Classes
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {studentDetail.classes.map(c => (
                          <span key={c.id} className="text-xs px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">{c.name}</span>
                        ))}
                        {studentDetail.classes.length === 0 && 
                          <div className="w-full text-center py-4 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p>No classes enrolled</p>
                          </div>
                        }
                      </div>
                    </div>

                    <div className="border-t pt-5">
                      <h4 className="text-sm font-semibold mb-3 text-gray-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Attendance Summary
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100 shadow-sm">
                          <div className="text-xs text-gray-600 font-medium">Present</div>
                          <div className="text-lg font-bold text-green-700">{studentDetail.summary.present}</div>
                        </div>
                        <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100 shadow-sm">
                          <div className="text-xs text-gray-600 font-medium">Absent</div>
                          <div className="text-lg font-bold text-red-700">{studentDetail.summary.absent}</div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100 shadow-sm">
                          <div className="text-xs text-gray-600 font-medium">Total</div>
                          <div className="text-lg font-bold text-gray-800">{studentDetail.summary.totalSessions}</div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-5">
                      <h4 className="text-sm font-semibold mb-3 text-gray-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        Attendance Logs
                      </h4>
                      <div className="max-h-64 overflow-y-auto border rounded-xl divide-y shadow-sm">
                        {studentDetail.attendance.map((a, idx) => (
                          <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="text-sm font-medium">{a.class_id}</div>
                            <span className={`text-xs px-3 py-1 rounded-full ${a.status==='present'?'bg-green-100 text-green-700 border border-green-200':'bg-red-100 text-red-700 border border-red-200'}`}>{a.status}</span>
                          </div>
                        ))}
                        {studentDetail.attendance.length === 0 && (
                          <div className="px-3 py-8 text-sm text-gray-500 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p>No attendance records available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  };

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/dashboard" />} />
      <Route path="/reset-password" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/dashboard" />} />
      
      <Route path="/" element={isAuthenticated && user?.role !== 'admin' ? <ProtectedRoute><Layout /></ProtectedRoute> : <Navigate to={isAuthenticated ? '/admin' : '/login'} />}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="classes" element={<Classes />} />
        <Route path="attendance" element={<Attendance />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={isAuthenticated && user?.role === 'admin' ? <ProtectedRoute><AdminPage /></ProtectedRoute> : <Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <AppRoutes />
        <ConnectionStatus />
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;
