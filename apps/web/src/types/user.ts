export type UserRole = "patient" | "healthcare_worker";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  facilityName?: string;
  avatarUrl?: string;
}
