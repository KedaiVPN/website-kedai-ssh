export interface ApiKey {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Droplet {
  id: number;
  name: string;
  status: string;
  created_at: string;
  region: {
    name: string;
    slug: string;
  };
  networks: {
    v4: {
      ip_address: string;
      type: string;
    }[];
  };
}

export interface AccountInfo {
  email: string;
  email_verified: boolean;
  status: string;
  droplet_limit: number;
}

export interface Balance {
  month_to_date_balance: string;
  account_balance: string;
  generated_at: string;
}

export interface Region {
  slug: string;
  name: string;
  available: boolean;
}

export interface Size {
  slug: string;
  memory: number;
  vcpus: number;
  disk: number;
  price_monthly: number;
  available: boolean;
}

export interface Image {
  id: number;
  slug: string;
  name: string;
  distribution: string;
  type: string;
}

export interface SshKey {
  id: number;
  name: string;
  fingerprint: string;
  public_key: string;
  digitalocean_id: number;
}
