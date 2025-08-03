
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Shield, RefreshCw } from 'lucide-react';

const verifySchema = z.object({
  code: z.string().min(6, 'Kode harus 6 digit').max(6, 'Kode harus 6 digit'),
});

type VerifyForm = z.infer<typeof verifySchema>;

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const email = searchParams.get('email');
  const type = searchParams.get('type') || 'email';
  const token = searchParams.get('token');

  const form = useForm<VerifyForm>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: '',
    },
  });

  useEffect(() => {
    if (!email) {
      navigate('/login');
      return;
    }

    // Handle Google verification with token
    if (type === 'google' && token) {
      handleGoogleVerification();
    }
  }, [email, type, token, navigate]);

  const handleGoogleVerification = async () => {
    if (!token || !email) return;

    setIsLoading(true);
    try {
      const response = await authService.verifyEmail({
        email,
        token,
        type: 'google'
      });

      if (response.success && response.token) {
        localStorage.setItem('auth_token', response.token);
        refreshUser();
        toast({
          title: "Email berhasil diverifikasi",
          description: "Selamat datang di KedaiVPN!",
        });
        navigate('/dashboard');
      } else {
        setError(response.message || 'Verifikasi gagal');
      }
    } catch (err: any) {
      setError(err.message || 'Verifikasi gagal');
      toast({
        title: "Verifikasi gagal",
        description: err.message || "Terjadi kesalahan saat verifikasi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: VerifyForm) => {
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.verifyEmail({
        email,
        code: data.code
      });

      if (response.success && response.token) {
        localStorage.setItem('auth_token', response.token);
        refreshUser();
        toast({
          title: "Email berhasil diverifikasi",
          description: "Akun Anda sekarang aktif!",
        });
        navigate('/dashboard');
      } else {
        setError(response.message || 'Kode verifikasi tidak valid');
        form.setError('code', { message: response.message || 'Kode tidak valid' });
      }
    } catch (err: any) {
      setError(err.message || 'Verifikasi gagal');
      form.setError('code', { message: err.message || 'Kode tidak valid' });
      toast({
        title: "Verifikasi gagal",
        description: err.message || "Kode verifikasi tidak valid",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;

    setIsResending(true);
    try {
      const response = await authService.resendVerification({ email });

      if (response.success) {
        toast({
          title: "Kode verifikasi terkirim",
          description: "Silakan cek email Anda untuk kode baru",
        });
        form.reset();
        setError(null);
      } else {
        toast({
          title: "Gagal mengirim kode",
          description: response.message || "Terjadi kesalahan",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Gagal mengirim kode",
        description: err.message || "Terjadi kesalahan jaringan",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  // Show loading for Google verification
  if (type === 'google' && token && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
              <p className="text-lg font-medium">Memverifikasi email...</p>
              <p className="text-sm text-gray-600">Mohon tunggu sebentar</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Verifikasi Email</CardTitle>
            <CardDescription>
              Masukkan kode verifikasi 6 digit yang telah dikirim ke email Anda
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Email:</strong> {email}
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kode Verifikasi</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="123456" 
                          maxLength={6}
                          className="text-center text-2xl font-mono tracking-widest"
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    'Verifikasi Email'
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Tidak menerima kode?
                </p>
                <Button
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Kirim Ulang Kode
                    </>
                  )}
                </Button>
              </div>

              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="text-sm"
                >
                  Kembali ke Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
