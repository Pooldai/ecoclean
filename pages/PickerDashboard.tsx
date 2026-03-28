
import React, { useState, useEffect } from 'react';
import { DB } from '../db';
import { WasteReport, User, ReportStatus, Language, Theme, Feedback } from '../types';
import { MapPin, CheckCircle, Camera, Navigation, User as UserIcon, X, Mail, Phone, Save, CheckCircle2, Star } from 'lucide-react';
import { useTranslation } from '../translations';

const PickerDashboard: React.FC<{ user: User, lang: Language, theme: Theme }> = ({ user, lang, theme }) => {
  const [tasks, setTasks] = useState<WasteReport[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedTask, setSelectedTask] = useState<WasteReport | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [proofImage, setProofImage] = useState('');
  const [weight, setWeight] = useState<number>(5);
  const [activeTab, setActiveTab] = useState<'tasks' | 'profile'>('tasks');
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    profilePictureUrl: user.profilePictureUrl || ''
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const t = useTranslation(lang);

  const weightOptions = Array.from({ length: 10 }, (_, i) => (i + 1) * 5);

  useEffect(() => {
    loadTasks();
  }, [user.id]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const pickerTasks = await DB.getReportsByPickerId(user.id);
      setTasks(pickerTasks);
      const allFeedbacks = await DB.getFeedback();
      setFeedbacks(allFeedbacks.filter(f => f.pickerId === user.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const updatedReport: WasteReport = {
      ...selectedTask,
      status: ReportStatus.COMPLETED,
      completionProofUrl: proofImage,
      completedAt: Date.now(),
      collectedWeight: weight
    };

    try {
      await DB.updateReport(updatedReport);
      setTasks(tasks.filter(t => t.id !== selectedTask.id));
      setSelectedTask(null);
      setIsCompleting(false);
      setProofImage('');
      setWeight(5);
    } catch (err) {
      alert("Error finalizing task.");
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
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      alert("Error updating profile.");
    }
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
          <h1 className="text-3xl font-bold">{activeTab === 'tasks' ? t.taskQueue : t.profile}</h1>
        </div>
        <div className={`flex p-1 rounded-lg border shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <button onClick={() => setActiveTab('tasks')} className={`px-4 py-2 rounded-md transition-all text-sm font-semibold flex items-center gap-2 ${activeTab === 'tasks' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>
            <CheckCircle size={16} />
            {lang === 'EN' ? 'Tasks' : 'कार्य'}
          </button>
          <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-md transition-all text-sm font-semibold flex items-center gap-2 ${activeTab === 'profile' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>
            <UserIcon size={16} />
            {t.profile}
          </button>
        </div>
      </div>

      {activeTab === 'tasks' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="py-12 text-center text-slate-400">Loading tasks...</div>
            ) : tasks.length === 0 ? (
              <div className={`rounded-2xl border p-12 text-center shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500/20" />
                <p className="text-lg font-medium">{lang === 'EN' ? "All caught up!" : "सब कुछ पूरा हो गया!"}</p>
              </div>
            ) : (
              tasks.map(task => (
                <div key={task.id} className={`rounded-xl shadow-sm border p-4 transition-all flex flex-col md:flex-row gap-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} hover:border-emerald-500`}>
                  <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden shrink-0 border border-black/10">
                    <img src={task.photoUrl} alt="Litter" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-bold text-lg flex items-center gap-2"><MapPin size={18} /> {task.location.address}</h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={() => {setSelectedTask(task); setIsCompleting(true);}} className="py-2 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                        <CheckCircle size={16} /> {t.markComplete}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
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
              <div className="flex items-center gap-1.5 mb-4 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-1.5 rounded-full text-sm font-bold border border-amber-200 dark:border-amber-800 shadow-sm">
                <Star size={16} className="fill-amber-500" />
                {feedbacks.length > 0 ? (feedbacks.reduce((s,f) => s+f.rating, 0) / feedbacks.length).toFixed(1) : 'No ratings'} ({feedbacks.length} reviews)
              </div>
              <label className="cursor-pointer text-sm text-emerald-600 font-semibold hover:text-emerald-700 px-3 py-1 border border-emerald-200 rounded-full dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10">
                {lang === 'EN' ? 'Change Photo' : 'फ़ोटो बदलें'}
                <input type="file" accept="image/*" className="hidden" onChange={handleProfileImage} />
              </label>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">{t.name}</label>
              <input type="text" required className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">{t.email}</label>
              <input type="email" required disabled title="Email cannot be changed" className="w-full p-3 border rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:border-slate-700" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">{lang === 'EN' ? 'Phone Number' : 'फ़ोन नंबर'}</label>
              <input type="tel" className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600" value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} />
            </div>
            <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg">
              <Save size={20} className="inline mr-2" /> {t.saveChanges}
            </button>
          </form>
        </div>
      )}

      {isCompleting && selectedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
            <form onSubmit={handleCompleteTask} className="p-6 space-y-6">
               <div>
                  <label className="block text-sm font-bold mb-2">{t.weight}</label>
                  <select value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full p-3 border rounded-xl dark:bg-slate-700">
                    {weightOptions.map(opt => <option key={opt} value={opt}>{opt} kg</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">{t.uploadProof}</label>
                  <input type="file" onChange={handleProofFile} className="w-full p-3" />
                </div>
                <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl">Confirm Completion</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PickerDashboard;
