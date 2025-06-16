
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
    color: 'text-blue-600'
  },
  {
    id: 'vmess' as VPNProtocol,
    name: 'VMess',
    description: 'V2Ray protocol dengan performa optimal',
    icon: Server,
    color: 'text-green-600'
  },
  {
    id: 'vless' as VPNProtocol,
    name: 'VLESS',
    description: 'V2Ray protocol ringan dan cepat',
    icon: Lock,
    color: 'text-purple-600'
  },
  {
    id: 'trojan' as VPNProtocol,
    name: 'Trojan',
    description: 'Protocol dengan kamuflase HTTPS',
    icon: Key,
    color: 'text-red-600'
  }
];

export const ProtocolSelector = ({ selectedProtocol, onProtocolChange }: ProtocolSelectorProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pilih Protocol VPN</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {protocols.map((protocol) => {
          const IconComponent = protocol.icon;
          return (
            <Card
              key={protocol.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedProtocol === protocol.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => onProtocolChange(protocol.id)}
            >
              <div className="flex items-center space-x-3">
                <IconComponent className={`h-6 w-6 ${protocol.color}`} />
                <div>
                  <h4 className="font-medium">{protocol.name}</h4>
                  <p className="text-sm text-muted-foreground">{protocol.description}</p>
                </div>
                <div className="ml-auto">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      selectedProtocol === protocol.id
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    }`}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
