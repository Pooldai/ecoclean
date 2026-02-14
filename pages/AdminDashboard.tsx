import React, { useState, useEffect } from 'react';
import { DB } from '../db';
import { WasteReport, User, UserRole, ReportStatus, Feedback, Language, Theme } from '../types';
import { 
  Users, AlertCircle, CheckCircle2, 
  MapPin, Clock, Trash2, Filter, ChevronRight, Scale, RotateCcw, MessageSquare, Star, Briefcase
} from 'lucide-react';
import { useTranslation } from '../translations';

const AdminDashboard: React.FC<{ user: User, lang: Language, theme: Theme }> = ({ user, lang, theme }) => {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [pickers, setPickers] = useState<User[]>([]);
  const [citizens, setCitizens] = useState<User[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'users'>('reports');
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

  const getPickerTotalWeight = (pickerId: string) => {
    return reports
      .filter(r => r.assignedPickerId === pickerId && r.status === ReportStatus.COMPLETED)
      .reduce((sum, r) => sum + (r.collectedWeight || 0), 0);
  };

  const getReportFeedback = (reportId: string) => {
    return feedbacks.find(f => f.reportId === reportId);
  };

  const stats = {
    pending: reports.filter(r => r.status === ReportStatus.PENDING).length,
    assigned: reports.filter(r => r.status === ReportStatus.ASSIGNED).length,
    completed: reports.filter(r => r.status === ReportStatus.COMPLETED).length,
    totalUsers: pickers.length + citizens.length,
    totalWeight: reports.filter(r => r.status === ReportStatus.COMPLETED).reduce((sum, r) => sum + (r.collectedWeight || 0), 0)
  };

  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t.adminConsole}</h1>
          <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{t.tagline}</p>
        </div>
        <div className={`flex p-1 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-md transition-all text-sm font-semibold ${activeTab === 'reports' ? 'bg-emerald-600 text-white' : theme === 'dark' ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {t.totalReports}
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md transition-all text-sm font-semibold ${activeTab === 'users' ? 'bg-emerald-600 text-white' : theme === 'dark' ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {lang === 'EN' ? "Manage Users" : "उपयोगकर्ता प्रबंधित करें"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard theme={theme} title={t.pending} value={stats.pending} icon={<AlertCircle className="text-amber-500" />} />
        <StatCard theme={theme} title={t.assigned} value={stats.assigned} icon={<Clock className="text-blue-500" />} />
        <StatCard theme={theme} title={t.completed} value={stats.completed} icon={<CheckCircle2 className="text-emerald-500" />} />
        <StatCard theme={theme} title={lang === 'EN' ? "Users" : "उपयोगकर्ता"} value={stats.totalUsers} icon={<Users className="text-slate-500" />} />
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
                    <React.Fragment key={report.id}>
                      <tr className={`transition-colors ${report.needsReassignment ? (theme === 'dark' ? 'bg-red-900/10 hover:bg-red-900/20' : 'bg-red-50 hover:bg-red-100/50') : (theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50')}`}>
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
                              <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold uppercase w-fit">
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
                        <td className="px-6 py-4 text-sm">{report.assignedPickerName || (lang === 'EN' ? 'Unassigned' : 'अनिर्दिष्ट')}</td>
                        <td className="px-6 py-4 text-right">
                          {report.status === ReportStatus.PENDING ? (
                            <div className="flex justify-end items-center gap-2">
                              <select 
                                className={`text-sm border rounded p-1 outline-none focus:ring-1 focus:ring-emerald-500 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200'}`}
                                onChange={(e) => handleAssign(report.id, e.target.value)}
                                defaultValue=""
                              >
                                <option value="" disabled>{lang === 'EN' ? "Select Picker" : "पिकर चुनें"}</option>
                                {pickers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </div>
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
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className={`rounded-xl shadow-sm border p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Briefcase className="text-blue-500" size={20} />
              {t.picker} ({pickers.length})
            </h3>
            <div className="space-y-4">
              {pickers.map(p => {
                const totalWeight = getPickerTotalWeight(p.id);
                return (
                  <div key={p.id} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${theme === 'dark' ? 'border-slate-700 hover:border-blue-500/50 bg-slate-900/50' : 'border-slate-100 hover:border-blue-200'}`}>
                    <div className="flex-grow">
                      <p className="font-semibold">{p.name}</p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{p.email} • {p.phone}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        <span className="text-xs font-bold text-emerald-500">{totalWeight} kg</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={`rounded-xl shadow-sm border p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Users className="text-emerald-500" size={20} />
              {t.citizen} ({citizens.length})
            </h3>
            <div className="space-y-4">
              {citizens.map(c => (
                <div key={c.id} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${theme === 'dark' ? 'border-slate-700 hover:border-emerald-500/50 bg-slate-900/50' : 'border-slate-100 hover:border-emerald-200'}`}>
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