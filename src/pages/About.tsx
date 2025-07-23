import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Hero } from '@/components/Hero';
import { Shield, Zap, Globe, Lock, Clock, Users } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  const handleCreateAccount = () => {
    navigate('/register');
  };

  const protocols = [
    {
      name: 'SSH',
      description: 'Secure Shell tunneling for reliable connections',
      icon: Shield,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      features: ['Port forwarding', 'Encrypted tunnels', 'Reliable connection']
    },
    {
      name: 'VMess',
      description: 'Advanced protocol with enhanced security features',
      icon: Zap,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      features: ['High performance', 'Advanced encryption', 'Traffic obfuscation']
    },
    {
      name: 'VLESS',
      description: 'Lightweight protocol for fast connections',
      icon: Globe,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      features: ['Minimal overhead', 'Fast speeds', 'Modern design']
    },
    {
      name: 'Trojan',
      description: 'Stealth protocol that mimics HTTPS traffic',
      icon: Lock,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      features: ['Traffic disguising', 'Bypass detection', 'HTTPS mimicking']
    }
  ];

  const features = [
    {
      icon: Clock,
      title: 'Quick Setup',
      description: 'Get your VPN account ready in minutes with our streamlined process'
    },
    {
      icon: Users,
      title: 'Multiple Protocols',
      description: 'Choose from SSH, VMess, VLESS, and Trojan protocols'
    },
    {
      icon: Shield,
      title: 'Secure Connection',
      description: 'All connections are encrypted and secure by default'
    },
    {
      icon: Globe,
      title: 'Global Servers',
      description: 'Access servers from multiple locations worldwide'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <Header />
      
      <main className="pt-20">
        <Hero />
        
        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Why Choose Our VPN Service?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Experience the best in VPN technology with our comprehensive suite of features
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Protocols Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Supported Protocols
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Choose from a variety of VPN protocols, each optimized for different use cases
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {protocols.map((protocol, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${protocol.bgColor}`}>
                        <protocol.icon className={`w-6 h-6 ${protocol.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{protocol.name}</CardTitle>
                        <CardDescription className="text-base mt-1">
                          {protocol.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {protocol.features.map((feature, featureIndex) => (
                        <Badge key={featureIndex} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create your free VPN account today and experience secure, fast internet browsing
            </p>
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={handleCreateAccount}
            >
              Create Free Account
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
