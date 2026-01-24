import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, Calendar, CreditCard, Phone, Pencil, Lock, Loader2 } from "lucide-react";
import { profileService } from '@/services/profileService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface ProfileData {
  username: string;
  email: string;
  role: 'member' | 'reseller';
  transaction_count: number;
  created_at: string;
  auth_provider?: string;
  phone_number?: string;
}

type EditType = 'username' | 'password' | 'phone' | null;
type Step = 'input' | 'otp';

const Profile = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editType, setEditType] = useState<EditType>(null);
  const [step, setStep] = useState<Step>('input');
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  // Form Data
  const [newValue, setNewValue] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [otp, setOtp] = useState('');

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

  useEffect(() => {
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

  const handleOpenEdit = (type: EditType) => {
    setEditType(type);
    setStep('input');
    setNewValue('');
    setConfirmValue('');
    setOtp('');
    setIsModalOpen(true);
  };

  const handleRequestOtp = async () => {
    if (!editType) return;

    // Validation
    if (editType === 'username' && !newValue.trim()) {
      toast.error('Username tidak boleh kosong');
      return;
    }
    if (editType === 'password') {
      if (newValue.length < 6) {
        toast.error('Password minimal 6 karakter');
        return;
      }
      if (newValue !== confirmValue) {
        toast.error('Konfirmasi password tidak cocok');
        return;
      }
    }
    if (editType === 'phone' && !newValue) {
      toast.error('Nomor WhatsApp tidak boleh kosong');
      return;
    }

    try {
      setIsLoadingAction(true);
      const response = await profileService.requestChangeOtp(editType);

      if (response.success) {
        toast.success(response.message);
        setStep('otp');
      } else {
        toast.error(response.message || 'Gagal mengirim OTP');
      }
    } catch (error) {
      console.error('Error requesting OTP:', error);
      toast.error('Terjadi kesalahan saat meminta OTP');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!editType || !otp) {
      toast.error('Kode OTP harus diisi');
      return;
    }

    try {
      setIsLoadingAction(true);
      let response;

      if (editType === 'username') {
        response = await profileService.changeUsername(newValue, otp);
      } else if (editType === 'password') {
        response = await profileService.changePassword(newValue, otp);
      } else if (editType === 'phone') {
        response = await profileService.changePhone(newValue, otp);
      }

      if (response && response.success) {
        toast.success(response.message);
        setIsModalOpen(false);
        fetchProfile(); // Refresh data
      } else {
        toast.error(response?.message || 'Verifikasi gagal');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Terjadi kesalahan saat verifikasi');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const getModalTitle = () => {
    switch (editType) {
      case 'username': return 'Ganti Username';
      case 'password': return 'Ganti Password';
      case 'phone': return 'Ganti WhatsApp';
      default: return '';
    }
  };

  const getModalDescription = () => {
    if (step === 'input') {
      switch (editType) {
        case 'username': return 'Masukkan username baru yang diinginkan.';
        case 'password': return 'Masukkan password baru untuk akun Anda.';
        case 'phone': return 'Masukkan nomor WhatsApp baru Anda.';
        default: return '';
      }
    } else {
      return `Masukkan kode OTP yang telah dikirim ke email ${profileData?.email}`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <Header />
        <main className="pt-20 pb-12">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <Header />
        <main className="pt-20 pb-12">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <Header />
      <main className="pt-20 pb-12">
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
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit('username')}>
                      <Pencil className="w-4 h-4" />
                    </Button>
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
                    {/* Email usually cannot be changed easily or needs different flow, skipping edit button for now */}
                  </div>

                  {/* Phone Number */}
                  <div className="flex items-center space-x-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
                      <p className="text-lg font-semibold text-foreground">{profileData.phone_number || "Belum diatur"}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit('phone')}>
                      <Pencil className="w-4 h-4" />
                    </Button>
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

                  {/* Change Password Button (Only for Email Users) */}
                  {profileData.auth_provider === 'email' && (
                    <div className="pt-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleOpenEdit('password')}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Ganti Password
                      </Button>
                    </div>
                  )}

                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{getModalTitle()}</DialogTitle>
              <DialogDescription>
                {getModalDescription()}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {step === 'input' ? (
                <>
                  {editType === 'username' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="username" className="text-right">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        className="col-span-3"
                      />
                    </div>
                  )}
                  {editType === 'phone' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phone" className="text-right">
                        WhatsApp
                      </Label>
                      <div className="col-span-3">
                         <PhoneInput
                            international
                            defaultCountry="ID"
                            value={newValue}
                            onChange={(val) => setNewValue(val || '')}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                      </div>
                    </div>
                  )}
                  {editType === 'password' && (
                    <>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new-password" className="text-right">
                          Password Baru
                        </Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="confirm-password" className="text-right">
                          Konfirmasi
                        </Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmValue}
                          onChange={(e) => setConfirmValue(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="otp" className="text-right">
                    Kode OTP
                  </Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="col-span-3 text-center tracking-widest text-lg"
                    placeholder="xxxxxx"
                    maxLength={6}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              {step === 'input' ? (
                <Button onClick={handleRequestOtp} disabled={isLoadingAction}>
                  {isLoadingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan & Minta OTP
                </Button>
              ) : (
                <Button onClick={handleVerifyOtp} disabled={isLoadingAction}>
                  {isLoadingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verifikasi
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Profile;
