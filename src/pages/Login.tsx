import { useEffect } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { authService } from '@/services/authService';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const Login = () => {
  useEffect(() => {
    // Redirect if already authenticated
    if (authService.isAuthenticated()) {
      window.location.href = '/dashboard';
    }
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex flex-col">
       {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#080808_1px,transparent_1px),linear-gradient(to_bottom,#080808_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0 pointer-events-none opacity-20"></div>

      <Header />

      <main className="flex-1 flex items-center justify-center p-4 relative z-10 pt-20">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] font-mono">
              KEDAI SSH
            </h1>
            <p className="text-cyan-700 font-mono text-xs tracking-[0.3em] uppercase">
              Secure Virtual Network Protocol
            </p>
          </div>

          <LoginForm />

          <div className="text-center space-y-3 font-mono text-xs">
            <p className="text-cyan-900">
              <Link
                to="/forgot-password"
                className="text-cyan-600 hover:text-cyan-400 uppercase tracking-widest hover:underline decoration-cyan-500/50 underline-offset-4 transition-all"
              >
                :: Reset Access Code ::
              </Link>
            </p>
            <p className="text-cyan-900">
              New User?{' '}
              <Link
                to="/register"
                className="text-purple-500 hover:text-purple-300 uppercase tracking-widest font-bold hover:shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all"
              >
                [ Initialize Identity ]
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
