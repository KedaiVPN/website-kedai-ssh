
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { authService } from '@/services/authService';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const forgotPasswordSchema = z.object({
  email: z.string().email('Format email tidak valid'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    
    try {
      const response = await authService.requestPasswordReset(data.email);
      
      if (response.success) {
        setIsSuccess(true);
        toast.success('Email Terkirim', {
          description: response.message,
        });
      }
    } catch (error: any) {
      toast.error('Error', {
        description: error.message || 'Terjadi kesalahan saat mengirim email reset password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Mail className="w-16 h-16 mx-auto text-green-600 mb-4" />
          <CardTitle className="text-2xl">Email Terkirim</CardTitle>
          <CardDescription>
            Instruksi reset password telah dikirim ke email Anda. 
            Silakan cek inbox dan ikuti instruksi yang diberikan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tidak menerima email? Cek folder spam atau coba lagi dalam beberapa menit.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Login
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
        <CardTitle className="text-2xl text-center">Lupa Password</CardTitle>
        <CardDescription className="text-center">
          Masukkan email Anda untuk menerima instruksi reset password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="nama@email.com"
                      disabled={isLoading}
                    />
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
              {isLoading ? 'Mengirim...' : 'Kirim Link Reset'}
            </Button>

            <div className="text-center">
              <Link 
                to="/login" 
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Kembali ke Login
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ForgotPasswordForm;
