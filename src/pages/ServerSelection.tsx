import { useParams, Navigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Zap, Clock } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { getPingColor, getStatusBadge } from '@/lib/utils';

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
    ping: '15',
    users: 45,
    status: 'online' as const,
    batas_create_akun: 100,
    total_create_akun: 45
  },
  {
    id: 2,
    name: 'Tokyo 1',
    location: 'Japan',
    ping: '8',
    users: 32,
    status: 'online' as const,
    batas_create_akun: 80,
    total_create_akun: 32
  },
  {
    id: 3,
    name: 'US West 1',
    location: 'United States',
    ping: '120',
    users: 78,
    status: 'online' as const,
    batas_create_akun: 150,
    total_create_akun: 78
  },
  {
    id: 4,
    name: 'Germany 1',
    location: 'Germany',
    ping: '85',
    users: 23,
    status: 'maintenance' as const,
    batas_create_akun: 90,
    total_create_akun: 23
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 relative z-10 transition-transform duration-300 overflow-x-hidden">
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
            {SAMPLE_SERVERS.map((server) => {
              const statusBadge = getStatusBadge(server.status);
              const isServerAvailable = server.status === 'online';
              
              return (
                <Card 
                  key={server.id} 
                  className={`transition-shadow ${
                    isServerAvailable 
                      ? 'hover:shadow-lg cursor-pointer' 
                      : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        {server.name}
                      </CardTitle>
                      <Badge 
                        variant={statusBadge.variant}
                        className={statusBadge.className}
                      >
                        {statusBadge.text}
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
                        <span className={`font-medium ${getPingColor(server.ping)}`}>{server.ping}ms</span>
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
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Create:</span>
                        </div>
                        <span className="font-medium">{server.total_create_akun}/{server.batas_create_akun}</span>
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
                        disabled={!isServerAvailable}
                      >
                        {isServerAvailable ? 'Select Server' : statusBadge.text}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
