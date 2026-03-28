export type AuthProvider = 'MANUAL' | 'GOOGLE' | 'APPLE' | 'WHATSAPP';
export type AccountStatus = 'ACTIVE' | 'PENDING' | 'BLOCKED';

export interface UserProfile {
  id: string; // Firebase UID
  auth_provider: AuthProvider;
  social_id?: string;
  email: string;
  full_name: string;
  phone_number?: string;
  preferred_pickup_point_id?: string;
  is_profile_complete: boolean;
  my_invite_code: string; // e.g. MAY-X7Y2
  referred_by_id?: string;
  rewards_points: number;
  account_status: AccountStatus;
  created_at: any; // Firestore ServerTimestamp
}

export interface PickupPoint {
  id: string;
  name: string;
  address: string;
}
