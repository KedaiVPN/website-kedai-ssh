
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { authService } from '@/services/authService';
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password minimal 6 karakter'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
}

const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await authService.verifyResetToken(token);
        if (response.success) {
          setTokenValid(true);
          setEmail(response.email);
        }
      } catch (error: any) {
        toast.error('Token Tidak Valid', {
          description: error.message || 'Token reset password tidak valid atau telah kedaluwarsa',
        });
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setIsValidating(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setIsValidating(false);
    }
  }, [token, toast, navigate]);

  const onSubmit = async (data: ResetPasswordData) => {
    setIsLoading(true);
    
    try {
      const response = await authService.resetPassword(token, data.password, data.confirmPassword);
      
      if (response.success) {
        setIsSuccess(true);
        toast.success('Password Berhasil Direset', {
          description: response.message,
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Terjadi kesalahan saat reset password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Memverifikasi token...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tokenValid) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-600 mb-4" />
          <CardTitle className="text-2xl">Token Tidak Valid</CardTitle>
          <CardDescription>
            Token reset password tidak valid atau telah kedaluwarsa. 
            Silakan lakukan permintaan reset password baru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Link to="/forgot-password">
              <Button className="w-full">
                Request Reset Password Baru
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                Kembali ke Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
          <CardTitle className="text-2xl">Password Berhasil Direset</CardTitle>
          <CardDescription>
            Password Anda telah berhasil direset. Anda akan dialihkan ke halaman login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <Link to="/login">
              <Button className="w-full">
                Login Sekarang
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
        <CardDescription className="text-center">
          Buat password baru untuk akun: {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Baru</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimal 6 karakter"
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konfirmasi Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Ulangi password baru"
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Mereset Password...' : 'Reset Password'}
            </Button>

            <div className="text-center">
              <Link 
                to="/login" 
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Kembali ke Login
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ResetPasswordForm;
