import { User, WasteReport, UserRole, ReportStatus, Feedback } from './types';

const STORAGE_KEYS = {
  USERS: 'ecoclean_users',
  REPORTS: 'ecoclean_reports',
  FEEDBACK: 'ecoclean_feedback',
  SESSION: 'ecoclean_session'
};

// Initial Data
const DEFAULT_ADMIN: User = {
  id: 'admin-1',
  email: 'admin@ecoclean.com',
  name: 'System Admin',
  role: UserRole.ADMIN,
  createdAt: Date.now()
};

export const DB = {
  getUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    const users = data ? JSON.parse(data) : [];
    if (users.length === 0) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([DEFAULT_ADMIN]));
      return [DEFAULT_ADMIN];
    }
    return users;
  },

  saveUser: (user: User) => {
    const users = DB.getUsers();
    users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  updateUser: (updatedUser: User) => {
    const users = DB.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      
      // Update session if it's the current user
      const session = DB.getSession();
      if (session && session.id === updatedUser.id) {
        DB.setSession(updatedUser);
      }
    }
  },

  getReports: (): WasteReport[] => {
    const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
    return data ? JSON.parse(data) : [];
  },

  saveReport: (report: WasteReport) => {
    const reports = DB.getReports();
    reports.push(report);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  },

  updateReport: (updatedReport: WasteReport) => {
    const reports = DB.getReports();
    const index = reports.findIndex(r => r.id === updatedReport.id);
    if (index !== -1) {
      reports[index] = updatedReport;
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    }
  },

  getFeedback: (): Feedback[] => {
    const data = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    return data ? JSON.parse(data) : [];
  },

  saveFeedback: (fb: Feedback) => {
    const feedback = DB.getFeedback();
    feedback.push(fb);
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(feedback));
  },

  setSession: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  },

  getSession: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  }
};