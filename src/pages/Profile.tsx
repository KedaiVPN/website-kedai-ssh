
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, Calendar, CreditCard } from "lucide-react";
import { profileService } from '@/services/profileService';
import { useAuth } from '@/contexts/AuthContext';
import { useMenuPush } from '@/hooks/useMenuPush';
import { toast } from "sonner";

interface ProfileData {
  username: string;
  email: string;
  role: 'member' | 'reseller';
  transaction_count: number;
  created_at: string;
}

const Profile = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { mainContentStyle } = useMenuPush();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await profileService.getProfile();
        
        if (response.success && response.data) {
          setProfileData(response.data);
        } else {
          toast.error(response.message || 'Gagal mengambil data profil');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Gagal mengambil data profil');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'reseller' ? 'default' : 'secondary';
  };

  const getRoleLabel = (role: string) => {
    return role === 'reseller' ? 'Reseller' : 'Member';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Header />
        <main className="pb-12" style={mainContentStyle}>
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg">
                <CardHeader>
                  <div className="animate-pulse">
                    <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6 animate-pulse">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-muted rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                          <div className="h-5 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Header />
        <main className="pb-12" style={mainContentStyle}>
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle>Profil Pengguna</CardTitle>
                  <CardDescription>Data profil tidak ditemukan</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Header />
      <main className="pb-12" style={mainContentStyle}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="backdrop-blur-sm bg-card/80 border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl gradient-move">Profil Pengguna</CardTitle>
                <CardDescription>
                  Informasi detail akun Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Username */}
                  <div className="flex items-center space-x-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Username</p>
                      <p className="text-lg font-semibold text-foreground">{profileData.username}</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center space-x-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-lg font-semibold text-foreground">{profileData.email}</p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="flex items-center space-x-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Status Role</p>
                      <div className="mt-1">
                        <Badge variant={getRoleBadgeVariant(profileData.role)} className="text-sm">
                          {getRoleLabel(profileData.role)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Count */}
                  <div className="flex items-center space-x-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Total Transaksi</p>
                      <p className="text-lg font-semibold text-foreground">{profileData.transaction_count}</p>
                    </div>
                  </div>

                  {/* Registration Date */}
                  <div className="flex items-center space-x-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Tanggal Register</p>
                      <p className="text-lg font-semibold text-foreground">{formatDate(profileData.created_at)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
