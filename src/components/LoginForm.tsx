import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Turnstile } from '@marsidev/react-turnstile';
import { authService } from '@/services/authService';
import { LoginRequest } from '@/types/auth';
import { Eye, EyeOff, Mail, Lock, LogIn, Cpu } from 'lucide-react';

const TURNSTILE_SITE_KEY = '0x4AAAAAAB66StA9s_iEIAj1';

interface LoginFormProps {
  onSuccess?: () => void;
}

const isBlockedMessage = (message?: string) => {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes('diblokir') || normalized.includes('di blokir') || normalized.includes('dikunci') || normalized.includes('di kunci');
};

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    if (!turnstileToken) {
      toast.error('Harap selesaikan verifikasi captcha');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login(data.email, data.password, turnstileToken);
      
      if (response.success) {
        toast.success(response.message || 'Login berhasil!');
        onSuccess?.();
        window.location.href = '/dashboard';
      } else {
        toast.error(response.message || 'Login gagal');
        if (isBlockedMessage(response.message)) {
          window.location.href = '/blocked';
          return;
        }
        setTurnstileToken('');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Terjadi kesalahan saat login';
      toast.error(errorMessage);
      if (isBlockedMessage(errorMessage) || isBlockedMessage(error?.response?.data?.message)) {
        window.location.href = '/blocked';
        return;
      }
      setTurnstileToken('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = authService.getGoogleLoginUrl();
  };

  return (
    <div className="relative group">
        {/* Cyberpunk Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-none blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>

        <Card className="relative w-full max-w-md mx-auto bg-black border border-cyan-500/50 rounded-none shadow-[0_0_20px_rgba(0,255,255,0.2)]">
        <CardHeader className="space-y-1 text-center border-b border-cyan-900/50 pb-6">
            <div className="mx-auto w-12 h-12 bg-cyan-950 border border-cyan-500 flex items-center justify-center mb-2 rounded-none">
                <Cpu className="w-6 h-6 text-cyan-400" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
            System Access
            </CardTitle>
            <CardDescription className="text-cyan-600/80 font-mono text-xs">
            Enter credentials to initialize session
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-cyan-500 font-mono text-xs uppercase tracking-wider">Identity // Email</Label>
                <div className="relative group/input">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-cyan-700 group-focus-within/input:text-cyan-400 transition-colors" />
                <Input
                    id="email"
                    type="email"
                    placeholder="USER@NET.WORK"
                    className="pl-10 bg-black/50 border-cyan-800 text-cyan-100 placeholder:text-cyan-900 rounded-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                    {...register('email', {
                    required: 'Email wajib diisi',
                    pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Format email tidak valid'
                    }
                    })}
                />
                </div>
                {errors.email && (
                <p className="text-xs text-red-500 font-mono animate-pulse">:: {errors.email.message} ::</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="password" className="text-cyan-500 font-mono text-xs uppercase tracking-wider">Security // Password</Label>
                <div className="relative group/input">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-cyan-700 group-focus-within/input:text-cyan-400 transition-colors" />
                <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="ACCESS CODE"
                    className="pl-10 pr-10 bg-black/50 border-cyan-800 text-cyan-100 placeholder:text-cyan-900 rounded-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-mono"
                    {...register('password', {
                    required: 'Password wajib diisi',
                    minLength: {
                        value: 6,
                        message: 'Password minimal 6 karakter'
                    }
                    })}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-cyan-700 hover:text-cyan-400 transition-colors"
                >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                </div>
                {errors.password && (
                <p className="text-xs text-red-500 font-mono animate-pulse">:: {errors.password.message} ::</p>
                )}
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
                <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-none border-2 border-cyan-400 border-t-transparent" />
                    <span className="animate-pulse">INITIALIZING...</span>
                </div>
                ) : (
                <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    CONNECT
                </div>
                )}
            </Button>
            </form>

            <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-cyan-900" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-mono">
                <span className="bg-black px-2 text-cyan-700">
                OR AUTH VIA
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
        </CardContent>
        </Card>
    </div>
  );
};
