
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { topupService } from '@/services/topupService';

const TopupSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser, updateToken } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [roleUpgraded, setRoleUpgraded] = useState(false);

  const merchantRef = searchParams.get('merchant_ref');

  useEffect(() => {
    console.log('TopupSuccess: Component mounted with merchantRef:', merchantRef);
    
    // Always refresh user data first to show current balance
    refreshUser();
    
    // Poll transaction status to get new token if role was upgraded
    const pollTransactionStatus = async () => {
      if (!merchantRef) {
        console.log('TopupSuccess: No merchant reference, skipping poll');
        setIsRefreshing(false);
        return;
      }

      console.log('TopupSuccess: Starting transaction status polling...');
      setIsRefreshing(true);
      let attempts = 0;
      const maxAttempts = 10; // Poll for 30 seconds (3s intervals)
      
      const poll = async () => {
        try {
          attempts++;
          console.log(`TopupSuccess: Polling attempt ${attempts}/${maxAttempts}`);
          const response = await topupService.getTransactionStatus(merchantRef);
          console.log('TopupSuccess: Transaction status response:', response);
          
          if (response.success && response.data) {
            const { newToken, status } = response.data;
            console.log('TopupSuccess: Transaction data:', { newToken: !!newToken, status });
            
            // If we got a new token (role upgraded), update auth
            if (newToken) {
              console.log('TopupSuccess: Role upgraded! Updating token...');
              // Use updateToken from AuthContext instead of just setting localStorage
              updateToken(newToken);
              setRoleUpgraded(true);
              toast.success('🎉 Selamat! Anda telah diupgrade menjadi RESELLER dan mendapat diskon 50%!');
              
              // Stop refreshing immediately since we have the updated token
              setIsRefreshing(false);
              return;
            }
            
            // If transaction is successful but no role upgrade, just refresh user
            if (status === 'success') {
              console.log('TopupSuccess: Transaction successful, refreshing user');
              refreshUser();
              setIsRefreshing(false);
              return;
            }
          }
          
          // Continue polling if not successful yet and under max attempts
          if (attempts < maxAttempts) {
            console.log(`TopupSuccess: Will retry in 3 seconds (attempt ${attempts}/${maxAttempts})`);
            setTimeout(poll, 3000);
          } else {
            console.log('TopupSuccess: Max attempts reached, fallback refresh');
            // Fallback: just refresh user normally
            refreshUser();
            setIsRefreshing(false);
          }
        } catch (error) {
          console.error('TopupSuccess: Failed to poll transaction status:', error);
          if (attempts < maxAttempts) {
            console.log(`TopupSuccess: Error, will retry in 3 seconds (attempt ${attempts}/${maxAttempts})`);
            setTimeout(poll, 3000);
          } else {
            console.log('TopupSuccess: Max attempts reached after error, fallback refresh');
            refreshUser();
            setIsRefreshing(false);
          }
        }
      };

      // Start polling after 1 second delay to ensure backend has processed
      setTimeout(poll, 1000);
    };

    pollTransactionStatus();
  }, [merchantRef, refreshUser, updateToken]);

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600 dark:text-green-400">
            Topup Berhasil!
          </CardTitle>
          <CardDescription className="text-base">
            Pembayaran Anda telah berhasil diproses
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {merchantRef && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                Detail Transaksi
              </h4>
              <p className="text-sm text-green-600 dark:text-green-300">
                <span className="font-medium">Referensi:</span> {merchantRef}
              </p>
            </div>
          )}

          {roleUpgraded && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <h4 className="font-bold text-yellow-800 dark:text-yellow-200">
                  🎉 UPGRADE ROLE BERHASIL!
                </h4>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                Selamat! Anda telah diupgrade menjadi <strong>RESELLER</strong>
              </p>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded text-xs text-yellow-800 dark:text-yellow-200">
                <strong>Benefit Reseller:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• Diskon 50% untuk semua pembuatan akun VPN</li>
                  <li>• Diskon 50% untuk perpanjangan akun</li>
                  <li>• Harga khusus untuk jualan kembali</li>
                </ul>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              ✅ Saldo Anda telah bertambah dan siap digunakan
              <br />
              ✅ Anda dapat langsung membuat akun VPN
              {roleUpgraded && (
                <>
                  <br />
                  🎁 <strong>Bonus: Dapatkan harga khusus reseller!</strong>
                </>
              )}
            </div>
          </div>

          <Button 
            onClick={handleContinue} 
            className="w-full h-12 text-base bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Memperbarui...' : (
              <>
                Lanjut ke Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Terima kasih telah menggunakan layanan kami
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TopupSuccess;
