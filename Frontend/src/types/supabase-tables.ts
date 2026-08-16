// Assumed Supabase table types for SmartFlood
// Residents, Families, Applications, ReliefInventory

export type Resident = {
  id: string;
  name: string;
  family_id: string;
  address: string;
  phone: string;
  created_at: string;
};

export type Family = {
  id: string;
  head_name: string;
  address: string;
  members_count: number;
  created_at: string;
};

export type Application = {
  id: string;
  resident_id: string;
  type: string; // e.g., 'relief', 'verification'
  status: string; // e.g., 'pending', 'approved', 'rejected'
  submitted_at: string;
};

export type ReliefInventory = {
  id: string;
  item_name: string;
  quantity: number;
  updated_at: string;
};

// Update these types if your Supabase schema differs.
