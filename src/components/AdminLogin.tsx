
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';

interface LoginForm {
  username: string;
  password: string;
}

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin = ({ onLoginSuccess }: AdminLoginProps) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const form = useForm<LoginForm>({
    defaultValues: {
      username: '',
      password: ''
    }
  });

  const handleLogin = async (data: LoginForm) => {
    setIsLoggingIn(true);
    
    // Get saved password or use default
    const savedPassword = localStorage.getItem('admin_password') || '123';
    
    if (data.username === 'admin' && data.password === savedPassword) {
      localStorage.setItem('admin_logged_in', 'true');
      toast.success('Login berhasil!');
      onLoginSuccess();
    } else {
      toast.error('Username atau password salah!');
    }
    
    setIsLoggingIn(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <LogIn className="h-6 w-6" />
            Admin Login
          </CardTitle>
          <CardDescription>
            Masuk ke dashboard admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                rules={{ required: 'Username wajib diisi' }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
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
                control={form.control}
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
                disabled={isLoggingIn}
                className="w-full"
              >
                {isLoggingIn ? 'Masuk...' : 'Masuk'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
