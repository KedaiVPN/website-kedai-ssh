-- Create users table for authentication
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  auth_provider TEXT DEFAULT 'local' CHECK (auth_provider IN ('local', 'google')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vpn_accounts table (renamed from User)
CREATE TABLE public.vpn_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password TEXT,
  protocol TEXT NOT NULL CHECK (protocol IN ('ssh', 'vmess', 'vless', 'trojan')),
  server_id INTEGER NOT NULL,
  duration INTEGER DEFAULT 1,
  quota INTEGER DEFAULT 0,
  ip_limit INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create servers table to mirror SQLite structure
CREATE TABLE public.servers (
  id SERIAL PRIMARY KEY,
  domain TEXT NOT NULL,
  auth TEXT NOT NULL,
  nama_server TEXT NOT NULL,
  quota INTEGER DEFAULT 100,
  iplimit INTEGER DEFAULT 2,
  batas_create_akun INTEGER DEFAULT 1000,
  total_create_akun INTEGER DEFAULT 0,
  protocols TEXT DEFAULT 'ssh,vmess,vless,trojan',
  location TEXT DEFAULT 'Unknown',
  ping INTEGER DEFAULT 0,
  status TEXT DEFAULT 'online'
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vpn_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- Create policies for vpn_accounts table
CREATE POLICY "Users can view their own VPN accounts" 
ON public.vpn_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create VPN accounts" 
ON public.vpn_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policies for servers table
CREATE POLICY "Anyone can view servers" 
ON public.servers 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can modify servers" 
ON public.servers 
FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_vpn_accounts_user_id ON public.vpn_accounts(user_id);
CREATE INDEX idx_vpn_accounts_server_id ON public.vpn_accounts(server_id);
CREATE INDEX idx_vpn_accounts_protocol ON public.vpn_accounts(protocol);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_username ON public.users(username);