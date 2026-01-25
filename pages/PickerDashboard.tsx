
import React, { useState, useEffect } from 'react';
import { DB } from '../db';
import { WasteReport, User, ReportStatus } from '../types';
import { MapPin, CheckCircle, Camera, Navigation, AlertCircle, ChevronRight, X, Scale } from 'lucide-react';

const PickerDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [tasks, setTasks] = useState<WasteReport[]>([]);
  const [selectedTask, setSelectedTask] = useState<WasteReport | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [proofImage, setProofImage] = useState('');
  const [weight, setWeight] = useState<number>(5);

  const weightOptions = Array.from({ length: 10 }, (_, i) => (i + 1) * 5);

  useEffect(() => {
    const allReports = DB.getReports();
    setTasks(allReports.filter(r => r.assignedPickerId === user.id && r.status === ReportStatus.ASSIGNED));
  }, [user.id]);

  const handleCompleteTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const updatedReport: WasteReport = {
      ...selectedTask,
      status: ReportStatus.COMPLETED,
      completionProofUrl: proofImage,
      completedAt: Date.now(),
      collectedWeight: weight
    };

    DB.updateReport(updatedReport);
    setTasks(tasks.filter(t => t.id !== selectedTask.id));
    setSelectedTask(null);
    setIsCompleting(false);
    setProofImage('');
    setWeight(5);
  };

  const handleProofFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">My Task Queue</h1>
        <p className="text-slate-500">View and manage your assigned waste cleanup locations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {tasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm">
              <CheckCircle size={48} className="mx-auto mb-4 text-emerald-100" />
              <p className="text-lg font-medium text-slate-600">All caught up!</p>
              <p className="text-sm">You have no pending tasks. Enjoy your break!</p>
            </div>
          ) : (
            tasks.map(task => (
              <div 
                key={task.id} 
                className={`bg-white rounded-xl shadow-sm border p-4 transition-all flex flex-col md:flex-row gap-4 hover:border-emerald-300 ${selectedTask?.id === task.id ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200'}`}
              >
                <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                  <img src={task.photoUrl} alt="Litter" className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Priority: High</span>
                    <span className="text-[10px] text-slate-400">ID: {task.id.slice(-6)}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <MapPin size={18} className="text-slate-400" />
                    {task.location.address}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{task.description}</p>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button 
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(task.location.address)}`, '_blank')}
                      className="flex-grow sm:flex-grow-0 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Navigation size={16} />
                      Navigate
                    </button>
                    <button 
                      onClick={() => {setSelectedTask(task); setIsCompleting(true);}}
                      className="flex-grow sm:flex-grow-0 py-2 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-emerald-100"
                    >
                      <CheckCircle size={16} />
                      Mark Complete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-xl">
            <h3 className="font-bold text-xl mb-4">Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-slate-400 text-sm">Tasks Assigned</span>
                <span className="font-bold">{tasks.length}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-slate-400 text-sm">Total Weight Collected</span>
                <span className="font-bold text-emerald-400">
                  {DB.getReports()
                    .filter(r => r.assignedPickerId === user.id && r.status === ReportStatus.COMPLETED)
                    .reduce((acc, curr) => acc + (curr.collectedWeight || 0), 0)} kg
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400 text-sm">Average Rating</span>
                <span className="font-bold text-amber-400 flex items-center gap-1">
                  4.8 ★
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-500" />
              Current Area Hazards
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-xs text-amber-700">
                <strong>Main St:</strong> High traffic alert until 6:00 PM.
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700">
                <strong>Central Park:</strong> Public event scheduled for tomorrow.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {isCompleting && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Finalize Cleanup</h2>
              <button onClick={() => setIsCompleting(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
            </div>
            <form onSubmit={handleCompleteTask} className="p-6 space-y-6">
              <div className="flex gap-4 p-3 bg-slate-50 rounded-xl items-center">
                <img src={selectedTask.photoUrl} className="w-16 h-16 rounded object-cover border" />
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Location</p>
                  <p className="text-sm font-bold text-slate-800">{selectedTask.location.address}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Scale size={16} className="text-emerald-600" />
                    Weight of Collected Garbage
                  </label>
                  <div className="relative">
                    <select 
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-700"
                    >
                      {weightOptions.map(opt => (
                        <option key={opt} value={opt}>{opt} kg</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronRight size={18} className="rotate-90" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Camera size={16} className="text-emerald-600" />
                    Upload Proof of Cleanup
                  </label>
                  {!proofImage ? (
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                      <Camera size={40} className="mx-auto mb-2 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                      <p className="text-sm text-slate-500 font-medium">Take a photo of the cleared area</p>
                      <input type="file" accept="image/*" className="hidden" id="proof-upload" onChange={handleProofFile} />
                      <label htmlFor="proof-upload" className="mt-4 inline-block px-6 py-2 bg-slate-800 text-white rounded-lg text-sm cursor-pointer hover:bg-slate-900 transition-all shadow-md">Open Camera</label>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden h-64 border-4 border-emerald-100 group">
                      <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setProofImage('')}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCompleting(false)}
                  className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!proofImage}
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-100"
                >
                  Confirm Completion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PickerDashboard;
