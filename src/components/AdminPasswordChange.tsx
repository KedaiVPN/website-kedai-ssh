
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Key } from 'lucide-react';

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AdminPasswordChange = () => {
  const [isChanging, setIsChanging] = useState(false);

  const form = useForm<PasswordChangeForm>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const handlePasswordChange = async (data: PasswordChangeForm) => {
    setIsChanging(true);
    
    const currentSavedPassword = localStorage.getItem('admin_password') || '123';
    
    if (data.currentPassword !== currentSavedPassword) {
      toast.error('Password saat ini salah!');
      setIsChanging(false);
      return;
    }
    
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok!');
      setIsChanging(false);
      return;
    }
    
    if (data.newPassword.length < 3) {
      toast.error('Password baru minimal 3 karakter!');
      setIsChanging(false);
      return;
    }
    
    localStorage.setItem('admin_password', data.newPassword);
    toast.success('Password berhasil diubah!');
    form.reset();
    setIsChanging(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Ubah Password
        </CardTitle>
        <CardDescription>
          Ubah password login admin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handlePasswordChange)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              rules={{ required: 'Password saat ini wajib diisi' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Saat Ini</FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="Masukkan password saat ini" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="newPassword"
              rules={{ required: 'Password baru wajib diisi' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Baru</FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="Masukkan password baru" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              rules={{ required: 'Konfirmasi password wajib diisi' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konfirmasi Password Baru</FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="Konfirmasi password baru" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              disabled={isChanging}
              className="w-full"
            >
              {isChanging ? 'Mengubah...' : 'Ubah Password'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AdminPasswordChange;
