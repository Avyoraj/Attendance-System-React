import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Lock } from 'lucide-react';

const ForgotPassword = () => {
  const { forgotPassword, verifyResetCode, resetPassword } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setIsLoading] = useState(false);

  const [serverMessage, setServerMessage] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: reset, 4: done
  const [emailForReset, setEmailForReset] = useState('');
  const codeInputsRef = useRef([]);
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);

  useEffect(() => {
    if (step === 2 && codeInputsRef.current[0]) {
      codeInputsRef.current[0].focus();
    }
  }, [step]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerMessage('');
    setDemoCode('');
    const res = await forgotPassword(data.email);
    setIsLoading(false);
    if (res?.success) {
      setServerMessage('Verification code sent. Check your email.');
      setEmailForReset(data.email);
      setStep(2);
      if (res?.code) setDemoCode(res.code);
    }
  };

  const handleCodeChange = (index, value) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 1);
    const next = [...codeDigits];
    next[index] = sanitized;
    setCodeDigits(next);
    if (sanitized && index < 5 && codeInputsRef.current[index + 1]) {
      codeInputsRef.current[index + 1].focus();
    }
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      codeInputsRef.current[index - 1].focus();
    }
  };

  const handleCodePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = ['','','','','',''];
    for (let i = 0; i < text.length && i < 6; i++) next[i] = text[i];
    setCodeDigits(next);
  };

  const verifyCode = async () => {
    const code = codeDigits.join('');
    if (code.length !== 6) return;
    setIsLoading(true);
    const res = await verifyResetCode(emailForReset, code);
    setIsLoading(false);
    if (res?.success) {
      setServerMessage('Code verified. You can set a new password.');
      setStep(3);
    }
  };

  const { register: registerReset, handleSubmit: handleSubmitReset, formState: { errors: resetErrors } } = useForm();
  const [showNewPassword, setShowNewPassword] = useState(false);

  const onReset = async (data) => {
    const code = codeDigits.join('');
    setIsLoading(true);
    const res = await resetPassword(emailForReset, code, data.password);
    setIsLoading(false);
    if (res?.success) {
      setStep(4);
      setServerMessage('Password reset successful. You can now sign in.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl p-6 border">
        <h1 className="text-xl font-semibold mb-4">Forgot Password</h1>

        {step === 1 && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" {...register('email', { required: 'Email is required' })} className="w-full border rounded px-3 py-2" placeholder="you@example.com" />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50">{isLoading ? 'Sending...' : 'Send Code'}</button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="text-sm text-gray-700">We’ve sent a 6‑digit code to <span className="font-medium">{emailForReset}</span>.</div>
            <div className="flex justify-between gap-2" onPaste={handleCodePaste}>
              {codeDigits.map((d, idx) => (
                <input
                  key={idx}
                  ref={(el) => (codeInputsRef.current[idx] = el)}
                  value={d}
                  onChange={(e) => handleCodeChange(idx, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                  inputMode="numeric"
                  className="w-10 h-12 text-center border rounded text-lg"
                  maxLength={1}
                />
              ))}
            </div>
            {demoCode && <div className="text-xs text-gray-600">Demo code: <span className="font-mono">{demoCode}</span></div>}
            <div className="flex items-center gap-3">
              <button className="flex-1 border rounded px-4 py-2 hover:bg-gray-50" onClick={() => setStep(1)} disabled={isLoading}>Back</button>
              <button className="flex-1 bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50" onClick={verifyCode} disabled={isLoading || codeDigits.join('').length !== 6}>{isLoading ? 'Verifying...' : 'Verify Code'}</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form className="space-y-4" onSubmit={handleSubmitReset(onReset)}>
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type={showNewPassword ? 'text' : 'password'} {...registerReset('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })} className="w-full pl-10 pr-10 border rounded px-3 py-2" placeholder="Enter new password" />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {resetErrors.password && <p className="text-sm text-red-600 mt-1">{resetErrors.password.message}</p>}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" className="flex-1 border rounded px-4 py-2 hover:bg-gray-50" onClick={() => setStep(2)} disabled={isLoading}>Back</button>
              <button type="submit" className="flex-1 bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50" disabled={isLoading}>{isLoading ? 'Resetting...' : 'Reset Password'}</button>
            </div>
          </form>
        )}

        {step === 4 && (
          <div className="text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center">✓</div>
            <div className="text-sm text-gray-700">Password reset successful. You can now sign in.</div>
          </div>
        )}

        {serverMessage && <div className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{serverMessage}</div>}
      </div>
    </div>
  );
};

export default ForgotPassword;
