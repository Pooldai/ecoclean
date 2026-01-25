
import React, { useState, useEffect } from 'react';
import { DB } from '../db';
import { WasteReport, User, UserRole, ReportStatus, Feedback } from '../types';
import { 
  Users, AlertCircle, CheckCircle2, 
  MapPin, Clock, Trash2, Filter, ChevronRight, Scale, RotateCcw, MessageSquare, Star
} from 'lucide-react';

const AdminDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [pickers, setPickers] = useState<User[]>([]);
  const [citizens, setCitizens] = useState<User[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'users'>('reports');

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Administrator Console</h1>
          <p className="text-slate-500">Monitor urban waste management operations and personnel.</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg shadow-sm border border-slate-200">
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-md transition-all ${activeTab === 'reports' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Waste Reports
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md transition-all ${activeTab === 'users' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Manage Users
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Pending" value={stats.pending} icon={<AlertCircle className="text-amber-500" />} />
        <StatCard title="Assigned" value={stats.assigned} icon={<Clock className="text-blue-500" />} />
        <StatCard title="Completed" value={stats.completed} icon={<CheckCircle2 className="text-emerald-500" />} />
        <StatCard title="Users" value={stats.totalUsers} icon={<Users className="text-slate-500" />} />
        <StatCard title="Total (kg)" value={stats.totalWeight} icon={<Scale className="text-emerald-600" />} />
      </div>

      {activeTab === 'reports' ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Trash2 className="text-emerald-600" size={20} />
              Live Waste Reports
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm font-semibold border-b border-slate-100">
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Reporter</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-center">Weight</th>
                  <th className="px-6 py-4">Assignee</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      No waste reports submitted yet.
                    </td>
                  </tr>
                ) : reports.map(report => {
                  const fb = getReportFeedback(report.id);
                  return (
                    <React.Fragment key={report.id}>
                      <tr className={`transition-colors ${report.needsReassignment ? 'bg-red-50 hover:bg-red-100/50' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${
                              report.status === ReportStatus.PENDING ? 'bg-amber-100 text-amber-700' :
                              report.status === ReportStatus.ASSIGNED ? 'bg-blue-100 text-blue-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {report.status}
                            </span>
                            {report.needsReassignment && (
                              <span className="px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-bold uppercase w-fit">
                                Flagged for Reassignment
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">{report.citizenName}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 max-w-[200px] truncate">{report.location.address}</td>
                        <td className="px-6 py-4 text-sm text-center font-bold text-emerald-700">
                          {report.collectedWeight ? `${report.collectedWeight} kg` : '--'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{report.assignedPickerName || 'Unassigned'}</td>
                        <td className="px-6 py-4 text-right">
                          {report.status === ReportStatus.PENDING ? (
                            <div className="flex justify-end items-center gap-2">
                              <select 
                                className="text-sm border border-slate-200 rounded p-1 outline-none focus:ring-1 focus:ring-emerald-500"
                                onChange={(e) => handleAssign(report.id, e.target.value)}
                                defaultValue=""
                              >
                                <option value="" disabled>Select Picker</option>
                                {pickers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </div>
                          ) : report.needsReassignment ? (
                            <button 
                              onClick={() => handleReassignReset(report.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md shadow-sm transition-all active:scale-95"
                            >
                              <RotateCcw size={14} />
                              Reset & Reassign
                            </button>
                          ) : (
                            <span className="text-slate-400 text-sm">--</span>
                          )}
                        </td>
                      </tr>
                      {report.needsReassignment && fb && (
                        <tr className="bg-red-50/50">
                          <td colSpan={6} className="px-6 pb-4 pt-0">
                            <div className="flex items-start gap-3 p-3 bg-white border border-red-100 rounded-lg text-xs">
                              <MessageSquare size={14} className="text-red-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="font-bold text-red-800 mb-1">Citizen Feedback (verification failed):</p>
                                <p className="text-slate-600 italic">"{fb.comment || 'No specific comment provided.'}"</p>
                                <div className="mt-2 flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={10} className={i < fb.rating ? "text-amber-400 fill-current" : "text-slate-200"} />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Garbage Pickers */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
              <BriefcaseIcon className="text-blue-600" size={20} />
              Garbage Pickers ({pickers.length})
            </h3>
            <div className="space-y-4">
              {pickers.map(p => {
                const totalWeight = getPickerTotalWeight(p.id);
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-blue-200 transition-colors">
                    <div className="flex-grow">
                      <p className="font-semibold text-slate-700">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.email} • {p.phone}</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                        <span className="text-xs font-bold text-emerald-700">{totalWeight} kg</span>
                      </div>
                      <ChevronRight size={18} className="text-slate-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Citizens */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-800">
              <UserIcon className="text-emerald-600" size={20} />
              Citizens ({citizens.length})
            </h3>
            <div className="space-y-4">
              {citizens.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-emerald-200 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-700">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.email}</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string, value: number | string, icon: React.ReactNode }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
    <div>
      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{title}</p>
      <p className="text-xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
    <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
  </div>
);

const BriefcaseIcon = ({ className, size }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const UserIcon = ({ className, size }: { className?: string, size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

export default AdminDashboard;
