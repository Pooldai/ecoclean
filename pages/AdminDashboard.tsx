import React, { useState, useEffect } from 'react';
import { DB } from '../db';
import { WasteReport, User, UserRole, ReportStatus, Feedback, Language, Theme } from '../types';
import { 
  Users, AlertCircle, CheckCircle2, 
  MapPin, Clock, Trash2, Scale, RotateCcw, MessageSquare, Star, Briefcase, BarChart3
} from 'lucide-react';
import { useTranslation } from '../translations';

const AdminDashboard: React.FC<{ user: User, lang: Language, theme: Theme }> = ({ user, lang, theme }) => {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [pickers, setPickers] = useState<User[]>([]);
  const [citizens, setCitizens] = useState<User[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'feedback' | 'analytics'>('reports');
  const [viewingFeedback, setViewingFeedback] = useState<Feedback | null>(null);
  
  const t = useTranslation(lang);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setReports(DB.getReports());
    setFeedbacks(DB.getFeedback());
    const allUsers = DB.getUsers();
    setPickers(allUsers.filter(u => u.role === UserRole.PICKER));
    setCitizens(allUsers.filter(u => u.role === UserRole.CITIZEN));
  };

  const handleAssign = (reportId: string, pickerId: string) => {
    const picker = pickers.find(p => p.id === pickerId);
    if (!picker) return;

    const report = reports.find(r => r.id === reportId);
    if (report) {
      const updatedReport: WasteReport = {
        ...report,
        status: ReportStatus.ASSIGNED,
        assignedPickerId: picker.id,
        assignedPickerName: picker.name,
        needsReassignment: false
      };
      DB.updateReport(updatedReport);
      refreshData();
    }
  };

  const handleReassignReset = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      const updatedReport: WasteReport = {
        ...report,
        status: ReportStatus.PENDING,
        assignedPickerId: undefined,
        assignedPickerName: undefined,
        needsReassignment: false,
        completionProofUrl: undefined,
        completedAt: undefined
      };
      DB.updateReport(updatedReport);
      refreshData();
    }
  };

  const getReportFeedback = (reportId: string) => {
    return feedbacks.find(f => f.reportId === reportId);
  };

  const stats = {
    pending: reports.filter(r => r.status === ReportStatus.PENDING).length,
    assigned: reports.filter(r => r.status === ReportStatus.ASSIGNED).length,
    completed: reports.filter(r => r.status === ReportStatus.COMPLETED).length,
    flagged: reports.filter(r => r.needsReassignment).length,
    totalWeight: reports.filter(r => r.status === ReportStatus.COMPLETED).reduce((sum, r) => sum + (r.collectedWeight || 0), 0)
  };

  // Analytics helper: Group completed weight by date
  const getDailyAnalytics = () => {
    const dailyData: Record<string, number> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    last7Days.forEach(date => dailyData[date] = 0);

    reports.forEach(r => {
      if (r.status === ReportStatus.COMPLETED && r.completedAt) {
        const dateStr = new Date(r.completedAt).toISOString().split('T')[0];
        if (dailyData[dateStr] !== undefined) {
          dailyData[dateStr] += (r.collectedWeight || 0);
        }
      }
    });

    return Object.entries(dailyData).map(([date, weight]) => ({
      date: date.slice(5), // MM-DD
      weight
    }));
  };

  const analyticsData = getDailyAnalytics();
  const maxWeight = Math.max(...analyticsData.map(d => d.weight), 10);

  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t.adminConsole}</h1>
          <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t.tagline}</p>
        </div>
        <div className={`flex p-1 rounded-lg border shadow-sm overflow-x-auto ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-md transition-all text-sm font-semibold whitespace-nowrap ${activeTab === 'reports' ? 'bg-emerald-600 text-white' : theme === 'dark' ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {t.totalReports}
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-md transition-all text-sm font-semibold whitespace-nowrap ${activeTab === 'analytics' ? 'bg-emerald-600 text-white' : theme === 'dark' ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {t.analytics}
          </button>
          <button 
            onClick={() => setActiveTab('feedback')}
            className={`px-4 py-2 rounded-md transition-all text-sm font-semibold whitespace-nowrap ${activeTab === 'feedback' ? 'bg-emerald-600 text-white' : theme === 'dark' ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {lang === 'EN' ? "Citizen Feedback" : "नागरिक प्रतिक्रिया"}
            {stats.flagged > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{stats.flagged}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md transition-all text-sm font-semibold whitespace-nowrap ${activeTab === 'users' ? 'bg-emerald-600 text-white' : theme === 'dark' ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {lang === 'EN' ? "Manage Users" : "उपयोगकर्ता प्रबंधित करें"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard theme={theme} title={t.pending} value={stats.pending} icon={<AlertCircle className="text-amber-500" />} />
        <StatCard theme={theme} title={t.assigned} value={stats.assigned} icon={<Clock className="text-blue-500" />} />
        <StatCard theme={theme} title={t.completed} value={stats.completed} icon={<CheckCircle2 className="text-emerald-500" />} />
        <StatCard theme={theme} title={lang === 'EN' ? "Flagged" : "चिह्नित"} value={stats.flagged} icon={<RotateCcw className="text-red-500" />} />
        <StatCard theme={theme} title={lang === 'EN' ? "Total (kg)" : "कुल (किग्रा)"} value={stats.totalWeight} icon={<Scale className="text-emerald-600" />} />
      </div>

      {activeTab === 'reports' ? (
        <div className={`rounded-xl shadow-sm border overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Trash2 className="text-emerald-500" size={20} />
              {lang === 'EN' ? "Live Waste Reports" : "लाइव कचरा रिपोर्ट"}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={`${theme === 'dark' ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-50 text-slate-500'} text-sm font-semibold border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                  <th className="px-6 py-4">{lang === 'EN' ? "Status" : "स्थिति"}</th>
                  <th className="px-6 py-4">{lang === 'EN' ? "Reporter" : "रिपोर्टर"}</th>
                  <th className="px-6 py-4">{lang === 'EN' ? "Location" : "स्थान"}</th>
                  <th className="px-6 py-4 text-center">{t.weight}</th>
                  <th className="px-6 py-4">{lang === 'EN' ? "Assignee" : "निर्दिष्ट व्यक्ति"}</th>
                  <th className="px-6 py-4 text-right">{lang === 'EN' ? "Action" : "कार्रवाई"}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700' : 'divide-slate-100'}`}>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No waste reports submitted yet.
                    </td>
                  </tr>
                ) : reports.map(report => {
                  const fb = getReportFeedback(report.id);
                  return (
                    <tr key={report.id} className={`transition-colors ${report.needsReassignment ? (theme === 'dark' ? 'bg-red-900/10' : 'bg-red-50') : (theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50')}`}>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${
                            report.status === ReportStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                            report.status === ReportStatus.ASSIGNED ? 'bg-blue-100 text-blue-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {report.status === ReportStatus.PENDING ? t.pending : report.status === ReportStatus.ASSIGNED ? t.assigned : t.completed}
                          </span>
                          {report.needsReassignment && (
                            <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold uppercase w-fit animate-pulse">
                              Flagged
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{report.citizenName}</td>
                      <td className="px-6 py-4 text-sm max-w-[200px] truncate">{report.location.address}</td>
                      <td className="px-6 py-4 text-sm text-center font-bold text-emerald-500">
                        {report.collectedWeight ? `${report.collectedWeight} kg` : '--'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {report.assignedPickerName || (lang === 'EN' ? 'Unassigned' : 'अनिर्दिष्ट')}
                          {fb && (
                            <button onClick={() => setViewingFeedback(fb)} className="text-slate-400 hover:text-emerald-500">
                              <MessageSquare size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {report.status === ReportStatus.PENDING ? (
                          <select 
                            className={`text-sm border rounded p-1 outline-none focus:ring-1 focus:ring-emerald-500 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                            onChange={(e) => handleAssign(report.id, e.target.value)}
                            defaultValue=""
                          >
                            <option value="" disabled>{lang === 'EN' ? "Select Picker" : "पिकर चुनें"}</option>
                            {pickers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        ) : report.needsReassignment ? (
                          <button 
                            onClick={() => handleReassignReset(report.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md shadow-sm transition-all active:scale-95"
                          >
                            <RotateCcw size={14} />
                            {t.reset}
                          </button>
                        ) : (
                          <span className="text-slate-500 text-sm">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'analytics' ? (
        <div className={`p-8 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="text-emerald-500" size={24} />
            <h3 className="text-xl font-bold">{t.dailyTrends}</h3>
          </div>
          
          <div className="relative h-64 w-full flex items-end justify-between gap-4 mt-12 pb-8 border-b border-slate-700/50">
            {analyticsData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                <div 
                  className="w-full bg-emerald-500 rounded-t-lg transition-all duration-500 group-hover:bg-emerald-400 relative"
                  style={{ height: `${(d.weight / maxWeight) * 100}%` }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {d.weight} kg
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 mt-4 absolute -bottom-6">{d.date}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center text-sm text-slate-500">
            {t.collectionData} ({lang === 'EN' ? 'Last 7 Days' : 'पिछले 7 दिन'})
          </div>
        </div>
      ) : activeTab === 'feedback' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feedbacks.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-500">No feedback entries yet.</div>
          ) : feedbacks.map(fb => {
            const report = reports.find(r => r.id === fb.reportId);
            return (
              <div key={fb.id} className={`p-6 rounded-2xl border shadow-sm transition-all ${!fb.isCleaned ? 'border-red-500 ring-2 ring-red-500/10' : theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg">{fb.userName}</h4>
                    <p className="text-xs text-slate-500">{new Date(fb.createdAt).toLocaleString()}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${fb.isCleaned ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {fb.isCleaned ? (lang === 'EN' ? 'Cleaned' : 'साफ किया गया') : (lang === 'EN' ? 'Not Cleaned' : 'साफ नहीं')}
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} size={14} fill={fb.rating >= star ? '#fbbf24' : 'none'} className={fb.rating >= star ? 'text-amber-400' : 'text-slate-200'} />
                  ))}
                </div>
                <p className={`text-sm italic mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>"{fb.comment || (lang === 'EN' ? 'No comment' : 'कोई टिप्पणी नहीं')}"</p>
                {report && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 border-t border-slate-700/50 pt-3">
                    <MapPin size={12} />
                    <span className="truncate">{report.location.address}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className={`rounded-xl shadow-sm border p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Briefcase className="text-blue-500" size={20} />
              {t.picker} ({pickers.length})
            </h3>
            <div className="space-y-4">
              {pickers.map(p => (
                <div key={p.id} className={`flex items-center justify-between p-3 border rounded-lg ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{p.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={`rounded-xl shadow-sm border p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Users className="text-emerald-500" size={20} />
              {t.citizen} ({citizens.length})
            </h3>
            <div className="space-y-4">
              {citizens.map(c => (
                <div key={c.id} className={`flex items-center justify-between p-3 border rounded-lg ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{c.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feedback View Modal */}
      {viewingFeedback && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl w-full max-w-md p-6 shadow-2xl ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Review Feedback</h3>
              <button onClick={() => setViewingFeedback(null)} className="text-slate-400 hover:text-slate-600"><RotateCcw size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className={`p-4 rounded-xl ${viewingFeedback.isCleaned ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                <p className="text-sm font-bold uppercase tracking-wider mb-1">Status Report</p>
                <p className="text-lg font-medium">{viewingFeedback.isCleaned ? 'Area marked as Clean' : 'Area reported as Unclean'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Citizen Comments:</p>
                <p className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  "{viewingFeedback.comment || 'No specific comments provided.'}"
                </p>
              </div>
              <div className="flex justify-center gap-2 py-2">
                {[1,2,3,4,5].map(s => <Star key={s} size={24} fill={viewingFeedback.rating >= s ? '#fbbf24' : 'none'} className={viewingFeedback.rating >= s ? 'text-amber-400' : 'text-slate-200'} />)}
              </div>
              <button onClick={() => setViewingFeedback(null)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl mt-4">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, theme }: { title: string, value: number | string, icon: React.ReactNode, theme: Theme }) => (
  <div className={`p-4 rounded-xl shadow-sm border flex items-center justify-between ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
    <div>
      <p className={`text-[10px] uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{title}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>{icon}</div>
  </div>
);

export default AdminDashboard;