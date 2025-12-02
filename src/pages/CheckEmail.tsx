
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react';

const CheckEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');
  const type = searchParams.get('type'); // 'google' or 'email'

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleProceedToVerify = () => {
    navigate(`/verify-email?email=${encodeURIComponent(email || '')}&type=${type || 'email'}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Cek Email Anda</CardTitle>
            <CardDescription className="text-base">
              Kami telah mengirim {type === 'google' ? 'link verifikasi' : 'kode verifikasi'} ke email Anda
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Email:</strong> {email}
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2">
                  {type === 'google' 
                    ? 'Klik link verifikasi dalam email untuk mengaktifkan akun Anda.'
                    : 'Masukkan kode verifikasi 6 digit dari email untuk melanjutkan.'}
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Periksa folder spam/junk jika tidak ditemukan</li>
                  <li>Email mungkin memerlukan beberapa menit untuk sampai</li>
                  <li>Pastikan alamat email sudah benar</li>
                </ul>
              </div>

              {type !== 'google' && (
                <Button 
                  onClick={handleProceedToVerify}
                  className="w-full"
                  size="lg"
                >
                  Masukkan Kode Verifikasi
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Tidak menerima email?
                </p>
                <Button
                  variant="outline"
                  onClick={handleProceedToVerify}
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Kirim Ulang Kode
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

export default CheckEmail;
