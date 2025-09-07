
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { toast } from 'sonner';
import { authService } from '@/services/authService';
import { Loader2, User } from 'lucide-react';

const setUsernameSchema = z.object({
  username: z.string()
    .min(3, 'Username minimal 3 karakter')
    .max(20, 'Username maksimal 20 karakter')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh mengandung huruf, angka, dan underscore'),
});

type SetUsernameForm = z.infer<typeof setUsernameSchema>;

const SetUsername = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  const form = useForm<SetUsernameForm>({
    resolver: zodResolver(setUsernameSchema),
    defaultValues: {
      username: '',
    },
  });

  useEffect(() => {
    console.log('SetUsername: Component mounted');
    const emailParam = searchParams.get('email');
    const nameParam = searchParams.get('name');
    
    console.log('SetUsername: URL params - email:', emailParam, 'name:', nameParam);
    
    if (!emailParam) {
      console.error('SetUsername: Email parameter missing');
      toast.error("Akses tidak valid", {
        description: "Parameter email diperlukan untuk mengatur username",
      });
      navigate('/login', { replace: true });
      return;
    }
    
    setEmail(emailParam);
    setName(nameParam);
  }, [searchParams, navigate]);

  const onSubmit = async (data: SetUsernameForm) => {
    if (!email) {
      setError('Email diperlukan untuk mengatur username');
      return;
    }

    console.log('SetUsername: Submitting username:', data.username);
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.setUsername({
        username: data.username.trim(),
        email: email
      });
      
      console.log('SetUsername: Response received:', response);
      
      if (response.success) {
        toast.success("Username berhasil diatur", {
          description: "Selamat datang! Akun Anda telah siap digunakan.",
        });
        
        // Navigate to dashboard (token already saved in authService)
        navigate('/dashboard', { replace: true });
      } else {
        setError(response.message || 'Gagal mengatur username');
        toast.error("Gagal mengatur username", {
          description: response.message || "Terjadi kesalahan saat mengatur username",
        });
      }
    } catch (err: any) {
      console.error('SetUsername: Error occurred:', err);
      const errorMessage = err.message || 'Gagal mengatur username';
      setError(errorMessage);
      toast.error("Gagal mengatur username", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
        <Header />
        <main className="pt-20 pb-12 px-4">
          <div className="max-w-md mx-auto">
            <Card className="shadow-lg">
              <CardContent className="text-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Memuat...</p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <Header />
      
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold">Atur Username</CardTitle>
              <CardDescription>
                Silakan pilih username untuk akun Anda
              </CardDescription>
              <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                <div><strong>Email:</strong> {email}</div>
                {name && <div><strong>Nama:</strong> {name}</div>}
              </div>
            </CardHeader>
            
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Masukkan username yang diinginkan"
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Username hanya boleh mengandung huruf, angka, dan underscore
                        </p>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan Username...
                      </>
                    ) : (
                      'Simpan Username'
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Butuh bantuan?{' '}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-normal"
                    onClick={() => navigate('/')}
                  >
                    Kembali ke Beranda
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SetUsername;
