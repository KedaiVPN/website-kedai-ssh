
import { VPNProtocol } from '@/types/vpn';
import { Card } from '@/components/ui/card';
import { Shield, Server, Lock, Key } from 'lucide-react';

interface ProtocolSelectorProps {
  selectedProtocol: VPNProtocol;
  onProtocolChange: (protocol: VPNProtocol) => void;
}

const protocols = [
  {
    id: 'ssh' as VPNProtocol,
    name: 'SSH',
    description: 'Secure Shell tunneling dengan enkripsi tinggi',
    icon: Shield,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  {
    id: 'vmess' as VPNProtocol,
    name: 'VMess',
    description: 'V2Ray protocol dengan performa optimal',
    icon: Server,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800'
  },
  {
    id: 'vless' as VPNProtocol,
    name: 'VLESS',
    description: 'V2Ray protocol ringan dan cepat',
    icon: Lock,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800'
  },
  {
    id: 'trojan' as VPNProtocol,
    name: 'Trojan',
    description: 'Protocol dengan kamuflase HTTPS',
    icon: Key,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800'
  }
];

export const ProtocolSelector = ({ selectedProtocol, onProtocolChange }: ProtocolSelectorProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
          Pilih Protocol VPN
        </h3>
        <p className="text-muted-foreground text-sm">
          Pilih protocol yang sesuai dengan kebutuhan Anda
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {protocols.map((protocol) => {
          const IconComponent = protocol.icon;
          const isSelected = selectedProtocol === protocol.id;
          
          return (
            <Card
              key={protocol.id}
              className={`relative p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 group ${
                isSelected
                  ? `${protocol.bgColor} ${protocol.borderColor} border-2 shadow-lg scale-105`
                  : 'border-border hover:border-primary/50 hover:bg-accent/50'
              }`}
              onClick={() => onProtocolChange(protocol.id)}
            >
              {/* Mobile-optimized layout */}
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className={`p-3 rounded-full transition-colors ${isSelected ? protocol.bgColor : 'bg-muted'}`}>
                  <IconComponent className={`h-6 w-6 sm:h-7 sm:w-7 ${isSelected ? protocol.color : 'text-muted-foreground'} transition-colors`} />
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-semibold text-lg mb-1">{protocol.name}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {protocol.description}
                  </p>
                </div>
                
                <div className="sm:ml-auto">
                  <div
                    className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                      isSelected
                        ? `${protocol.borderColor.replace('border-', 'border-')} bg-gradient-to-r ${protocol.color.includes('blue') ? 'from-blue-500 to-blue-600' : protocol.color.includes('green') ? 'from-green-500 to-green-600' : protocol.color.includes('purple') ? 'from-purple-500 to-purple-600' : 'from-red-500 to-red-600'}`
                        : 'border-muted-foreground'
                    }`}
                  >
                    {isSelected && (
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-current"></div>
                      </div>
                    )}
                  </div>
                </div>
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
