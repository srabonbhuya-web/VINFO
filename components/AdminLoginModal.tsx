import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userEmail?: string) => void;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedUser = userId.trim();
    const trimmedPass = password.trim();

    if (trimmedUser === '145531' && trimmedPass === '2271') {
      onSuccess();
      setUserId('');
      setPassword('');
      setErrorMessage('');
    } else {
      setErrorMessage('Invalid User ID or Password. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage('');
    try {
      const res = await signInWithPopup(auth, googleProvider);
      onSuccess(res.user.email || undefined);
    } catch (err: any) {
      console.warn('Google sign in error:', err);
      // If user closed popup, don't show scary error
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(err?.message || 'Google Sign-in failed. Please use User ID/Password.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-sm text-gray-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <i className="fas fa-times text-lg"></i>
        </button>

        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-indigo-600/20 border border-indigo-500/40 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <i className="fa-solid fa-user-shield text-2xl text-indigo-400"></i>
          </div>
          <h3 className="text-xl font-bold text-white tracking-wide">Admin Portal</h3>
          <p className="text-xs text-gray-400 mt-1">
            RFL Distribution • Khulna Depot - 16531
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-500/60 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <i className="fas fa-circle-exclamation text-red-400 text-sm flex-shrink-0"></i>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google Sign-In with Firebase Auth */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full mb-4 py-2.5 px-4 bg-gray-800 hover:bg-gray-750 border border-gray-600 hover:border-gray-500 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-60"
        >
          {isGoogleLoading ? (
            <i className="fa-solid fa-circle-notch fa-spin text-indigo-400"></i>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span>Sign in with Google</span>
        </button>

        <div className="relative flex py-2 items-center mb-3">
          <div className="flex-grow border-t border-gray-800"></div>
          <span className="flex-shrink mx-3 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
            Or Use Depot PIN
          </span>
          <div className="flex-grow border-t border-gray-800"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              User ID
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400">
                <i className="fa-solid fa-id-badge text-sm"></i>
              </span>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter User ID"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-gray-400">
                <i className="fa-solid fa-key text-sm"></i>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-10 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-gray-200 text-sm focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-xs sm:text-sm"
            >
              <i className="fa-solid fa-arrow-right-to-bracket"></i>
              <span>Login with PIN</span>
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-gray-800 text-center text-[10px] text-gray-500 flex items-center justify-center gap-1.5">
          <i className="fa-solid fa-cloud text-indigo-400 text-xs"></i>
          <span>Connected to Firebase Cloud Database</span>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginModal;
