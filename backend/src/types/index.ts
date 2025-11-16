export interface User {
    id: number;
    name: string;
    email: string;
    password_hash?: string;
    phone_number?: string;
    role: 'passenger' | 'driver' | 'agent' | 'company' | 'admin';
    avatar_url: string;
    status: 'Active' | 'Suspended' | 'Pending';
    company_id?: number;
    created_at: string;
    updated_at: string;
    // FIX: Added optional properties to match database schema and dynamic properties.
    pin?: string;
    serial_code?: string;
    loyalty_points?: number;
    wallet_balance?: number; // This is joined, not a column
}