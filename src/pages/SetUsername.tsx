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
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';
import { Loader2, User } from 'lucide-react';

const setUsernameSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

type SetUsernameForm = z.infer<typeof setUsernameSchema>;

const SetUsername = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const form = useForm<SetUsernameForm>({
    resolver: zodResolver(setUsernameSchema),
    defaultValues: {
      username: '',
    },
  });

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (!emailParam) {
      toast({
        title: "Invalid access",
        description: "Email parameter is required",
        variant: "destructive",
      });
      navigate('/');
      return;
    }
    setEmail(emailParam);
  }, [searchParams, navigate, toast]);

  const onSubmit = async (data: SetUsernameForm) => {
    if (!email) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.setUsername({
        username: data.username,
        email: email
      });
      
      if (response.success) {
        toast({
          title: "Username set successfully",
          description: "Welcome! Your account has been set up.",
        });
        navigate('/dashboard');
      } else {
        setError(response.message || 'Failed to set username');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set username');
      toast({
        title: "Failed to set username",
        description: err.message || "An error occurred while setting username",
        variant: "destructive",
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
                <p>Loading...</p>
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
              <CardTitle className="text-2xl font-bold">Set Username</CardTitle>
              <CardDescription>
                Please choose a username for your account
              </CardDescription>
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <strong>Email:</strong> {email}
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
                          <Input {...field} placeholder="Enter your desired username" />
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
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving Username...
                      </>
                    ) : (
                      'Simpan Username'
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Need help?{' '}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-normal"
                    onClick={() => navigate('/')}
                  >
                    Back to Home
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