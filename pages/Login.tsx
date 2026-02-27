
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DB } from '../db';
import { User, UserRole, Language, Theme } from '../types';
import { Recycle, LogIn, Mail, Lock } from 'lucide-react';
import { useTranslation } from '../translations';

interface LoginProps {
  onLogin: (user: User) => void;
  lang: Language;
  theme: Theme;
}

const Login: React.FC<LoginProps> = ({ onLogin, lang, theme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const t = useTranslation(lang);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Admin Bypass / Fix as requested
      if (email === 'admin@ecoclean.com' && password === 'Ecoclean@123') {
        const adminUser: User = {
          id: 'admin-fixed-id',
          email: 'admin@ecoclean.com',
          name: 'System Admin',
          role: UserRole.ADMIN,
          createdAt: 1708771200000 // Fixed timestamp
        };
        
        // Ensure admin exists in Supabase profiles for relational integrity
        try {
          const existing = await DB.getUserByEmail(email);
          if (!existing) {
            await DB.saveUser(adminUser);
          }
        } catch (dbErr) {
          console.warn("Admin auto-provisioning failed, but logging in anyway:", dbErr);
        }

        DB.setSession(adminUser);
        onLogin(adminUser);
        navigate('/');
        return;
      }

      const user = await DB.getUserByEmail(email);
      
      if (user) {
        DB.setSession(user);
        onLogin(user);
        navigate('/');
      } else {
        setError(lang === 'EN' ? 'Invalid email or password. Please check if your account exists.' : 'अमान्य ईमेल या पासवर्ड। कृपया जांचें कि क्या आपका खाता मौजूद है।');
      }
    } catch (err: any) {
      console.error("Login error details:", err);
      let msg = err.message || "Unknown error";
      if (msg.includes("Failed to fetch") || msg.includes("fetch")) {
        msg = "Network Error: Could not connect to the database. Please check if your Supabase project is active (not paused) and your Vercel environment variables are set correctly.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-[calc(100vh-128px)] flex items-center justify-center px-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-gradient-to-br from-emerald-50 to-slate-100'}`}>
      <div className={`max-w-md w-full rounded-2xl shadow-xl p-8 border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100'}`}>
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center p-3 rounded-xl mb-4 ${theme === 'dark' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
            <Recycle size={40} />
          </div>
          <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{t.welcomeBack}</h2>
          <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} mt-2 text-sm md:text-base`}>{t.tagline}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{t.email}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{t.password}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-500 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <LogIn size={20} />
            {loading ? "Logging in..." : t.login}
          </button>
        </form>

        <p className={`text-center mt-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          {lang === 'EN' ? "Don't have an account?" : "खाता नहीं है?"}{' '}
          <Link to="/signup" className="text-emerald-500 font-semibold hover:underline">
            {t.signup}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
