
import { User, WasteReport, Feedback } from './types';
import { supabase } from './supabaseClient';

export const DB = {
  // --- USERS ---
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data || [];
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Supabase fetch error (getUserByEmail):", error);
      throw error;
    }
    return data;
  },

  saveUser: async (user: User) => {
    const { error } = await supabase.from('profiles').insert([user]);
    if (error) {
      console.error("Supabase insert error (profiles):", error);
      throw error;
    }
  },

  updateUser: async (updatedUser: User) => {
    const { error } = await supabase.from('profiles').update(updatedUser).eq('id', updatedUser.id);
    if (error) throw error;
    
    // Update session locally if needed
    const session = DB.getSession();
    if (session && session.id === updatedUser.id) {
      DB.setSession(updatedUser);
    }
  },

  // --- REPORTS ---
  getReports: async (): Promise<WasteReport[]> => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getReportsByCitizenId: async (citizenId: string): Promise<WasteReport[]> => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('citizenId', citizenId)
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getReportsByPickerId: async (pickerId: string): Promise<WasteReport[]> => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('assignedPickerId', pickerId)
      .eq('status', 'ASSIGNED')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getPendingReports: async (): Promise<WasteReport[]> => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('status', 'PENDING')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  saveReport: async (report: WasteReport) => {
    const { error } = await supabase.from('reports').insert([report]);
    if (error) {
      console.error("Supabase insert error (reports):", error);
      throw error;
    }
  },

  updateReport: async (updatedReport: WasteReport) => {
    const { error } = await supabase.from('reports').update(updatedReport).eq('id', updatedReport.id);
    if (error) throw error;
  },

  // --- FEEDBACK ---
  getFeedback: async (): Promise<Feedback[]> => {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  saveFeedback: async (fb: Feedback) => {
    const { error } = await supabase.from('feedback').insert([fb]);
    if (error) throw error;
  },

  // --- SESSION (Temporary Frontend Helper) ---
  setSession: (user: User | null) => {
    if (user) {
      localStorage.setItem('ecoclean_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('ecoclean_session');
    }
  },

  getSession: (): User | null => {
    const data = localStorage.getItem('ecoclean_session');
    return data ? JSON.parse(data) : null;
  }
};
