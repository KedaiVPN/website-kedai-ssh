
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Wifi, WifiOff, Wrench, UserCheck } from "lucide-react";
import { Server } from "@/types/vpn";

interface ServerSelectorProps {
  servers: Server[];
  selectedServerId: string;
  onServerSelect: (serverId: string) => void;
}

export const ServerSelector = ({ servers, selectedServerId, onServerSelect }: ServerSelectorProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4 text-yellow-500" />;
      case 'full':
        return <UserCheck className="h-4 w-4 text-green-500" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'full':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (server: Server) => {
    // Check if server is at capacity (users >= batas_create_akun)
    if (server.users >= server.batas_create_akun) {
      return 'Penuh';
    }
    
    switch (server.status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'maintenance':
        return 'Maintenance';
      case 'full':
        return 'Penuh';
      default:
        return 'Unknown';
    }
  };

  const isServerDisabled = (server: Server) => {
    return server.status !== 'online' || server.users >= server.batas_create_akun;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Pilih Server</h3>
      <div className="grid gap-3">
        {servers.map((server) => {
          const disabled = isServerDisabled(server);
          const isSelected = selectedServerId === server.id;
          
          return (
            <Card
              key={server.id}
              className={`cursor-pointer transition-all duration-200 ${
                disabled 
                  ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                  : isSelected
                    ? 'ring-2 ring-primary border-primary shadow-md'
                    : 'hover:shadow-md hover:border-primary/50'
              }`}
              onClick={() => !disabled && onServerSelect(server.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    {getStatusIcon(server.status)}
                    {server.name}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(server.status)}
                  >
                    {getStatusText(server)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {server.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {server.users}/{server.batas_create_akun} akun aktif
                    </span>
                  </div>
                  <span className="text-xs">
                    {server.ping}ms
                  </span>
                </div>
                
                {disabled && (
                  <div className="mt-2 text-xs text-red-600">
                    {server.users >= server.batas_create_akun 
                      ? 'Server telah mencapai batas maksimum akun aktif' 
                      : 'Server tidak tersedia'}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
