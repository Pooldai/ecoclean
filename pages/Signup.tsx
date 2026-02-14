import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DB } from '../db';
import { User, UserRole, Language, Theme } from '../types';
import { Recycle, UserPlus, Mail, User as UserIcon, Phone, Briefcase, Lock } from 'lucide-react';
import { useTranslation } from '../translations';

interface SignupProps {
  onSignup: (user: User) => void;
  lang: Language;
  theme: Theme;
}

const Signup: React.FC<SignupProps> = ({ onSignup, lang, theme }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: UserRole.CITIZEN,
    phone: '',
    password: ''
  });
  const navigate = useNavigate();
  const t = useTranslation(lang);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newUser: User = {
      id: `u-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      phone: formData.phone,
      createdAt: Date.now()
    };

    DB.saveUser(newUser);
    DB.setSession(newUser);
    onSignup(newUser);
    navigate('/');
  };

  return (
    <div className={`min-h-[calc(100vh-128px)] flex items-center justify-center px-4 py-12 ${theme === 'dark' ? 'bg-slate-900' : 'bg-gradient-to-br from-emerald-50 to-slate-100'}`}>
      <div className={`max-w-md w-full rounded-2xl shadow-xl p-8 border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100'}`}>
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center p-3 rounded-xl mb-4 ${theme === 'dark' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
            <Recycle size={40} />
          </div>
          <h2 className="text-3xl font-bold">{t.joinUs}</h2>
          <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} mt-2 text-sm md:text-base`}>{t.tagline}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button
              type="button"
              onClick={() => setFormData({...formData, role: UserRole.CITIZEN})}
              className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                formData.role === UserRole.CITIZEN 
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' 
                  : theme === 'dark' ? 'border-slate-700 text-slate-500 hover:border-slate-600' : 'border-slate-100 text-slate-500 hover:border-slate-200'
              }`}
            >
              <UserIcon size={20} />
              <span className="text-xs font-semibold">{t.citizen}</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, role: UserRole.PICKER})}
              className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                formData.role === UserRole.PICKER 
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' 
                  : theme === 'dark' ? 'border-slate-700 text-slate-500 hover:border-slate-600' : 'border-slate-100 text-slate-500 hover:border-slate-200'
              }`}
            >
              <Briefcase size={20} />
              <span className="text-xs font-semibold">{t.picker}</span>
            </button>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{t.name}</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                required
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{t.email}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{t.phone}</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="tel"
                required
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                placeholder="+91 1234567890"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors mt-6"
          >
            <UserPlus size={20} />
            {t.signup}
          </button>
        </form>

        <p className={`text-center mt-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          {lang === 'EN' ? "Already have an account?" : "पहले से ही एक खाता है?"}{' '}
          <Link to="/login" className="text-emerald-500 font-semibold hover:underline">
            {t.login}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;