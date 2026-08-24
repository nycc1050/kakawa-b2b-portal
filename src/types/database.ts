// Hand-written types matching supabase/migrations/0001_init.sql.
// If the schema drifts, update this file alongside the migration.

export type UserRole = "admin" | "customer";
export type RequestStatus =
  | "submitted"
  | "in-review"
  | "approved"
  | "ready-to-order";
export type ProductSource = "scraped" | "manual";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

export type Tier = {
  id: string;
  name: string;
  base_discount_percent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type VolumeDiscount = {
  id: string;
  tier_id: string;
  min_quantity: number;
  additional_discount_percent: number;
  created_at: string;
};

export type Customer = {
  id: string;
  profile_id: string;
  company_name: string;
  phone: string | null;
  tier_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  shopify_product_id: number | null;
  title: string;
  handle: string | null;
  category: string | null;
  description: string | null;
  image_url: string | null;
  tags: string[];
  is_b2b_visible: boolean;
  source: ProductSource;
  created_at: string;
  updated_at: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  shopify_variant_id: number | null;
  variant_title: string | null;
  sku: string | null;
  b2c_price: number;
  weight_grams: number | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomizationRequest = {
  id: string;
  customer_id: string;
  product_id: string;
  variant_id: string | null;
  estimated_quantity: number | null;
  color_preferences: string | null;
  logo_file_url: string | null;
  embossing_details: string | null;
  special_instructions: string | null;
  status: RequestStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

type Relationships = [];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: Relationships;
      };
      tiers: {
        Row: Tier;
        Insert: Partial<Tier>;
        Update: Partial<Tier>;
        Relationships: Relationships;
      };
      volume_discounts: {
        Row: VolumeDiscount;
        Insert: Partial<VolumeDiscount>;
        Update: Partial<VolumeDiscount>;
        Relationships: Relationships;
      };
      customers: {
        Row: Customer;
        Insert: Partial<Customer>;
        Update: Partial<Customer>;
        Relationships: Relationships;
      };
      products: {
        Row: Product;
        Insert: Partial<Product>;
        Update: Partial<Product>;
        Relationships: Relationships;
      };
      product_variants: {
        Row: ProductVariant;
        Insert: Partial<ProductVariant>;
        Update: Partial<ProductVariant>;
        Relationships: Relationships;
      };
      customization_requests: {
        Row: CustomizationRequest;
        Insert: Partial<CustomizationRequest>;
        Update: Partial<CustomizationRequest>;
        Relationships: Relationships;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
