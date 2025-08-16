
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { LogIn, UserPlus, Mail, User, Lock } from 'lucide-react';
import { adminAuthService } from '@/services/adminAuthService';

interface LoginForm {
  identifier: string;
  password: string;
}

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin = ({ onLoginSuccess }: AdminLoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);

  const loginForm = useForm<LoginForm>({
    defaultValues: {
      identifier: '',
      password: ''
    }
  });

  const registerForm = useForm<RegisterForm>({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await adminAuthService.checkSetup();
      setNeedsSetup(response.needsSetup);
    } catch (error) {
      console.error('Error checking setup:', error);
      toast.error('Gagal memeriksa status setup');
      setNeedsSetup(false); // Default to login mode if check fails
    } finally {
      setIsCheckingSetup(false);
    }
  };

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    
    try {
      const response = await adminAuthService.login(data.identifier, data.password);
      
      if (response.success) {
        toast.success('Login berhasil!');
        onLoginSuccess();
      } else {
        toast.error(response.message || 'Login gagal');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Gagal login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Password dan konfirmasi password tidak sama');
      return;
    }

    if (data.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await adminAuthService.register(data.username, data.email, data.password);
      
      if (response.success) {
        toast.success('Registrasi berhasil! Selamat datang, Admin!');
        onLoginSuccess();
      } else {
        toast.error(response.message || 'Registrasi gagal');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Gagal mendaftar');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            {needsSetup ? (
              <>
                <UserPlus className="h-6 w-6" />
                Setup Admin
              </>
            ) : (
              <>
                <LogIn className="h-6 w-6" />
                Admin Login
              </>
            )}
          </CardTitle>
          <CardDescription>
            {needsSetup 
              ? 'Buat akun admin untuk pertama kali'
              : 'Masuk ke dashboard admin'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {needsSetup ? (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="username"
                  rules={{ 
                    required: 'Username wajib diisi',
                    minLength: { value: 3, message: 'Username minimal 3 karakter' }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Username
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Masukkan username" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="email"
                  rules={{ 
                    required: 'Email wajib diisi',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Format email tidak valid'
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="Masukkan email" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={registerForm.control}
                  name="password"
                  rules={{ 
                    required: 'Password wajib diisi',
                    minLength: { value: 6, message: 'Password minimal 6 karakter' }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Masukkan password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  rules={{ 
                    required: 'Konfirmasi password wajib diisi'
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Konfirmasi Password
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Konfirmasi password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Mendaftar...' : 'Daftar Admin'}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="identifier"
                  rules={{ required: 'Email atau username wajib diisi' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email atau Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Masukkan email atau username" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  rules={{ required: 'Password wajib diisi' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Masukkan password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Masuk...' : 'Masuk'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
