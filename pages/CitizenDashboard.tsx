import React, { useState, useEffect } from 'react';
import { DB } from '../db';
import { WasteReport, User, ReportStatus, Feedback, Language, Theme } from '../types';
import { 
  Camera, MapPin, List, PlusCircle, AlertCircle, 
  CheckCircle2, Star, Send, X, Image as ImageIcon, Trophy, Clock, Loader2, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { analyzeWasteImage } from '../geminiService';
import { useTranslation } from '../translations';

const CitizenDashboard: React.FC<{ user: User, lang: Language, theme: Theme }> = ({ user, lang, theme }) => {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [isReporting, setIsReporting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newReport, setNewReport] = useState({
    description: '',
    photo: '',
    address: ''
  });
  const [selectedFeedbackReport, setSelectedFeedbackReport] = useState<WasteReport | null>(null);
  const [feedback, setFeedback] = useState({ rating: 5, comment: '', isCleaned: true });
  const t = useTranslation(lang);

  useEffect(() => {
    const allReports = DB.getReports();
    setReports(allReports.filter(r => r.citizenId === user.id));
  }, [user.id]);

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

  const handleSubmitReport = (e: React.FormEvent) => {
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

    DB.saveReport(report);
    setReports([report, ...reports]);
    setIsReporting(false);
    setNewReport({ description: '', photo: '', address: '' });
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedbackReport) return;

    const fb: Feedback = {
      id: `fb-${Date.now()}`,
      reportId: selectedFeedbackReport.id,
      userId: user.id,
      userName: user.name,
      rating: feedback.rating,
      comment: feedback.comment,
      isCleaned: feedback.isCleaned,
      createdAt: Date.now()
    };

    DB.saveFeedback(fb);
    
    // Logic for reassignment if area is NOT cleaned
    if (!feedback.isCleaned) {
      const updatedReport: WasteReport = { ...selectedFeedbackReport, needsReassignment: true };
      DB.updateReport(updatedReport);
      setReports(reports.map(r => r.id === updatedReport.id ? updatedReport : r));
    }
    
    setSelectedFeedbackReport(null);
    setFeedback({ rating: 5, comment: '', isCleaned: true });
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t.myDashboard}</h1>
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>{t.tagline}</p>
        </div>
        <button 
          onClick={() => setIsReporting(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all active:scale-95"
        >
          <PlusCircle size={20} />
          {t.reportLitter}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <List size={20} className="text-emerald-600" />
            {t.myReports}
          </h3>

          {reports.length === 0 ? (
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
                      {report.needsReassignment && (
                        <span className="px-2 py-1 bg-red-600 text-white rounded-md text-[10px] font-bold uppercase">Flagged</span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className={`text-xs mb-1 flex items-center gap-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Clock size={12} />
                      {new Date(report.createdAt).toLocaleString(lang === 'HI' ? 'hi-IN' : 'en-US')}
                    </p>
                    <p className="font-semibold line-clamp-1">{report.location.address}</p>
                    <p className={`text-sm mt-2 line-clamp-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{report.description}</p>
                    
                    {report.status === ReportStatus.COMPLETED && !report.needsReassignment && !DB.getFeedback().find(f => f.reportId === report.id) && (
                      <button 
                        onClick={() => setSelectedFeedbackReport(report)}
                        className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Star size={14} />
                        {lang === 'EN' ? "Verify & Rate" : "सत्यापित करें और दर दें"}
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

          <div className={`rounded-2xl p-6 border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" />
              {t.guidelines}
            </h4>
            <ul className={`space-y-3 text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />{lang === 'EN' ? "Capture clear photos." : "स्पष्ट फोटो लें।"}</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />{lang === 'EN' ? "Provide precise locations." : "सटीक स्थान प्रदान करें।"}</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />{lang === 'EN' ? "Rate cleanup quality." : "सफाई की गुणवत्ता का आकलन करें।"}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Verification & Feedback Modal */}
      {selectedFeedbackReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl w-full max-w-md overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white'}`}>
            <div className="p-6 border-b flex justify-between items-center bg-emerald-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold">Cleanup Verification</h2>
              <button onClick={() => setSelectedFeedbackReport(null)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <form onSubmit={handleSubmitFeedback} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold mb-3">Is the area properly cleaned?</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFeedback({...feedback, isCleaned: true})}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${feedback.isCleaned ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}
                  >
                    <ThumbsUp size={20} />
                    <span className="font-bold">Yes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedback({...feedback, isCleaned: false})}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${!feedback.isCleaned ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600' : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}
                  >
                    <ThumbsDown size={20} />
                    <span className="font-bold">No</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Cleanup Quality Rating</label>
                <div className="flex justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      type="button" 
                      onClick={() => setFeedback({...feedback, rating: star})}
                      className={`p-1 transition-transform active:scale-90 ${feedback.rating >= star ? 'text-amber-400' : 'text-slate-200'}`}
                    >
                      <Star size={32} fill={feedback.rating >= star ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Comments</label>
                <textarea
                  className={`w-full p-3 border rounded-lg outline-none h-24 resize-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                  placeholder="Tell us about the cleaning quality..."
                  value={feedback.comment}
                  onChange={(e) => setFeedback({...feedback, comment: e.target.value})}
                ></textarea>
              </div>

              <button
                type="submit"
                className={`w-full font-bold py-3 rounded-xl transition-all shadow-lg ${feedback.isCleaned ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
              >
                Submit Verification
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
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