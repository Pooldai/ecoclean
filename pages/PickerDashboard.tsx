import React, { useState, useEffect } from 'react';
import { DB } from '../db';
import { WasteReport, User, ReportStatus, Language, Theme } from '../types';
import { MapPin, CheckCircle, Camera, Navigation, AlertCircle, ChevronRight, X, Scale } from 'lucide-react';
import { useTranslation } from '../translations';

const PickerDashboard: React.FC<{ user: User, lang: Language, theme: Theme }> = ({ user, lang, theme }) => {
  const [tasks, setTasks] = useState<WasteReport[]>([]);
  const [selectedTask, setSelectedTask] = useState<WasteReport | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [proofImage, setProofImage] = useState('');
  const [weight, setWeight] = useState<number>(5);
  const t = useTranslation(lang);

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
    <div className={`max-w-7xl mx-auto px-4 py-8 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t.taskQueue}</h1>
        <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>{lang === 'EN' ? "Manage your assigned locations." : "अपने आवंटित स्थानों को प्रबंधित करें।"}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {tasks.length === 0 ? (
            <div className={`rounded-2xl border p-12 text-center shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>
              <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500/20" />
              <p className="text-lg font-medium">{lang === 'EN' ? "All caught up!" : "सब कुछ पूरा हो गया!"}</p>
            </div>
          ) : (
            tasks.map(task => (
              <div 
                key={task.id} 
                className={`rounded-xl shadow-sm border p-4 transition-all flex flex-col md:flex-row gap-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} hover:border-emerald-500`}
              >
                <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden shrink-0 border border-black/10">
                  <img src={task.photoUrl} alt="Litter" className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <MapPin size={18} className="text-slate-500" />
                    {task.location.address}
                  </h3>
                  <p className={`text-sm mt-1 line-clamp-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{task.description}</p>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button 
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(task.location.address)}`, '_blank')}
                      className={`py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${theme === 'dark' ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      <Navigation size={16} />
                      {t.navigate}
                    </button>
                    <button 
                      onClick={() => {setSelectedTask(task); setIsCompleting(true);}}
                      className="py-2 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} />
                      {t.markComplete}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800 rounded-2xl p-6 text-white shadow-xl">
            <h3 className="font-bold text-xl mb-4">{lang === 'EN' ? "Performance" : "प्रदर्शन"}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-slate-400 text-sm">{lang === 'EN' ? "Tasks Assigned" : "सौंपे गए कार्य"}</span>
                <span className="font-bold">{tasks.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">{lang === 'EN' ? "Weight Collected" : "एकत्रित वजन"}</span>
                <span className="font-bold text-emerald-400">
                  {DB.getReports()
                    .filter(r => r.assignedPickerId === user.id && r.status === ReportStatus.COMPLETED)
                    .reduce((acc, curr) => acc + (curr.collectedWeight || 0), 0)} kg
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isCompleting && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
            <div className={`p-6 border-b flex justify-between items-center ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50'}`}>
              <h2 className="text-xl font-bold">{t.finalize}</h2>
              <button onClick={() => setIsCompleting(false)} className="text-slate-400"><X /></button>
            </div>
            <form onSubmit={handleCompleteTask} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2">{t.weight}</label>
                <select 
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className={`w-full p-3 border rounded-xl outline-none ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-50 border-slate-200'}`}
                >
                  {weightOptions.map(opt => <option key={opt} value={opt}>{opt} kg</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">{t.uploadProof}</label>
                {!proofImage ? (
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
                    <Camera size={40} className="mx-auto mb-2 text-slate-500" />
                    <input type="file" accept="image/*" className="hidden" id="proof-upload" onChange={handleProofFile} />
                    <label htmlFor="proof-upload" className="mt-4 inline-block px-6 py-2 bg-slate-800 text-white rounded-lg text-sm cursor-pointer">{lang === 'EN' ? "Upload Image" : "छवि अपलोड करें"}</label>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden h-48">
                    <img src={proofImage} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setProofImage('')} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"><X size={16} /></button>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setIsCompleting(false)} className="flex-1 px-4 py-3 border rounded-xl text-slate-500 font-bold">{lang === 'EN' ? "Cancel" : "रद्द करें"}</button>
                <button type="submit" disabled={!proofImage} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-bold py-3 rounded-xl">{t.confirm}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PickerDashboard;