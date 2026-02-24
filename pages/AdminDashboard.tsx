
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
        needsReassignment: false
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
    const weight = reports.filter(r => 
      r.status === ReportStatus.COMPLETED && 
      r.completedAt && 
      new Date(Number(r.completedAt)).toISOString().split('T')[0] === dateStr
    ).reduce((sum, r) => sum + (Number(r.collectedWeight) || 0), 0);
    return { date: dateStr.slice(5), weight };
  }).reverse();

  const maxWeight = Math.max(...analyticsData.map(d => d.weight), 10);

  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t.adminConsole}</h1>
        </div>
        <div className={`flex p-1 rounded-lg border shadow-sm overflow-x-auto ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          {['reports', 'analytics', 'feedback', 'users'].map((tab) => (
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
                <tr key={report.id}>
                  <td className="px-6 py-4 capitalize">{report.status}</td>
                  <td className="px-6 py-4">{report.location.address}</td>
                  <td className="px-6 py-4">{report.assignedPickerName || 'Unassigned'}</td>
                  <td className="px-6 py-4 text-right">
                    {report.status === ReportStatus.PENDING && (
                      <select onChange={(e) => handleAssign(report.id, e.target.value)} className="text-xs p-1 rounded bg-slate-100 dark:bg-slate-700">
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
        <div className="h-64 flex items-end justify-between gap-4 p-8 border rounded-xl dark:border-slate-700">
          {analyticsData.map((d, i) => (
            <div key={i} className="flex-1 bg-emerald-500 rounded-t" style={{ height: `${(d.weight / maxWeight) * 100}%` }} title={`${d.weight} kg`}></div>
          ))}
        </div>
      ) : null}
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
