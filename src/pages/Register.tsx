import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Turnstile } from '@marsidev/react-turnstile';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { toast } from 'sonner';
import { authService } from '@/services/authService';
import { Loader2, UserPlus, Eye, EyeOff, User, Mail, Phone, Lock, Cpu } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { SEO } from '@/components/SEO';

const TURNSTILE_SITE_KEY = '0x4AAAAAAB66StA9s_iEIAj1';

const registerSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string().min(8, 'Phone number is invalid'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.password === data.confirm, {
  message: "Passwords don't match",
  path: ["confirm"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirm: '',
    },
  });

  const handleGoogleLogin = () => {
    window.location.href = authService.getGoogleLoginUrl();
  };

  const onSubmit = async (data: RegisterForm) => {
    if (!turnstileToken) {
      toast.error('Harap selesaikan verifikasi captcha');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.register({
        username: data.username,
        email: data.email,
        password: data.password,
        confirm: data.confirm,
        phoneNumber: data.phoneNumber,
        turnstileToken
      });
      
      console.log('Register response:', response);
      
      if (response.success) {
        if (response.needsVerification) {
          // User needs email verification
          toast.success("Registrasi berhasil", {
            description: "Kode verifikasi telah dikirim ke email Anda. Silakan cek email untuk melanjutkan.",
          });
          
          // Redirect to check-email page with email parameter
          navigate(`/check-email?email=${encodeURIComponent(data.email)}&type=email`);
          
        } else if (response.token) {
          // User is already verified, can login directly
          localStorage.setItem('auth_token', response.token);
          toast.success("Registration successful", {
            description: "Welcome! You've been successfully registered.",
          });
          navigate('/dashboard');
        } else {
          // Something went wrong
          setError('Registration completed but no token received. Please try logging in.');
        }
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed');
      toast.error("Registration failed", {
        description: err.message || "An error occurred during registration",
      });
      setTurnstileToken('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex flex-col">
      <SEO
        title="Register"
        description="Daftar akun baru di Kedai SSH untuk menikmati layanan VPN Premium dengan keamanan dan kecepatan tinggi."
        canonical="https://kedaissh.com/register"
      />
       {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#080808_1px,transparent_1px),linear-gradient(to_bottom,#080808_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0 pointer-events-none opacity-20"></div>

      <Header />
      
      <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4 relative z-10">
        <div className="w-full max-w-lg relative group">
           {/* Glow Effect */}
           <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-magenta-500 to-cyan-500 rounded-none blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>

           <Card className="relative bg-black border border-cyan-500/50 rounded-none shadow-[0_0_50px_rgba(139,92,246,0.15)]">
            <CardHeader className="text-center border-b border-cyan-900/50 pb-6">
              <div className="mx-auto w-16 h-16 bg-cyan-950 border-2 border-cyan-500 flex items-center justify-center mb-4 rounded-none shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                <UserPlus className="w-8 h-8 text-cyan-400" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-magenta-500 font-mono">
                New User Entry
              </CardTitle>
              <CardDescription className="text-cyan-600/80 font-mono text-xs tracking-wider">
                Create new identity in the secure network
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-6">
              {error && (
                <Alert variant="destructive" className="mb-6 bg-red-950/50 border-red-500 text-red-200 rounded-none">
                  <AlertDescription className="font-mono text-xs tracking-wide uppercase">:: ERROR: {error} ::</AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-cyan-500 font-mono text-xs uppercase tracking-wider">Identity // Username</FormLabel>
                        <FormControl>
                          <div className="relative group/input">
                            <User className="absolute left-3 top-3 h-4 w-4 text-cyan-700 group-focus-within/input:text-cyan-400 transition-colors" />
                            <Input
                              {...field}
                              placeholder="ALIAS_NAME"
                              className="pl-10 bg-black/50 border-cyan-800 text-cyan-100 placeholder:text-cyan-900 rounded-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono uppercase"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-red-500 font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-cyan-500 font-mono text-xs uppercase tracking-wider">Comms // Email</FormLabel>
                        <FormControl>
                           <div className="relative group/input">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-cyan-700 group-focus-within/input:text-cyan-400 transition-colors" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="USER@NET.WORK"
                              className="pl-10 bg-black/50 border-cyan-800 text-cyan-100 placeholder:text-cyan-900 rounded-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                            />
                           </div>
                        </FormControl>
                        <FormMessage className="text-xs text-red-500 font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-cyan-500 font-mono text-xs uppercase tracking-wider">Signal // WhatsApp</FormLabel>
                        <FormControl>
                          <div className="relative group/input phone-cyberpunk">
                             <div className="absolute left-3 top-3 z-10 pointer-events-none">
                                <Phone className="h-4 w-4 text-cyan-700 group-focus-within/input:text-cyan-400 transition-colors" />
                             </div>
                             <PhoneInput
                                international
                                defaultCountry="ID"
                                value={field.value}
                                onChange={field.onChange}
                                className="flex h-10 w-full rounded-none border border-cyan-800 bg-black/50 px-10 py-2 text-sm text-cyan-100 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-cyan-900 focus-visible:outline-none focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                              />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-red-500 font-mono" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-cyan-500 font-mono text-xs uppercase tracking-wider">Security // Pass</FormLabel>
                          <FormControl>
                            <div className="relative group/input">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-cyan-700 group-focus-within/input:text-cyan-400 transition-colors" />
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="******"
                                className="pl-10 pr-10 bg-black/50 border-cyan-800 text-cyan-100 placeholder:text-cyan-900 rounded-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                              />
                               <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-cyan-700 hover:text-cyan-400 transition-colors"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs text-red-500 font-mono" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-cyan-500 font-mono text-xs uppercase tracking-wider">Verify // Confirm</FormLabel>
                          <FormControl>
                            <div className="relative group/input">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-cyan-700 group-focus-within/input:text-cyan-400 transition-colors" />
                              <Input
                                {...field}
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="******"
                                className="pl-10 pr-10 bg-black/50 border-cyan-800 text-cyan-100 placeholder:text-cyan-900 rounded-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-3 text-cyan-700 hover:text-cyan-400 transition-colors"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-xs text-red-500 font-mono" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-center py-2 bg-cyan-950/20 border border-cyan-900/30">
                    <Turnstile
                      siteKey={TURNSTILE_SITE_KEY}
                      onSuccess={setTurnstileToken}
                      onError={() => setTurnstileToken('')}
                      onExpire={() => setTurnstileToken('')}
                      theme="dark"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-cyan-900 hover:bg-cyan-800 text-cyan-100 border border-cyan-500 rounded-none uppercase tracking-widest font-bold hover:shadow-[0_0_15px_rgba(0,255,255,0.5)] transition-all duration-300 group/btn"
                    disabled={isLoading || !turnstileToken}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span className="animate-pulse">PROCESSING DATA...</span>
                      </>
                    ) : (
                      <span className="flex items-center gap-2">
                         <Cpu className="w-4 h-4" /> EXECUTE REGISTRATION
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
              
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-cyan-900" />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-mono">
                    <span className="bg-black px-2 text-cyan-700">
                    OR JOIN VIA
                    </span>
                </div>
              </div>
            
              <Button 
                type="button" 
                variant="outline" 
                className="w-full bg-transparent border border-purple-900 text-purple-400 hover:bg-purple-900/20 hover:text-purple-200 hover:border-purple-500 rounded-none uppercase tracking-wider font-mono transition-all"
                onClick={handleGoogleLogin}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google Network
              </Button>

              <div className="mt-6 text-center">
                <p className="text-xs text-cyan-800 font-mono uppercase">
                  Existing Entity?{' '}
                  <Button 
                    variant="link" 
                    className="text-cyan-400 hover:text-cyan-200 font-bold p-0 h-auto uppercase tracking-wider"
                    onClick={() => navigate('/login')}
                  >
                    :: Access System ::
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

export default Register;
