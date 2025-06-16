
import { Server } from '@/types/vpn';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wifi, WifiOff, Settings, Signal } from 'lucide-react';

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
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Pilih Server
          </h3>
          <p className="text-muted-foreground text-sm">
            Memuat daftar server yang tersedia...
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 sm:p-6 animate-pulse">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: Server['status']) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'maintenance':
        return <Settings className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const getStatusBadge = (status: Server['status']) => {
    switch (status) {
      case 'online':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
            <Signal className="h-3 w-3 mr-1" />
            Online
          </Badge>
        );
      case 'offline':
        return (
          <Badge variant="destructive" className="text-xs">
            Offline
          </Badge>
        );
      case 'maintenance':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">
            Maintenance
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
          Pilih Server
        </h3>
        <p className="text-muted-foreground text-sm">
          Pilih server terbaik untuk koneksi VPN Anda
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {servers.map((server) => {
          const isSelected = selectedServerId === server.id;
          const isAvailable = server.status === 'online';
          
          return (
            <Card
              key={server.id}
              className={`relative p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:shadow-lg group ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-lg scale-105'
                  : 'border-border hover:border-primary/50 hover:bg-accent/50'
              } ${
                !isAvailable ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'
              }`}
              onClick={() => isAvailable && onServerChange(server.id)}
            >
              {/* Status indicator */}
              <div className="absolute top-3 right-3">
                {getStatusBadge(server.status)}
              </div>
              
              <div className="space-y-4">
                {/* Server header */}
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full transition-colors ${
                    isSelected ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    {getStatusIcon(server.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base truncate">{server.name}</h4>
                  </div>
                </div>
                
                {/* Location */}
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{server.location}</span>
                </div>
                
                {/* Domain */}
                <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded truncate">
                  {server.domain}
                </div>
                
                {/* Selection indicator */}
                {isSelected && (
                  <div className="flex justify-center">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Hover effect */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
