import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, GraduationCap, ClipboardCheck, BarChart2, Wifi } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, register: registerUser } = useAuth();
  
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    
    try {
      if (mode === 'login') {
        const result = await login(data.email, data.password, 'teacher');
        if (result.success) {
          navigate('/dashboard');
        } else {
          setError(result.error || 'Login failed. Please check your credentials.');
        }
      } else {
        const result = await registerUser(data.email, data.password, data.name, 'teacher');
        if (result.success) {
          setMode('login');
          setError('');
          reset();
          // Show success message
          alert('Account created! You can now sign in.');
        } else {
          setError(result.error || 'Registration failed. Please try again.');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
    
    setLoading(false);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-lg flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">BLE Attendance System</h1>
          <p className="mt-2 text-gray-600">Teacher Dashboard</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  {...register('name', { required: mode === 'signup' ? 'Name is required' : false })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Your Name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' }
                  })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: { value: 6, message: 'At least 6 characters' }
                  })}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
            >
              {loading ? (mode === 'login' ? 'Signing in...' : 'Creating account...') : (mode === 'login' ? 'Sign in' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={switchMode}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {mode === 'login' && (
            <div className="mt-4 text-center">
              <Link to="/forgot-password" className="text-sm text-gray-500 hover:text-gray-700">
                Forgot password?
              </Link>
            </div>
          )}
        </div>

        {/* Feature highlights */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white/50 rounded-xl">
            <Wifi className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
            <p className="text-xs text-gray-600">BLE Proximity</p>
          </div>
          <div className="text-center p-4 bg-white/50 rounded-xl">
            <ClipboardCheck className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-xs text-gray-600">Auto Attendance</p>
          </div>
          <div className="text-center p-4 bg-white/50 rounded-xl">
            <BarChart2 className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-xs text-gray-600">Analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
