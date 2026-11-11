export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  role: 'patient' | 'donor' | 'hospital' | 'admin';
  is_demo?: boolean;
}

export interface BloodRequest {
  id: string;
  patient_id: string;
  hospital_id: string;
  blood_group: string;
  units_required: number;
  urgency_level: 'routine' | 'urgent' | 'critical';
  status: 'pending' | 'accepted' | 'coordinated' | 'fulfilled' | 'cancelled';
  required_by?: string;
  clinical_notes?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface DonorProfile {
  id: string;
  user_id: string;
  blood_group: string;
  availability_status: 'available' | 'busy' | 'deferred';
  city?: string;
  latitude?: number;
  longitude?: number;
  travel_radius_km?: number;
  is_verified?: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_number: string;
  is_verified: boolean;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

