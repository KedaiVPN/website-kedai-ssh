
import { Server } from '@/types/vpn';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wifi, WifiOff, Settings } from 'lucide-react';

interface ServerSelectorProps {
  servers: Server[];
  selectedServerId: string;
  onServerChange: (serverId: string) => void;
  isLoading?: boolean;
}

export const ServerSelector = ({ 
  servers, 
  selectedServerId, 
  onServerChange, 
  isLoading = false 
}: ServerSelectorProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Pilih Server</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-muted rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: Server['status']) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-600" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-600" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: Server['status']) => {
    switch (status) {
      case 'online':
        return <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'maintenance':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Maintenance</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pilih Server</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {servers.map((server) => (
          <Card
            key={server.id}
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedServerId === server.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            } ${
              server.status !== 'online' ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            onClick={() => server.status === 'online' && onServerChange(server.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon(server.status)}
                <h4 className="font-medium">{server.name}</h4>
              </div>
              {getStatusBadge(server.status)}
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{server.location}</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground font-mono">
              {server.domain}
            </div>
            {selectedServerId === server.id && (
              <div className="mt-2">
                <div className="w-4 h-4 rounded-full bg-primary ml-auto" />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
