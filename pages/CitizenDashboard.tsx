import React, { useState, useEffect } from 'react';
import { DB } from '../db';
import { WasteReport, User, ReportStatus, Feedback } from '../types';
import { 
  Camera, MapPin, List, PlusCircle, AlertCircle, 
  CheckCircle2, Star, Send, X, Image as ImageIcon, Trophy, Clock, Loader2
} from 'lucide-react';
import { analyzeWasteImage } from '../geminiService';

const CitizenDashboard: React.FC<{ user: User }> = ({ user }) => {
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

  useEffect(() => {
    const allReports = DB.getReports();
    setReports(allReports.filter(r => r.citizenId === user.id));
  }, [user.id]);

  const completedCount = reports.filter(r => r.status === ReportStatus.COMPLETED).length;
  const rewardPoints = completedCount * 10;

  // Handle image upload and trigger Gemini analysis
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setNewReport({ ...newReport, photo: base64 });
        
        // Auto-analyze the uploaded image with Gemini
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
      location: {
        lat: 0, lng: 0,
        address: newReport.address
      },
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

    if (!feedback.isCleaned) {
      const updatedReport = { ...selectedFeedbackReport, needsReassignment: true };
      DB.updateReport(updatedReport);
      setReports(reports.map(r => r.id === updatedReport.id ? updatedReport : r));
    }

    setSelectedFeedbackReport(null);
    setFeedback({ rating: 5, comment: '', isCleaned: true });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Dashboard</h1>
          <p className="text-slate-500">Track your contributions to a cleaner community.</p>
        </div>
        <button 
          onClick={() => setIsReporting(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all active:scale-95"
        >
          <PlusCircle size={20} />
          Report Litter
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <List size={20} className="text-emerald-600" />
            My Recent Reports
          </h3>

          {reports.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
              <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
              <p>You haven't reported any litter yet. Start by clicking "Report Litter".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map(report => (
                <div key={report.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="h-40 overflow-hidden relative">
                    <img src={report.photoUrl} alt="Litter" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                        report.status === ReportStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                        report.status === ReportStatus.ASSIGNED ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {report.status}
                      </span>
                      {report.needsReassignment && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-[10px] font-bold uppercase">
                          Flagged
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                    <p className="font-semibold text-slate-800 line-clamp-1">{report.location.address}</p>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{report.description}</p>
                    
                    {report.status === ReportStatus.COMPLETED && !report.needsReassignment && (
                      <button 
                        onClick={() => setSelectedFeedbackReport(report)}
                        className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm flex items-center justify-center gap-2 border border-slate-200 transition-colors"
                      >
                        <Star size={14} className="text-amber-400" />
                        Verify & Rate
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
            <div className="absolute -right-4 -top-4 opacity-10">
              <Trophy size={120} />
            </div>
            <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
              <Trophy size={24} className="text-amber-300" />
              Impact Summary
            </h3>
            <p className="text-emerald-100 text-sm mb-6">Your collective efforts make a difference!</p>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-200 uppercase font-bold tracking-wider">Reward Points</p>
                  <p className="text-3xl font-black">{rewardPoints}</p>
                </div>
                <div className="bg-amber-400 text-emerald-900 font-bold p-2 rounded-lg text-xs">
                  +10 pts / clean
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
                  <p className="text-xs text-emerald-200">Total Reports</p>
                  <p className="text-2xl font-bold">{reports.length}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
                  <p className="text-xs text-emerald-200">Areas Cleaned</p>
                  <p className="text-2xl font-bold">{completedCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" />
              Guidelines
            </h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                Capture clear photos of the waste.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                Provide precise location landmarks.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 mt-0.5" />
                Verify cleanups to earn points!
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {isReporting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <h2 className="text-xl font-bold text-emerald-800">Report Waste Litter</h2>
              <button onClick={() => setIsReporting(false)} className="text-emerald-600 hover:text-emerald-800"><X /></button>
            </div>
            <form onSubmit={handleSubmitReport} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Waste Image</label>
                {!newReport.photo ? (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50">
                    <Camera size={40} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm text-slate-500">Take a photo of the litter</p>
                    <input type="file" accept="image/*" className="hidden" id="photo-upload" onChange={handleFileChange} />
                    <label htmlFor="photo-upload" className="mt-4 inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm cursor-pointer hover:bg-emerald-700">Browse Image</label>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden h-48 group">
                    <img src={newReport.photo} alt="Preview" className="w-full h-full object-cover" />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-sm font-bold backdrop-blur-[2px]">
                        <Loader2 className="animate-spin mb-2" size={24} />
                        Gemini is analyzing waste...
                      </div>
                    )}
                    <button 
                      type="button" 
                      onClick={() => {setNewReport({...newReport, photo: ''});}}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="E.g. 123 Main St, Central Park Entrance"
                    value={newReport.address}
                    onChange={(e) => setNewReport({...newReport, address: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                  placeholder="Tell us more about the situation..."
                  value={newReport.description}
                  onChange={(e) => setNewReport({...newReport, description: e.target.value})}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={!newReport.photo || isAnalyzing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-4 shadow-lg shadow-emerald-200"
              >
                <Send size={20} />
                {isAnalyzing ? 'Analyzing Image...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {selectedFeedbackReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Cleanup Verification</h2>
              <button onClick={() => setSelectedFeedbackReport(null)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <form onSubmit={handleSubmitFeedback} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Is the area properly cleaned?</label>
                <select
                  required
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={feedback.isCleaned ? 'yes' : 'no'}
                  onChange={(e) => setFeedback({...feedback, isCleaned: e.target.value === 'yes'})}
                >
                  <option value="yes">Yes, it is perfectly clean</option>
                  <option value="no">No, there is still waste remaining</option>
                </select>
              </div>

              <div className="text-center">
                <p className="text-slate-600 text-sm mb-4">How would you rate the service quality?</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      type="button" 
                      onClick={() => setFeedback({...feedback, rating: star})}
                      className={`p-2 transition-transform active:scale-90 ${feedback.rating >= star ? 'text-amber-400' : 'text-slate-200'}`}
                    >
                      <Star size={32} fill={feedback.rating >= star ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Your Comments</label>
                <textarea
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none text-sm"
                  placeholder="Tell us about the cleanup quality..."
                  value={feedback.comment}
                  onChange={(e) => setFeedback({...feedback, comment: e.target.value})}
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Submit & verify
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
