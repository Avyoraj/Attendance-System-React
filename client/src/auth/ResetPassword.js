import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data) => {
    setIsLoading(true);
    await resetPassword(data.email, data.code, data.password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl p-6 border">
        <h1 className="text-xl font-semibold mb-4">Reset Password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" {...register('email', { required: 'Email is required' })} className="w-full border rounded px-3 py-2" placeholder="you@example.com" />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Verification Code</label>
            <input type="text" {...register('code', { required: 'Code is required' })} className="w-full border rounded px-3 py-2" placeholder="6-digit code" />
            {errors.code && <p className="text-sm text-red-600 mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input type="password" {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })} className="w-full border rounded px-3 py-2" placeholder="New password" />
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white rounded px-4 py-2">{isLoading ? 'Resetting...' : 'Reset Password'}</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
