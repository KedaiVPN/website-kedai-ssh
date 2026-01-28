
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, Calendar, CreditCard, Phone, Pencil, Lock, Loader2, CheckCircle2, AlertCircle, Crown } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const renderRoleBadge = (role: string) => {
    if (role === 'reseller') {
      return (
        <Badge className="px-4 py-1.5 text-sm font-medium rounded-full mb-6 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-700 dark:text-yellow-400 border border-yellow-500/50 flex items-center gap-2 shadow-sm backdrop-blur-sm">
          <Crown className="w-4 h-4" /> Reseller
        </Badge>
      );
    }
    return (
      <Badge className="px-4 py-1.5 text-sm font-medium rounded-full mb-6 bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 dark:text-blue-400 border border-blue-500/50 flex items-center gap-2 shadow-sm backdrop-blur-sm">
        <User className="w-4 h-4" /> Member
      </Badge>
    );
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header />
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              {/* Skeleton Loader */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-1 space-y-6">
                    <div className="h-64 bg-muted/20 animate-pulse rounded-2xl"></div>
                 </div>
                 <div className="md:col-span-2 space-y-6">
                    <div className="h-32 bg-muted/20 animate-pulse rounded-2xl"></div>
                    <div className="h-64 bg-muted/20 animate-pulse rounded-2xl"></div>
                 </div>
               </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!profileData) {
     return (
       <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header />
        <main className="pt-24 pb-12 flex items-center justify-center">
            <Card className="w-full max-w-md backdrop-blur-md bg-white/40 dark:bg-black/40 border-white/20">
               <CardHeader className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                  <CardTitle>Profil Tidak Ditemukan</CardTitle>
                  <CardDescription>Gagal memuat data pengguna.</CardDescription>
               </CardHeader>
            </Card>
        </main>
       </div>
     )
  }

  const isGoogleAuth = profileData.auth_provider === 'google';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
           {/* Header Title */}
           <div className="mb-8 text-center md:text-left">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Profil Saya
              </h1>
              <p className="text-muted-foreground mt-2">
                Kelola informasi akun dan preferensi keamanan Anda.
              </p>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

             {/* Left Column: Identity Card */}
             <div className="lg:col-span-1">
                <Card className="h-full border-0 shadow-xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/20">
                   <CardContent className="pt-8 flex flex-col items-center text-center">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full blur-xl opacity-50"></div>
                        <Avatar className="w-32 h-32 border-4 border-white dark:border-slate-800 shadow-2xl relative z-10">
                           <AvatarImage src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${profileData.email}`} alt={profileData.username} />
                           <AvatarFallback className="text-4xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600">
                             {profileData.username?.charAt(0).toUpperCase()}
                           </AvatarFallback>
                        </Avatar>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute bottom-0 right-0 rounded-full shadow-lg z-20 h-10 w-10 border-2 border-white dark:border-slate-800"
                          onClick={() => handleOpenEdit('username')}
                        >
                           <Pencil className="w-4 h-4" />
                        </Button>
                      </div>

                      <h2 className="text-2xl font-bold text-foreground mb-1">{profileData.username}</h2>
                      <p className="text-muted-foreground text-sm mb-4">{profileData.email}</p>

                      {renderRoleBadge(profileData.role)}

                      <div className="w-full border-t border-border/50 pt-6 mt-2">
                         <div className="flex justify-between items-center text-sm px-4">
                            <span className="text-muted-foreground flex items-center gap-2">
                               <Calendar className="w-4 h-4" /> Bergabung
                            </span>
                            <span className="font-medium">{formatDate(profileData.created_at)}</span>
                         </div>
                      </div>
                   </CardContent>
                </Card>
             </div>

             {/* Right Column: Statistics & Details */}
             <div className="lg:col-span-2 space-y-6">

                {/* Statistics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-md ring-1 ring-blue-500/20">
                      <CardContent className="p-6 flex items-center justify-between">
                         <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Total Transaksi</p>
                            <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400">{profileData.transaction_count}</h3>
                         </div>
                         <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <CreditCard className="w-6 h-6" />
                         </div>
                      </CardContent>
                   </Card>

                   <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-md ring-1 ring-green-500/20">
                      <CardContent className="p-6 flex items-center justify-between">
                         <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Status Akun</p>
                            <h3 className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                               <CheckCircle2 className="w-5 h-5" /> Aktif
                            </h3>
                         </div>
                         <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400">
                            <Shield className="w-6 h-6" />
                         </div>
                      </CardContent>
                   </Card>
                </div>

                {/* Details Section */}
                <Card className="border-0 shadow-xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/20">
                   <CardHeader>
                      <CardTitle>{isGoogleAuth ? "Informasi Kontak" : "Informasi Kontak & Keamanan"}</CardTitle>
                      <CardDescription>
                        {isGoogleAuth ? "Kelola Nomor Telepon Anda" : "Kelola nomor telepon dan kata sandi akun Anda."}
                      </CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-6">

                      {/* WhatsApp Item */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-blue-500/30 transition-all group">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                               <Phone className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="text-sm font-medium text-muted-foreground">WhatsApp</p>
                               <p className="text-lg font-semibold">{profileData.phone_number || "Belum diatur"}</p>
                            </div>
                         </div>
                         <Button
                            className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4 h-8 text-xs font-medium"
                            size="sm"
                            onClick={() => handleOpenEdit('phone')}
                         >
                            Change
                         </Button>
                      </div>

                      {/* Password Item (Email Users Only) */}
                      {!isGoogleAuth && (
                         <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-blue-500/30 transition-all group">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                  <Lock className="w-5 h-5" />
                               </div>
                               <div>
                                  <p className="text-sm font-medium text-muted-foreground">Password</p>
                                  <p className="text-lg font-semibold tracking-widest">••••••••</p>
                               </div>
                            </div>
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4 h-8 text-xs font-medium"
                              size="sm"
                              onClick={() => handleOpenEdit('password')}
                            >
                               Change
                            </Button>
                         </div>
                      )}

                      {/* Email Readonly */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 opacity-75">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                               <Mail className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="text-sm font-medium text-muted-foreground">Email (Terverifikasi)</p>
                               <p className="text-base font-medium">{profileData.email}</p>
                            </div>
                         </div>
                      </div>

                   </CardContent>
                </Card>
             </div>

           </div>
        </div>

        {/* Edit Modal (Dialog) - Reused logic with slight style tweaks if needed */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[425px] backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-white/20">
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
                    <div className="grid gap-2">
                      <Label htmlFor="username">Username Baru</Label>
                      <Input
                        id="username"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder="Masukkan username"
                      />
                    </div>
                  )}
                  {editType === 'phone' && (
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Nomor WhatsApp Baru</Label>
                       <PhoneInput
                          international
                          defaultCountry="ID"
                          value={newValue}
                          onChange={(val) => setNewValue(val || '')}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                  )}
                  {editType === 'password' && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="new-password">Password Baru</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="confirm-password">Konfirmasi Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmValue}
                          onChange={(e) => setConfirmValue(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="grid gap-2 text-center">
                  <Label htmlFor="otp">Kode Verifikasi (OTP)</Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="text-center tracking-[1em] text-xl font-bold h-12"
                    placeholder="••••••"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground mt-2">Cek email Anda untuk mendapatkan kode.</p>
                </div>
              )}
            </div>

            <DialogFooter>
              {step === 'input' ? (
                <Button onClick={handleRequestOtp} disabled={isLoadingAction} className="w-full">
                  {isLoadingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan & Minta OTP
                </Button>
              ) : (
                <Button onClick={handleVerifyOtp} disabled={isLoadingAction} className="w-full">
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
