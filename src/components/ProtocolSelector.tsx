
import { VPNProtocol } from '@/types/vpn';
import { Card } from '@/components/ui/card';
import { PROTOCOLS } from '@/constants/protocols';

interface ProtocolSelectorProps {
  selectedProtocol: VPNProtocol;
  onProtocolChange: (protocol: VPNProtocol) => void;
}

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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {PROTOCOLS.map((protocol) => {
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
              {/* Responsive layout */}
              <div className="flex flex-col lg:flex-row items-center space-y-3 lg:space-y-0 lg:space-x-4">
                <div className={`p-3 rounded-full transition-colors ${isSelected ? protocol.bgColor : 'bg-muted'}`}>
                  <IconComponent className={`h-6 w-6 lg:h-7 lg:w-7 ${isSelected ? protocol.color : 'text-muted-foreground'} transition-colors`} />
                </div>
                
                <div className="flex-1 text-center lg:text-left">
                  <h4 className="font-semibold text-lg mb-1">{protocol.name}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {protocol.description}
                  </p>
                </div>
                
                <div className="lg:ml-auto">
                  <div
                    className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                      isSelected
                        ? `${protocol.borderColor} bg-gradient-to-r ${protocol.gradientColor}`
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
