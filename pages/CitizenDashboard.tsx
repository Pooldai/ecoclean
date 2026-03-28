
import React, { useState, useEffect } from 'react';
import { DB } from '../db';
import { WasteReport, User, ReportStatus, Feedback, Language, Theme } from '../types';
import { 
  Camera, List, PlusCircle, AlertCircle, 
  CheckCircle2, Star, X, Image as ImageIcon, Trophy, Clock, Loader2, ThumbsUp, ThumbsDown, User as UserIcon, Save
} from 'lucide-react';
import { analyzeWasteImage } from '../geminiService';
import { useTranslation } from '../translations';

const CitizenDashboard: React.FC<{ user: User, lang: Language, theme: Theme }> = ({ user, lang, theme }) => {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [isReporting, setIsReporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newReport, setNewReport] = useState({
    description: '',
    photo: '',
    address: ''
  });
  const [selectedFeedbackReport, setSelectedFeedbackReport] = useState<WasteReport | null>(null);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '', isCleaned: true });
  const [activeTab, setActiveTab] = useState<'reports' | 'profile'>('reports');
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    profilePictureUrl: user.profilePictureUrl || ''
  });
  const t = useTranslation(lang);

  useEffect(() => {
    loadReports();
  }, [user.id]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const citizenReports = await DB.getReportsByCitizenId(user.id);
      setReports(citizenReports);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = reports.filter(r => r.status === ReportStatus.COMPLETED && !r.needsReassignment).length;
  const rewardPoints = completedCount * 10;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setNewReport({ ...newReport, photo: base64 });
        
        setIsAnalyzing(true);
        try {
          const analysis = await analyzeWasteImage(base64);
          setNewReport(prev => ({ 
            ...prev, 
            description: prev.description 
              ? `${prev.description}\n\n[AI Analysis]: ${analysis}` 
              : `[AI Analysis]: ${analysis}` 
          }));
        } catch (err) {
          console.error("Image analysis failed:", err);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const report: WasteReport = {
      id: `rep-${Date.now()}`,
      citizenId: user.id,
      citizenName: user.name,
      description: newReport.description,
      photoUrl: newReport.photo,
      location: { lat: 0, lng: 0, address: newReport.address },
      status: ReportStatus.PENDING,
      createdAt: Date.now()
    };

    try {
      await DB.saveReport(report);
      setReports([report, ...reports]);
      setIsReporting(false);
      setNewReport({ description: '', photo: '', address: '' });
    } catch (err) {
      alert("Error saving report.");
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedbackReport) return;

    const fb: Feedback = {
      id: `fb-${Date.now()}`,
      reportId: selectedFeedbackReport.id,
      pickerId: selectedFeedbackReport.assignedPickerId || '',
      userId: user.id,
      userName: user.name,
      rating: feedback.rating,
      comment: feedback.comment,
      isCleaned: feedback.isCleaned,
      createdAt: Date.now()
    };

    try {
      await DB.saveFeedback(fb);
      
      if (!feedback.isCleaned) {
        const updatedReport: WasteReport = { 
          ...selectedFeedbackReport, 
          status: ReportStatus.PENDING,
          needsReassignment: true 
        };
        await DB.updateReport(updatedReport);
        setReports(reports.map(r => r.id === updatedReport.id ? updatedReport : r));
      }
      
      setSelectedFeedbackReport(null);
      setFeedback({ rating: 5, comment: '', isCleaned: true });
    } catch (err) {
      alert("Error saving feedback.");
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = {
      ...user,
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      profilePictureUrl: profileData.profilePictureUrl
    };
    try {
      await DB.updateUser(updatedUser);
      alert(lang === 'EN' ? "Profile updated successfully!" : "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!");
    } catch (err) {
      alert("Error updating profile.");
    }
  };

  const handleProfileImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, profilePictureUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{activeTab === 'reports' ? t.myDashboard : (lang === 'EN' ? 'My Profile' : 'मेरी प्रोफ़ाइल')}</h1>
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>{activeTab === 'reports' && t.tagline}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex p-1 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setActiveTab('reports')} className={`px-4 py-2 rounded-md transition-all text-sm font-semibold flex items-center gap-2 ${activeTab === 'reports' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>
              <List size={16} />
              {lang === 'EN' ? 'Reports' : 'रिपोर्ट'}
            </button>
            <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-md transition-all text-sm font-semibold flex items-center gap-2 ${activeTab === 'profile' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>
              <UserIcon size={16} />
              {lang === 'EN' ? 'Profile' : 'प्रोफ़ाइल'}
            </button>
          </div>
          {activeTab === 'reports' && (
            <button 
              onClick={() => setIsReporting(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all active:scale-95"
            >
              <PlusCircle size={20} />
              {t.reportLitter}
            </button>
          )}
        </div>
      </div>

      {activeTab === 'reports' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <List size={20} className="text-emerald-600" />
            {t.myReports}
          </h3>

          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading your reports...</div>
          ) : reports.length === 0 ? (
            <div className={`rounded-xl border border-dashed p-12 text-center ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 text-slate-500' : 'bg-white border-slate-300 text-slate-400'}`}>
              <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
              <p>{lang === 'EN' ? "You haven't reported any litter yet." : "आपने अभी तक किसी कचरे की सूचना नहीं दी है।"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map(report => (
                <div key={report.id} className={`rounded-xl shadow-sm border overflow-hidden group hover:shadow-md transition-shadow ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} ${report.needsReassignment ? 'ring-2 ring-red-500/50' : ''}`}>
                  <div className="h-40 overflow-hidden relative">
                    <img src={report.photoUrl} alt="Litter" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                        report.status === ReportStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                        report.status === ReportStatus.ASSIGNED ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {report.status === ReportStatus.PENDING ? t.pending : report.status === ReportStatus.ASSIGNED ? t.assigned : t.completed}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className={`text-xs mb-1 flex items-center gap-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Clock size={12} />
                      {new Date(Number(report.createdAt)).toLocaleString(lang === 'HI' ? 'hi-IN' : 'en-US')}
                    </p>
                    <p className="font-semibold line-clamp-1">{report.location.address}</p>
                    <p className={`text-sm mt-2 line-clamp-2 mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{report.description}</p>
                    
                    {report.status === ReportStatus.COMPLETED && !report.needsReassignment && (
                      <button 
                        onClick={() => setSelectedFeedbackReport(report)}
                        className="w-full mt-2 py-2 bg-emerald-100/50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-300 text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
                      >
                        <Star size={14} /> {lang === 'EN' ? 'Rate Service' : 'सेवा को रेट करें'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
              <Trophy size={24} className="text-amber-300" />
              {t.impact}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-200 uppercase font-bold tracking-wider">{t.points}</p>
                  <p className="text-3xl font-black">{rewardPoints}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
                  <p className="text-xs text-emerald-200">{t.totalReports}</p>
                  <p className="text-2xl font-bold">{reports.length}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
                  <p className="text-xs text-emerald-200">{t.areasCleaned}</p>
                  <p className="text-2xl font-bold">{completedCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      ) : (
        <div className={`max-w-2xl mx-auto p-8 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500 mb-4 bg-slate-100 flex items-center justify-center dark:bg-slate-700">
                {profileData.profilePictureUrl ? (
                  <img src={profileData.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={40} className="text-slate-400" />
                )}
              </div>
              <label className="cursor-pointer text-sm text-emerald-600 font-semibold hover:text-emerald-700 px-3 py-1 border border-emerald-200 rounded-full dark:border-emerald-800">
                {lang === 'EN' ? 'Change Photo' : 'फ़ोटो बदलें'}
                <input type="file" accept="image/*" className="hidden" onChange={handleProfileImage} />
              </label>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">{t.name}</label>
              <input type="text" required className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">{lang === 'EN' ? 'Email Address' : 'ईमेल पता'}</label>
              <input type="email" required disabled title="Email cannot be changed" className="w-full p-3 border rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">{lang === 'EN' ? 'Phone Number' : 'फ़ोन नंबर'}</label>
              <input type="tel" className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600" value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} />
            </div>
            <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg">
              <Save size={20} className="inline mr-2" /> {lang === 'EN' ? 'Save Changes' : 'बदलाव सहेजें'}
            </button>
          </form>
        </div>
      )}

      {selectedFeedbackReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl w-full max-w-md overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-emerald-50 border-slate-100'}`}>
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-emerald-800'}`}>
                {lang === 'EN' ? 'Provide Feedback' : 'प्रतिक्रिया दें'}
              </h2>
              <button 
                onClick={() => {
                  setSelectedFeedbackReport(null);
                  setFeedback({ rating: 5, comment: '', isCleaned: true });
                }} 
                className="text-emerald-600 hover:text-emerald-800"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleSubmitFeedback} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">{lang === 'EN' ? 'Is this place clean?' : 'क्या यह जगह साफ है?'}</label>
                <select 
                  className={`w-full p-3 border rounded-lg outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                  value={feedback.isCleaned ? 'yes' : 'no'}
                  onChange={(e) => setFeedback({...feedback, isCleaned: e.target.value === 'yes'})}
                >
                  <option value="yes">{lang === 'EN' ? 'Yes, it is clean' : 'हाँ, यह साफ है'}</option>
                  <option value="no">{lang === 'EN' ? 'No, still dirty' : 'नहीं, अभी भी गंदा है'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">{lang === 'EN' ? 'Rating' : 'रेटिंग'} (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFeedback({...feedback, rating: star})}
                      className={`${feedback.rating >= star ? 'text-amber-400' : 'text-slate-300'} hover:scale-110 transition-transform`}
                    >
                      <Star size={32} fill={feedback.rating >= star ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">
                  {lang === 'EN' ? 'Comments' : 'टिप्पणियाँ'}
                  {!feedback.isCleaned && <span className="text-red-500 ml-1">*</span>}
                </label>
                <textarea
                  required={!feedback.isCleaned}
                  className={`w-full p-3 border rounded-lg outline-none h-24 resize-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'} ${!feedback.isCleaned && !feedback.comment ? 'border-red-300 focus:ring-red-500' : 'focus:ring-emerald-500'}`}
                  placeholder={lang === 'EN' ? 'Tell us more about the service...' : 'हमें सेवा के बारे में और बताएं...'}
                  value={feedback.comment}
                  onChange={(e) => setFeedback({...feedback, comment: e.target.value})}
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg"
              >
                {t.submit}
              </button>
            </form>
          </div>
        </div>
      )}

      {isReporting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-emerald-50 border-slate-100'}`}>
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-emerald-800'}`}>{t.reportLitter}</h2>
              <button onClick={() => setIsReporting(false)} className="text-emerald-600 hover:text-emerald-800"><X /></button>
            </div>
            <form onSubmit={handleSubmitReport} className="p-6 space-y-4">
              <div>
                {!newReport.photo ? (
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
                    <Camera size={40} className="mx-auto mb-2 text-slate-400" />
                    <input type="file" accept="image/*" className="hidden" id="photo-upload" onChange={handleFileChange} />
                    <label htmlFor="photo-upload" className="mt-4 inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm cursor-pointer">{lang === 'EN' ? "Upload Photo" : "फोटो अपलोड करें"}</label>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden h-48">
                    <img src={newReport.photo} className="w-full h-full object-cover" />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-sm">
                        <Loader2 className="animate-spin mb-2" />
                        {t.analyzing}
                      </div>
                    )}
                    <button type="button" onClick={() => setNewReport({...newReport, photo: ''})} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><X size={16} /></button>
                  </div>
                )}
              </div>
              <input
                type="text"
                required
                className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                placeholder={t.address}
                value={newReport.address}
                onChange={(e) => setNewReport({...newReport, address: e.target.value})}
              />
              <textarea
                className={`w-full p-3 border rounded-lg outline-none h-24 resize-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                placeholder={t.description}
                value={newReport.description}
                onChange={(e) => setNewReport({...newReport, description: e.target.value})}
              ></textarea>
              <button
                type="submit"
                disabled={!newReport.photo || isAnalyzing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg"
              >
                {t.submit}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
