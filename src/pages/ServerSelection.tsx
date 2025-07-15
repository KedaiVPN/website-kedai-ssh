import { useParams, Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Zap, Clock } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';

const PROTOCOL_CONFIGS = {
  ssh: {
    title: 'SSH Servers',
    description: 'Secure Shell servers for secure remote access',
    color: 'bg-blue-500'
  },
  vmess: {
    title: 'VMESS Servers', 
    description: 'VMess protocol servers for enhanced security',
    color: 'bg-green-500'
  },
  vless: {
    title: 'VLESS Servers',
    description: 'VLESS protocol servers for lightweight connections',
    color: 'bg-purple-500'
  },
  trojan: {
    title: 'Trojan Servers',
    description: 'Trojan protocol servers for stealth connections',
    color: 'bg-red-500'
  }
};

const SAMPLE_SERVERS = [
  {
    id: 1,
    name: 'Singapore 1',
    location: 'Singapore',
    ping: '15ms',
    users: 45,
    status: 'online'
  },
  {
    id: 2,
    name: 'Tokyo 1',
    location: 'Japan',
    ping: '8ms',
    users: 32,
    status: 'online'
  },
  {
    id: 3,
    name: 'US West 1',
    location: 'United States',
    ping: '120ms',
    users: 78,
    status: 'online'
  },
  {
    id: 4,
    name: 'Germany 1',
    location: 'Germany',
    ping: '85ms',
    users: 23,
    status: 'maintenance'
  }
];

export default function ServerSelection() {
  const { protocol } = useParams<{ protocol: string }>();
  const { isMenuOpen } = useSidebar();
  
  if (!protocol || !PROTOCOL_CONFIGS[protocol as keyof typeof PROTOCOL_CONFIGS]) {
    return <Navigate to="/" replace />;
  }

  const config = PROTOCOL_CONFIGS[protocol as keyof typeof PROTOCOL_CONFIGS];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 transition-[margin-left] duration-300 ${isMenuOpen ? '-ml-64' : 'ml-0'}`}>
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 gradient-move">
              {config.title}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {config.description}
            </p>
          </div>

          {/* Servers Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SAMPLE_SERVERS.map((server) => (
              <Card key={server.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {server.name}
                    </CardTitle>
                    <Badge variant={server.status === 'online' ? 'default' : 'secondary'}>
                      {server.status}
                    </Badge>
                  </div>
                  <CardDescription>{server.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Ping:</span>
                      </div>
                      <span className="font-medium">{server.ping}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Users:</span>
                      </div>
                      <span className="font-medium">{server.users}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span>Protocol:</span>
                      </div>
                      <span className="font-medium uppercase">{protocol}</span>
                    </div>

                    <Button 
                      className="w-full mt-4" 
                      disabled={server.status !== 'online'}
                    >
                      {server.status === 'online' ? 'Select Server' : 'Maintenance'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}