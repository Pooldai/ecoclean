
import React, { useState, useEffect } from 'react';
import { DB } from '../db';
import { WasteReport, User, UserRole, ReportStatus, Feedback, Language, Theme } from '../types';
import { 
  Users, AlertCircle, CheckCircle2, 
  MapPin, Clock, Trash2, Scale, RotateCcw, MessageSquare, Star, Briefcase, BarChart3, X
} from 'lucide-react';
import { useTranslation } from '../translations';

const AdminDashboard: React.FC<{ user: User, lang: Language, theme: Theme }> = ({ user, lang, theme }) => {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [pickers, setPickers] = useState<User[]>([]);
  const [citizens, setCitizens] = useState<User[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'analytics'>('reports');
  const [viewingFeedback, setViewingFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  
  const t = useTranslation(lang);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      const allReports = await DB.getReports();
      const allFeedback = await DB.getFeedback();
      const allUsers = await DB.getUsers();
      
      setReports(allReports);
      setFeedbacks(allFeedback);
      setPickers(allUsers.filter(u => u.role === UserRole.PICKER));
      setCitizens(allUsers.filter(u => u.role === UserRole.CITIZEN));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (reportId: string, pickerId: string) => {
    const picker = pickers.find(p => p.id === pickerId);
    if (!picker) return;

    const report = reports.find(r => r.id === reportId);
    if (report) {
      const updatedReport: WasteReport = {
        ...report,
        status: ReportStatus.ASSIGNED,
        assignedPickerId: picker.id,
        assignedPickerName: picker.name,
        needsReassignment: false,
        ...(report.needsReassignment ? { completionProofUrl: undefined, completedAt: undefined } : {})
      };
      await DB.updateReport(updatedReport);
      refreshData();
    }
  };

  const handleReassignReset = async (reportId: string) => {
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
      await DB.updateReport(updatedReport);
      refreshData();
    }
  };

  const stats = {
    pending: reports.filter(r => r.status === ReportStatus.PENDING).length,
    assigned: reports.filter(r => r.status === ReportStatus.ASSIGNED).length,
    completed: reports.filter(r => r.status === ReportStatus.COMPLETED).length,
    flagged: reports.filter(r => r.needsReassignment).length,
    totalWeight: reports.filter(r => r.status === ReportStatus.COMPLETED).reduce((sum, r) => sum + (Number(r.collectedWeight) || 0), 0)
  };

  const analyticsData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString(lang === 'HI' ? 'hi-IN' : 'en-US', { weekday: 'short' });
    const weight = reports.filter(r => 
      r.status === ReportStatus.COMPLETED && 
      r.completedAt && 
      new Date(Number(r.completedAt)).toISOString().split('T')[0] === dateStr
    ).reduce((sum, r) => sum + (Number(r.collectedWeight) || 0), 0);
    return { date: dateStr.slice(5), day: dayName, weight };
  }).reverse();

  const maxWeight = Math.max(...analyticsData.map(d => d.weight), 10);
  const avgWeight = (analyticsData.reduce((sum, d) => sum + d.weight, 0) / 7).toFixed(1);
  const peakDay = [...analyticsData].sort((a, b) => b.weight - a.weight)[0];

  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t.adminConsole}</h1>
        </div>
        <div className={`flex p-1 rounded-lg border shadow-sm overflow-x-auto ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          {['reports', 'analytics', 'users'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded-md text-sm font-semibold capitalize ${activeTab === tab ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">Refreshing database...</div>
      ) : activeTab === 'reports' ? (
        <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-xs uppercase font-bold text-slate-500 border-b dark:border-slate-700">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Assignee</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
              {reports.map(report => (
                <tr key={report.id} className={report.needsReassignment ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                  <td className="px-6 py-4 capitalize">
                    {report.status}
                    {report.needsReassignment && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-400">Needs Reassignment</span>}
                  </td>
                  <td className="px-6 py-4">{report.location.address}</td>
                  <td className="px-6 py-4">
                    {report.assignedPickerName || 'Unassigned'}
                    {report.needsReassignment && report.assignedPickerName && (
                      <div className="text-xs text-red-600 mt-1 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle size={12} /> Previous: {report.assignedPickerName}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                    {report.needsReassignment && feedbacks.find(f => f.reportId === report.id) && (
                      <button 
                        onClick={() => setViewingFeedback(feedbacks.find(f => f.reportId === report.id) || null)}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded"
                      >
                        <AlertCircle size={12}/> View Rejection
                      </button>
                    )}
                    {report.status === ReportStatus.PENDING && (
                      <select onChange={(e) => handleAssign(report.id, e.target.value)} className="text-xs p-1 rounded bg-slate-100 dark:bg-slate-700 outline-none">
                        <option>Assign Picker</option>
                        {pickers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'analytics' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Collected" value={`${stats.totalWeight} kg`} icon={<Scale className="text-emerald-500" />} theme={theme} />
            <StatCard title="7-Day Average" value={`${avgWeight} kg`} icon={<BarChart3 className="text-blue-500" />} theme={theme} />
            <StatCard title="Peak Day" value={peakDay.weight > 0 ? `${peakDay.day} (${peakDay.weight}kg)` : 'N/A'} icon={<Star className="text-amber-500" />} theme={theme} />
            <StatCard title="Completed Tasks" value={stats.completed} icon={<CheckCircle2 className="text-purple-500" />} theme={theme} />
          </div>

          <div className={`p-8 rounded-2xl border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-lg">Weekly Garbage Collection (kg)</h3>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="w-3 h-3 bg-emerald-500 rounded-full"></span> Total Weight
              </div>
            </div>
            
            <div className="h-64 flex items-end justify-between gap-2 md:gap-4 group">
              {analyticsData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full relative group/bar">
                    <div 
                      className={`w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-500 relative cursor-pointer hover:brightness-110 shadow-lg shadow-emerald-500/10`} 
                      style={{ height: `${(d.weight / maxWeight) * 100}%`, minHeight: d.weight > 0 ? '4px' : '0px' }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold pointer-events-none">
                        {d.weight} kg
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className={`text-[10px] font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{d.day}</p>
                    <p className="text-[9px] text-slate-400">{d.date}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {maxWeight === 0 && (
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-slate-400 font-medium">No collection data for this period</p>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'users' ? (
        <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 text-xs uppercase font-bold text-slate-500 border-b dark:border-slate-700">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Address</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
              {[...pickers, ...citizens].map(u => {
                const userFeedbacks = feedbacks.filter(f => f.pickerId === u.id);
                const avgRating = userFeedbacks.length ? (userFeedbacks.reduce((sum, f) => sum + f.rating, 0) / userFeedbacks.length).toFixed(1) : 'N/A';
                return (
                <tr key={u.id}>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                      {u.profilePictureUrl ? (
                        <img src={u.profilePictureUrl} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-400 font-bold uppercase">{u.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 capitalize">{u.role.toLowerCase()}</td>
                  <td className="px-6 py-4">
                    {u.phone || '-'}
                    {u.role === UserRole.PICKER && (
                      <div className="flex items-center text-xs mt-1 text-amber-500 font-semibold gap-1">
                        <Star size={12} className="fill-amber-500" /> {avgRating} ({userFeedbacks.length} reviews)
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm max-w-[200px] truncate" title={u.address}>{u.address || '-'}</td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      ) : null}

      {viewingFeedback && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${theme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-slate-100 bg-slate-50'}`}>
              <h2 className="text-xl font-bold flex items-center gap-2"><AlertCircle className="text-red-500"/> Rejection Details</h2>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setViewingFeedback(null)}><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-500">Citizen:</span>
                <span className="font-bold">{viewingFeedback.userName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-slate-500">Rating Provided:</span>
                <span className="flex text-amber-500 gap-1">
                  {Array.from({length: 5}).map((_, i) => <Star key={i} size={16} fill={i < viewingFeedback.rating ? 'currentColor' : 'none'} className={i < viewingFeedback.rating ? 'text-amber-500' : 'text-slate-300'} />)}
                </span>
              </div>
              <div className="flex justify-between items-start text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800">
                <span className="font-semibold text-red-800 dark:text-red-300 whitespace-nowrap mr-4">Reason:</span>
                <span className="text-right flex-1 text-red-900 dark:text-red-200 font-medium">"{viewingFeedback.comment || 'No reason provided'}"</span>
              </div>
              
              {reports.find(r => r.id === viewingFeedback.reportId)?.completionProofUrl && (
                <div className="mt-6">
                  <span className="font-bold text-slate-500 text-sm block mb-2 uppercase tracking-wide">Legacy Proof Photo:</span>
                  <div className="rounded-xl overflow-hidden border dark:border-slate-700 shadow-sm relative group h-48">
                    <img src={reports.find(r => r.id === viewingFeedback.reportId)?.completionProofUrl!} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Legacy completion proof" />
                  </div>
                </div>
              )}
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
      <p className={`text-[10px] uppercase font-bold tracking-wider text-slate-500`}>{title}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>{icon}</div>
  </div>
);

export default AdminDashboard;
