
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User, Shield } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Handle token from URL parameter (Google OAuth redirect)
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      localStorage.setItem('auth_token', tokenFromUrl);
      toast({
        title: "Login successful",
        description: "Welcome back! You are now logged in.",
      });
      // Clean URL by removing token parameter
      navigate('/dashboard', { replace: true });
    }
  }, [searchParams, navigate, toast]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    navigate('/');
  };

  const handleCreateVPN = () => {
    navigate('/protokol');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <Header />
      
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Welcome to Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your VPN accounts and services from here
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
                  <User className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  Manage your account settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  View Profile
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>VPN Services</CardTitle>
                <CardDescription>
                  Create and manage your VPN accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleCreateVPN} className="w-full">
                  Create VPN Account
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-destructive rounded-full flex items-center justify-center mb-4">
                  <LogOut className="w-6 h-6 text-destructive-foreground" />
                </div>
                <CardTitle>Logout</CardTitle>
                <CardDescription>
                  Sign out from your account securely
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleLogout} className="w-full">
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Here are some quick actions you can take
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Create Your First VPN Account</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Start by creating a VPN account with your preferred protocol
                  </p>
                  <Button onClick={handleCreateVPN}>
                    Get Started
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Explore Protocols</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Learn about different VPN protocols: SSH, VMess, VLESS, and Trojan
                  </p>
                  <Button variant="outline" onClick={() => navigate('/')}>
                    Learn More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
