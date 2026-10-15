import React, { useState, useEffect } from 'react';
import { User } from '../types';
import {
  loginUserRemote,
  registerUserRemote,
  resetPasswordRemote,
  syncAllUsersFromBackend,
} from '../utils/authStorage';
import { playSound } from '../utils/audio';
import {
  Lock,
  Phone,
  User as UserIcon,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';

interface AuthScreenProps {
  onSuccess: (user: User) => void;
  lang?: 'lo' | 'en';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, lang = 'lo' }) => {
  // Mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-sync existing registered accounts from server on load
  useEffect(() => {
    syncAllUsersFromBackend().catch(() => {});
  }, []);

  // Login states
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register states
  const [regPhone, setRegPhone] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot password states
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);

  // Feedback states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle Login Submit (Works securely from ANY device with Phone, Username, or Name)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = loginIdentifier.trim();
    if (!cleanId) {
      setErrorMessage(
        lang === 'lo'
          ? 'ກະລຸນາປ້ອນເບີໂທລະສັບ, ຊື່ຜູ້ໃຊ້ ຫຼື ຊື່ເຕັມ'
          : 'Please enter your phone number, username, or name'
      );
      return;
    }

    if (!loginPassword) {
      setErrorMessage(lang === 'lo' ? 'ກະລຸນາປ້ອນລະຫັດຜ່ານ' : 'Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      const res = await loginUserRemote(cleanId, loginPassword);
      if (!res.success || !res.user) {
        setErrorMessage(
          res.error ||
            (lang === 'lo'
              ? 'ເບີໂທ, ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ. ກະລຸນາກວດຄືນ'
              : 'Invalid phone, username, or password. Please check your credentials.')
        );
        setIsLoading(false);
        return;
      }

      playSound('success');
      setSuccessMessage(lang === 'lo' ? `ຍິນດີຕ້ອນຮັບ, ${res.user.fullName}!` : `Welcome, ${res.user.fullName}!`);
      setTimeout(() => {
        onSuccess(res.user!);
      }, 350);
    } catch {
      setErrorMessage(lang === 'lo' ? 'ເກີດຂໍ້ຜິດພາດໃນການເຂົ້າສູ່ລະບົບ' : 'An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Register Submit (Anyone without an account can create their own directly)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = regPhone.trim();
    const cleanUsername = regUsername.trim();
    const cleanFullName = regFullName.trim();

    if (!cleanPhone) {
      setErrorMessage(lang === 'lo' ? 'ກະລຸນາປ້ອນເບີໂທລະສັບ' : 'Please enter your phone number');
      return;
    }
    if (!cleanUsername) {
      setErrorMessage(lang === 'lo' ? 'ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້ງານ (Username)' : 'Please enter a username');
      return;
    }
    if (!regPassword) {
      setErrorMessage(lang === 'lo' ? 'ກະລຸນາຕັ້ງລະຫັດຜ່ານ' : 'Please enter a password');
      return;
    }
    if (regPassword.length < 3) {
      setErrorMessage(lang === 'lo' ? 'ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 3 ຕົວອັກສອນ' : 'Password must be at least 3 characters');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage(lang === 'lo' ? 'ລະຫັດຜ່ານຢືນຢັນບໍ່ກົງກັນ! ກະລຸນາກວດຄືນ.' : 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerUserRemote(cleanPhone, cleanUsername, cleanFullName || cleanUsername, regPassword);
      if (!res.success || !res.user) {
        setErrorMessage(
          res.error ||
            (lang === 'lo'
              ? 'ເບີໂທລະສັບ ຫຼື ຊື່ຜູ້ໃຊ້ນີ້ຖືກນຳໃຊ້ແລ້ວ. ກະລຸນາເຂົ້າສູ່ລະບົບ ຫຼື ໃຊ້ຊື່ອື່ນ'
              : 'This phone number or username is already taken. Please sign in or use another.')
        );
        setIsLoading(false);
        return;
      }

      playSound('income');
      setSuccessMessage(lang === 'lo' ? 'ລົງທະບຽນສຳເລັດແລ້ວ! ກຳລັງເຂົ້າສູ່ລະບົບ...' : 'Registered successfully!');
      setTimeout(() => {
        onSuccess(res.user!);
      }, 400);
    } catch {
      setErrorMessage(lang === 'lo' ? 'ເກີດຂໍ້ຜິດພາດໃນການລົງທະບຽນ' : 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password Submit
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanForgotId = forgotIdentifier.trim();
    if (!cleanForgotId) {
      setErrorMessage(
        lang === 'lo'
          ? 'ກະລຸນາປ້ອນເບີໂທ ຫຼື ຊື່ຜູ້ໃຊ້ທີ່ເຄີຍລົງທະບຽນ'
          : 'Please enter your registered phone or username'
      );
      return;
    }

    if (!forgotNewPassword) {
      setErrorMessage(lang === 'lo' ? 'ກະລຸນາປ້ອນລະຫັດຜ່ານໃໝ່' : 'Please enter a new password');
      return;
    }

    if (forgotNewPassword.length < 3) {
      setErrorMessage(lang === 'lo' ? 'ລະຫັດຜ່ານໃໝ່ຕ້ອງມີຢ່າງໜ້ອຍ 3 ຕົວອັກສອນ' : 'Password must be at least 3 characters');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMessage(lang === 'lo' ? 'ລະຫັດຜ່ານຢືນຢັນບໍ່ກົງກັນ' : 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPasswordRemote(cleanForgotId, forgotNewPassword);
      if (!res.success || !res.user) {
        setErrorMessage(
          res.error ||
            (lang === 'lo'
              ? 'ບໍ່ພົບບັນຊີຈາກ ເບີໂທ ຫຼື ຊື່ ນີ້ໃນລະບົບ'
              : 'Account not found with this Phone or Username')
        );
        setIsLoading(false);
        return;
      }

      playSound('success');
      setSuccessMessage(
        lang === 'lo'
          ? `ຕັ້ງລະຫັດຜ່ານໃໝ່ສຳເລັດແລ້ວ! ຍິນດີຕ້ອນຮັບ, ${res.user.fullName}!`
          : `Password reset successfully! Welcome, ${res.user.fullName}!`
      );
      setTimeout(() => {
        onSuccess(res.user!);
      }, 500);
    } catch {
      setErrorMessage(lang === 'lo' ? 'ເກີດຂໍ້ຜິດພາດໃນການຕັ້ງລະຫັດຜ່ານໃໝ່' : 'Error resetting password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070d1e] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Auth Card */}
      <div className="w-full max-w-md bg-[#0d162e] border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-500 text-white font-bold text-xl shadow-lg shadow-blue-500/20 mb-1">
            ₭
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            LaoExpense Pro
          </h1>
          <p className="text-xs text-slate-400">
            {lang === 'lo'
              ? 'ລະບົບຄຸ້ມຄອງລາຍຮັບ-ລາຍຈ່າຍສ່ວນບຸກຄົນ · ເຂົ້າສູ່ລະບົບໄດ້ທຸກເຄື່ອງ'
              : 'Personal Financial OS · Login from any device'}
          </p>
        </div>

        {/* Mode Switcher Tabs (Only in login & register modes) */}
        {mode !== 'forgot' ? (
          <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lang === 'lo' ? 'ເຂົ້າສູ່ລະບົບ (Sign In)' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setMode('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lang === 'lo' ? 'ລົງທະບຽນໃໝ່ (Register)' : 'New Register'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pb-1 border-b border-slate-800">
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'lo' ? 'ກັບຄືນເຂົ້າສູ່ລະບົບ' : 'Back to Sign In'}</span>
            </button>
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'lo' ? 'ລືມລະຫັດຜ່ານ' : 'Reset Password'}</span>
            </span>
          </div>
        )}

        {/* Feedback banners */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* MODE 1: LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'lo' ? 'ເບີໂທລະສັບ, ຊື່ຜູ້ໃຊ້ ຫຼື ຊື່ເຕັມ' : 'Phone Number, Username, or Name'}</span>
              </label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                placeholder={lang === 'lo' ? 'ຕົວຢ່າງ: 020 9977 4515 ຫຼື narnny' : '020 9977 4515, username, or name'}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                autoComplete="username"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lang === 'lo' ? 'ລະຫັດຜ່ານ' : 'Password'}</span>
                </label>
                {/* FORGOT PASSWORD LINK BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setMode('forgot');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setForgotIdentifier(loginIdentifier);
                  }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                >
                  {lang === 'lo' ? 'ລືມລະຫັດຜ່ານ?' : 'Forgot Password?'}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 pr-10 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors shadow-lg shadow-blue-950/40 flex items-center justify-center gap-1.5 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'lo' ? 'ກຳລັງເຂົ້າສູ່ລະບົບ...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{lang === 'lo' ? 'ເຂົ້າສູ່ລະບົບ (Sign In)' : 'Sign In'}</span>
                </>
              )}
            </button>

            {/* Quick Link for New Users to create their own user account */}
            <div className="pt-3 text-center border-t border-slate-800/80">
              <p className="text-xs text-slate-400">
                {lang === 'lo' ? 'ຍັງບໍ່ມີບັນຊີຜູ້ໃຊ້ງານ?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setMode('register');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    if (loginIdentifier.trim()) {
                      const isPhone = /^[0-9+\s-]+$/.test(loginIdentifier.trim());
                      if (isPhone) setRegPhone(loginIdentifier.trim());
                      else setRegUsername(loginIdentifier.trim());
                    }
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors ml-1"
                >
                  {lang === 'lo' ? '👉 ສ້າງບັນຊີໃໝ່ (Register)' : '👉 Register New User'}
                </button>
              </p>
            </div>
          </form>
        )}

        {/* MODE 2: REGISTER FORM (Self-service registration) */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'lo' ? 'ເບີໂທລະສັບ (Phone Number) *' : 'Phone Number *'}</span>
              </label>
              <input
                type="text"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="ຕົວຢ່າງ: 020 99887766"
                required
                disabled={isLoading}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'lo' ? 'ຊື່ຜູ້ໃຊ້ງານ (Username ສຳລັບເຂົ້າສູ່ລະບົບ) *' : 'Username *'}</span>
              </label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="ຕົວຢ່າງ: somsak"
                required
                disabled={isLoading}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'lo' ? 'ຊື່ເຕັມ / ຊື່ຫຼິ້ນ (Display Name)' : 'Display Name'}</span>
              </label>
              <input
                type="text"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="ຕົວຢ່າງ: ສົມສັກ ແກ້ວມະນີ"
                disabled={isLoading}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'lo' ? 'ຕັ້ງລະຫັດຜ່ານ *' : 'Password *'}</span>
              </label>
              <div className="relative">
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 pr-10 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'lo' ? 'ຢືນຢັນລະຫັດຜ່ານ *' : 'Confirm Password *'}</span>
              </label>
              <input
                type="password"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors shadow-lg shadow-blue-950/40 flex items-center justify-center gap-1.5 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'lo' ? 'ກຳລັງສ້າງບັນຊີ...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{lang === 'lo' ? 'ສ້າງບັນຊີ ແລະ ເຂົ້າໃຊ້ງານທັນທີ' : 'Create Account & Enter'}</span>
                </>
              )}
            </button>

            {/* Quick Link back to Sign In */}
            <div className="pt-3 text-center border-t border-slate-800/80">
              <p className="text-xs text-slate-400">
                {lang === 'lo' ? 'ມີບັນຊີຢູ່ແລ້ວ?' : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    setMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors ml-1"
                >
                  {lang === 'lo' ? '👉 ເຂົ້າສູ່ລະບົບ (Sign In)' : '👉 Sign In'}
                </button>
              </p>
            </div>
          </form>
        )}

        {/* MODE 3: FORGOT PASSWORD FORM (Reset Password securely by Phone or Username) */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-200">
              <p className="font-semibold flex items-center gap-1 mb-0.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'lo' ? 'ຕັ້ງລະຫັດຜ່ານໃໝ່' : 'Reset Password'}</span>
              </p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {lang === 'lo'
                  ? 'ປ້ອນເບີໂທລະສັບ ຫຼື ຊື່ຜູ້ໃຊ້ທີ່ເຄີຍລົງທະບຽນ ແລ້ວກຳນົດລະຫັດຜ່ານໃໝ່'
                  : 'Enter your registered phone or username to set a new password.'}
              </p>
            </div>

            {/* Field: Phone or Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'lo' ? 'ເບີໂທລະສັບ ຫຼື ຊື່ຜູ້ໃຊ້ *' : 'Phone Number or Username *'}</span>
              </label>
              <input
                type="text"
                value={forgotIdentifier}
                onChange={(e) => setForgotIdentifier(e.target.value)}
                placeholder={lang === 'lo' ? 'ຕົວຢ່າງ: 020 9977 4515 ຫຼື narnny' : '020 9977 4515 or username'}
                required
                disabled={isLoading}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Field: New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'lo' ? 'ລະຫັດຜ່ານໃໝ່ *' : 'New Password *'}</span>
              </label>
              <div className="relative">
                <input
                  type={showForgotNewPassword ? 'text' : 'password'}
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 pr-10 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Field: Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'lo' ? 'ຢືນຢັນລະຫັດຜ່ານໃໝ່ *' : 'Confirm New Password *'}</span>
              </label>
              <input
                type="password"
                value={forgotConfirmPassword}
                onChange={(e) => setForgotConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors shadow-lg shadow-amber-950/40 flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{lang === 'lo' ? 'ກຳລັງຕັ້ງລະຫັດໃໝ່...' : 'Resetting...'}</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{lang === 'lo' ? 'ຕັ້ງລະຫັດຜ່ານໃໝ່ ແລະ ເຂົ້າສູ່ລະບົບ' : 'Set New Password & Enter'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  playSound('click');
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                {lang === 'lo' ? 'ຍົກເລີກ / ກັບໄປໜ້າເຂົ້າສູ່ລະບົບ' : 'Cancel / Back to Sign In'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
