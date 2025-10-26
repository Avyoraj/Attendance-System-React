import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, GraduationCap, Shield, ClipboardCheck, BarChart2, Bell } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, register: registerUser } = useAuth();

  // Admin form
  const {
    register: registerAdmin,
    handleSubmit: handleSubmitAdmin,
    formState: { errors: adminErrors },
    reset: resetAdminForm
  } = useForm();
  const [adminLoading, setAdminLoading] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  // Auth wizard state (signup or login)
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1: role, 2: details, 3: done (signup only)
  const [wizardRole, setWizardRole] = useState(null); // 'admin' | 'teacher'
  const [wizardMode, setWizardMode] = useState('signup'); // 'signup' | 'login'
  const {
    register: registerWizard,
    handleSubmit: handleSubmitWizard,
    formState: { errors: wizardErrors },
    reset: resetWizard
  } = useForm();
  const {
    register: registerAdminSignup,
    handleSubmit: handleSubmitAdminSignup,
    formState: { errors: adminSignupErrors }
  } = useForm();
  // Separate teacher signup form to avoid conflicts
  const {
    register: registerTeacherSignup,
    handleSubmit: handleSubmitTeacherSignup,
    formState: { errors: teacherSignupErrors }
  } = useForm();

  // Teacher form
  const {
    register: registerTeacher,
    handleSubmit: handleSubmitTeacher,
    formState: { errors: teacherErrors },
    reset: resetTeacherForm
  } = useForm();
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);
  const [showTeacherForm, setShowTeacherForm] = useState(false);

  const [wizardShowPassword, setWizardShowPassword] = useState(false);

  const openWizard = (role, mode = 'signup') => {
    setWizardOpen(true);
    setWizardMode(mode);
    setWizardRole(role || null);
    setWizardStep(role ? 2 : 1);
    resetWizard();
    setWizardShowPassword(false);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    setWizardStep(1);
    setWizardRole(null);
    resetWizard();
  };

  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardError, setWizardError] = useState('');
  const [wizardEmailStatus, setWizardEmailStatus] = useState(null);
  const [wizardEmailPreview, setWizardEmailPreview] = useState('');

  const onSubmitAdmin = async (data) => {
    setAdminLoading(true);
    const result = await login(data.email, data.password, 'admin');
    if (result.success) {
      navigate('/admin');
      resetAdminForm({ email: '', password: '' });
    }
    setAdminLoading(false);
  };

  const onSubmitTeacher = async (data) => {
    setTeacherLoading(true);
    const result = await login(data.email, data.password, 'teacher');
    if (result.success) {
      navigate('/dashboard');
      resetTeacherForm({ email: '', password: '' });
    }
    setTeacherLoading(false);
  };

  const onSubmitAdminSignup = async (data) => {
    setAdminLoading(true);
    const { email, name, password } = data;
    const res = await registerUser(email, password, name, 'admin');
    setAdminLoading(false);
    return res;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        {/* Hero header with animations */}
          <div className="text-center mb-10">
            <div className="mx-auto h-20 w-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-xl flex items-center justify-center transform transition-all duration-500 hover:scale-110 hover:rotate-6 animate-fadeIn">
              <GraduationCap className="h-10 w-10 text-white animate-float" />
            </div>
            <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 animate-fadeIn animation-delay-300">Attendance System</h1>
            <p className="mt-4 text-base md:text-xl text-gray-600 max-w-2xl mx-auto animate-fadeIn animation-delay-500">Streamlined attendance tracking for educational institutions</p>
          </div>
        {/* Auth Wizard Overlay */}
        {wizardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={closeWizard} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{wizardMode === 'login' ? 'Sign in' : 'Create Account'}</h3>
                <button onClick={closeWizard} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              <div className="flex items-center gap-2 mb-6 text-xs text-gray-600">
                <span className={`px-2 py-1 rounded ${wizardStep>=1?'bg-indigo-600 text-white':'bg-gray-100'}`}>1</span>
                <span className="font-medium">{wizardRole ? (wizardRole==='admin'?'Admin':'Teacher') : 'Choose role'}</span>
                <span className="mx-1">→</span>
                <span className={`px-2 py-1 rounded ${wizardStep>=2?'bg-indigo-600 text-white':'bg-gray-100'}`}>2</span>
                <span className="font-medium">{wizardMode === 'login' ? 'Credentials' : 'Details'}</span>
                {wizardMode !== 'login' && (
                  <>
                    <span className="mx-1">→</span>
                    <span className={`px-2 py-1 rounded ${wizardStep===3?'bg-indigo-600 text-white':'bg-gray-100'}`}>3</span>
                    <span className="font-medium">Done</span>
                  </>
                )}
              </div>

              {wizardStep === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Select what you’re signing up as.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { setWizardRole('admin'); setWizardStep(2); }} className="border rounded-xl px-4 py-3 hover:bg-gray-50 text-gray-900">Admin</button>
                    <button onClick={() => { setWizardRole('teacher'); setWizardStep(2); }} className="border rounded-xl px-4 py-3 hover:bg-gray-50 text-gray-900">Teacher</button>
                  </div>
                </div>
              )}

              {wizardStep === 2 && wizardMode === 'signup' && (
                <form className="space-y-4" onSubmit={handleSubmitWizard(async (data) => {
                  setWizardError('');
                  setWizardLoading(true);
                  const { name, email, password } = data;
                  const res = await registerUser(email, password, name, wizardRole || 'teacher');
                  setWizardLoading(false);
                  if (res?.success) {
                    // Try to read email status from server response if available on axios (interceptor doesn't strip)
                    try {
                      const lastResponse = window.__LAST_SIGNUP_RESPONSE__; // optional placeholder if wired
                      if (lastResponse?.data?.emailStatus) {
                        setWizardEmailStatus(lastResponse.data.emailStatus);
                        setWizardEmailPreview(lastResponse.data.emailPreview || '');
                      }
                    } catch {}
                    setWizardStep(3);
                  } else if (res?.error) {
                    setWizardError(res.error);
                  } else {
                    setWizardError('Registration failed. Please try again.');
                  }
                })}>
                  <div className="text-sm text-gray-600">Signing up as <span className="font-medium text-gray-900">{wizardRole === 'admin' ? 'Admin' : 'Teacher'}</span></div>
                  {wizardError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{wizardError}</div>}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" {...registerWizard('name', { required: 'Name is required' })} className="w-full border rounded-xl px-3 py-2" placeholder="Your Name" />
                    {wizardErrors.name && <p className="mt-1 text-sm text-red-600">{wizardErrors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" autoComplete="username" {...registerWizard('email', { required: 'Email is required' })} className="w-full border rounded-xl px-3 py-2" placeholder="you@example.com" />
                    {wizardErrors.email && <p className="mt-1 text-sm text-red-600">{wizardErrors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <input type={wizardShowPassword ? 'text' : 'password'} autoComplete="new-password" {...registerWizard('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })} className="w-full border rounded-xl px-3 py-2 pr-10" placeholder="Password" />
                      <button type="button" onClick={() => setWizardShowPassword(!wizardShowPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {wizardShowPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {wizardErrors.password && <p className="mt-1 text-sm text-red-600">{wizardErrors.password.message}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setWizardStep(1)} className="flex-1 border rounded-xl px-4 py-2 hover:bg-gray-50" disabled={wizardLoading}>Back</button>
                    <button type="submit" disabled={wizardLoading} className="flex-1 bg-indigo-600 text-white rounded-xl px-4 py-2 hover:bg-indigo-700 disabled:opacity-50">{wizardLoading ? 'Creating...' : 'Create Account'}</button>
                  </div>
                </form>
              )}

              {wizardStep === 2 && wizardMode === 'login' && (
                <form className="space-y-4" onSubmit={handleSubmitWizard(async (data) => {
                  setWizardError('');
                  setWizardLoading(true);
                  const { email, password } = data;
                  const res = await login(email, password, wizardRole || 'teacher');
                  setWizardLoading(false);
                  if (res?.success) {
                    closeWizard();
                    if ((wizardRole || 'teacher') === 'admin') {
                      navigate('/admin');
                    } else {
                      navigate('/dashboard');
                    }
                  } else if (res?.error) {
                    setWizardError(res.error);
                  } else {
                    setWizardError('Login failed. Please try again.');
                  }
                })}>
                  <div className="text-sm text-gray-600">Signing in as <span className="font-medium text-gray-900">{wizardRole === 'admin' ? 'Admin' : 'Teacher'}</span></div>
                  {wizardError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{wizardError}</div>}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" autoComplete="username" {...registerWizard('email', { required: 'Email is required' })} className="w-full border rounded-xl px-3 py-2" placeholder="you@example.com" />
                    {wizardErrors.email && <p className="mt-1 text-sm text-red-600">{wizardErrors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <input type={wizardShowPassword ? 'text' : 'password'} autoComplete="current-password" {...registerWizard('password', { required: 'Password is required' })} className="w-full border rounded-xl px-3 py-2 pr-10" placeholder="Password" />
                      <button type="button" onClick={() => setWizardShowPassword(!wizardShowPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {wizardShowPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {wizardErrors.password && <p className="mt-1 text-sm text-red-600">{wizardErrors.password.message}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setWizardStep(1)} className="flex-1 border rounded-xl px-4 py-2 hover:bg-gray-50" disabled={wizardLoading}>Back</button>
                    <button type="submit" disabled={wizardLoading} className="flex-1 bg-gray-900 text-white rounded-xl px-4 py-2 hover:bg-black disabled:opacity-50">{wizardLoading ? 'Signing in...' : 'Sign in'}</button>
                  </div>
                  <div className="text-center mt-2">
                    <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700">Forgot password?</Link>
                  </div>
                </form>
              )}

              {wizardStep === 3 && (
                <div className="text-center space-y-4">
                  <div className="mx-auto h-12 w-12 bg-green-600 text-white rounded-full flex items-center justify-center">✓</div>
                  <h4 className="text-lg font-semibold text-gray-900">Account created!</h4>
                  <p className="text-sm text-gray-600">You can now sign in to your {wizardRole === 'admin' ? 'Admin' : 'Teacher'} portal.</p>
                  {wizardEmailStatus && (
                    <div className={`text-sm rounded-lg p-2 border ${wizardEmailStatus.success ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                      {wizardEmailStatus.success ? `Welcome email sent${wizardEmailStatus.provider ? ' via ' + wizardEmailStatus.provider : ''}.` : 'Welcome email could not be sent automatically.'}
                    </div>
                  )}
                  {!wizardEmailStatus && wizardEmailPreview && (
                    <div className="text-sm rounded-lg p-2 border bg-yellow-50 text-yellow-700 border-yellow-200">Email preview available below.</div>
                  )}
                  {wizardEmailPreview && (
                    <details className="text-left bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <summary className="cursor-pointer text-sm text-gray-700">Show welcome email preview</summary>
                      <div className="mt-2 text-xs text-gray-700" dangerouslySetInnerHTML={{ __html: wizardEmailPreview }} />
                    </details>
                  )}
                  <button onClick={() => { setWizardMode('login'); setWizardStep(2); }} className="w-full bg-gray-900 text-white rounded-xl px-4 py-2 hover:bg-black">Continue to Login</button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 mt-12 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Professional card design with subtle pattern */}
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] opacity-10"></div>
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 h-16 w-16 bg-gradient-to-br from-indigo-100 to-transparent rounded-bl-3xl opacity-70"></div>
            <div className="absolute bottom-0 left-0 h-16 w-16 bg-gradient-to-tr from-purple-100 to-transparent rounded-tr-3xl opacity-70"></div>
            
            {/* Enhanced decorative vertical divider on desktop */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-indigo-300 to-transparent" aria-hidden="true" />
            <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md z-10 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            </div>
            <div className="hidden md:block absolute left-1/2 top-1/4 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-400"></div>
            <div className="hidden md:block absolute left-1/2 top-3/4 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-purple-400"></div>
          {/* Admin side with distinct visual elements */}
          <section className="px-4 md:pr-12 relative">
            {/* Admin decorative elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-3xl -z-10 opacity-70"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-indigo-50 rounded-tr-2xl -z-10 opacity-50"></div>
            
            <div className="mb-6 relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-indigo-600/10 text-indigo-700 text-xs font-semibold px-4 py-1.5 border border-indigo-200 shadow-sm">
                <Shield className="h-4 w-4" />
                <span>ADMIN PORTAL</span>
              </div>
              <h2 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Administration</h2>
              <p className="mt-2 text-gray-600">Manage teachers, students, and monitor attendance data</p>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <button
                type="button"
                onClick={() => openWizard('admin','login')}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3.5 text-base font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg shadow-md group"
              >
                <Lock className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                <span className="relative">Login
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => openWizard('admin')}
                className="inline-flex items-center justify-center rounded-xl bg-white text-indigo-700 px-6 py-3.5 text-base font-semibold border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md shadow-sm group"
              >
                <span className="relative">Sign up
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
                </span>
              </button>
            </div>

            {/* Admin quick signup hint */}
            {!showAdminForm && (
              <div className="mt-3 text-sm text-gray-600">
                Don't have an account?{' '}
                <button type="button" onClick={() => openWizard('admin')} className="text-blue-600 hover:text-blue-700 font-medium">Sign up.</button>
              </div>
            )}

            

            {showAdminForm && (
              <div className="mt-6 bg-white rounded-2xl shadow-lg ring-1 ring-gray-100 p-6 transition-all duration-200 hover:shadow-xl">
            <div className="flex items-center mb-4">
              <div className="p-2 rounded-lg bg-blue-600 text-white mr-3">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Admin Sign in</h3>
                <p className="text-sm text-gray-500">Access the admin console</p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmitAdmin(onSubmitAdmin)}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    {...registerAdmin('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    placeholder="admin@attendance.com"
                  />
                </div>
                {adminErrors.email && <p className="mt-1 text-sm text-red-600">{adminErrors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    {...registerAdmin('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    placeholder="Enter your password"
                  />
                  <button type="button" onClick={() => setShowAdminPassword(!showAdminPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showAdminPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {adminErrors.password && <p className="mt-1 text-sm text-red-600">{adminErrors.password.message}</p>}
              </div>

                  <button type="submit" disabled={adminLoading} className="w-full flex justify-center items-center px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50">
                {adminLoading ? 'Signing in...' : 'Sign in as Admin'}
              </button>

                  <div className="text-center">
                    <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">Forgot password?</Link>
                  </div>

              <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="font-medium">Demo Admin</div>
                <div>Email: admin@attendance.com</div>
                <div>Password: password123</div>
              </div>

                  <div className="pt-2 text-center text-sm text-gray-600">Don't have an admin account? <button type="button" onClick={() => openWizard('admin')} className="text-blue-600 hover:text-blue-700 font-medium">Create one</button></div>
                </form>
                
              </div>
            )}
          </section>

          {/* Teacher side with distinct visual elements */}
          <section className="px-4 md:pl-12 relative">
            {/* Teacher decorative elements */}
            <div className="absolute top-0 left-0 w-24 h-24 bg-purple-50 rounded-br-3xl -z-10 opacity-70"></div>
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-purple-50 rounded-tl-2xl -z-10 opacity-50"></div>
            
            <div className="mb-6 relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500/10 to-purple-600/10 text-purple-700 text-xs font-semibold px-4 py-1.5 border border-purple-200 shadow-sm">
                <GraduationCap className="h-4 w-4" />
                <span>TEACHER PORTAL</span>
              </div>
              <h2 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Classroom Management</h2>
              <p className="mt-2 text-gray-600">Track attendance, manage students, and generate reports</p>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <button
                type="button"
                onClick={() => openWizard('teacher','login')}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3.5 text-base font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg shadow-md group"
              >
                <Lock className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                <span className="relative">Login
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => openWizard('teacher')}
                className="inline-flex items-center justify-center rounded-xl bg-white text-purple-700 px-6 py-3.5 text-base font-semibold border border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md shadow-sm group"
              >
                <span className="relative">Sign up
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
                </span>
              </button>
            </div>

            <div className="mt-8 text-sm text-gray-600">
              <span>Don't have an account?</span>{' '}
              <button type="button" onClick={() => openWizard('teacher')} className="text-green-700 hover:text-green-800 font-medium">Sign up.</button>
          </div>

            {showTeacherForm && (
              <div className="mt-6 bg-white rounded-2xl shadow-lg ring-1 ring-gray-100 p-6 transition-all duration-200 hover:shadow-xl">
            <div className="flex items-center mb-4">
              <div className="p-2 rounded-lg bg-purple-600 text-white mr-3">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Teacher Sign in</h3>
                <p className="text-sm text-gray-500">Access the teacher dashboard</p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmitTeacher(onSubmitTeacher)}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    {...registerTeacher('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    placeholder="demo@teacher.com"
                  />
                </div>
                {teacherErrors.email && <p className="mt-1 text-sm text-red-600">{teacherErrors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showTeacherPassword ? 'text' : 'password'}
                    {...registerTeacher('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                    placeholder="Enter your password"
                  />
                  <button type="button" onClick={() => setShowTeacherPassword(!showTeacherPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showTeacherPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {teacherErrors.password && <p className="mt-1 text-sm text-red-600">{teacherErrors.password.message}</p>}
              </div>

                  <button type="submit" disabled={teacherLoading} className="w-full flex justify-center items-center px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50">
                {teacherLoading ? 'Signing in...' : 'Sign in as Teacher'}
              </button>

                  <div className="text-center">
                    <Link to="/forgot-password" className="text-sm text-purple-600 hover:text-purple-700">Forgot password?</Link>
                  </div>

              <div className="text-xs text-purple-700 bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="font-medium">Demo Teacher</div>
                <div>Email: demo@teacher.com</div>
                <div>Password: password123</div>
              </div>
            </form>
              </div>
            )}

            {/* Teacher signup moved to wizard */}
            </section>
          </div>
        
          {/* Feature highlights section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn animation-delay-700">
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <ClipboardCheck className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Attendance Tracking</h3>
            <p className="text-gray-600">Quickly mark attendance and generate detailed reports with just a few clicks.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart2 className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Insightful Analytics</h3>
            <p className="text-gray-600">Visualize attendance patterns and identify trends with comprehensive analytics.</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Automated Notifications</h3>
            <p className="text-gray-600">Send automated alerts to parents and administrators about attendance status.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
