
export enum UserRole {
  ADMIN = 'ADMIN',
  CITIZEN = 'CITIZEN',
  PICKER = 'PICKER'
}

export enum ReportStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  createdAt: number;
}

export interface WasteReport {
  id: string;
  citizenId: string;
  citizenName: string;
  photoUrl: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  description: string;
  status: ReportStatus;
  aiAnalysis?: string;
  createdAt: number;
  assignedPickerId?: string;
  assignedPickerName?: string;
  completionProofUrl?: string;
  completedAt?: number;
  collectedWeight?: number; // In kilograms
  needsReassignment?: boolean;
}

export interface Feedback {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  isCleaned: boolean;
  createdAt: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
