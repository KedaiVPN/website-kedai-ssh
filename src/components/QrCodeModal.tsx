import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeUrl: string;
  reference: string;
  amountGross: number;
  amountNet: number;
}

const QrCodeModal: React.FC<QrCodeModalProps> = ({ isOpen, onClose, qrCodeUrl, reference, amountGross, amountNet }) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `QR_Code_Ref_${reference}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Code downloaded!');
  };
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`'${text}' copied to clipboard!`);
  };

  const formatRupiah = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Scan to Pay</DialogTitle>
          <DialogDescription className="text-center">
            Scan this QR code with your favorite e-wallet or banking app.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 flex flex-col items-center justify-center space-y-4">
          <img src={qrCodeUrl} alt="QR Code for payment" className="w-64 h-64 rounded-lg border-4 border-white shadow-lg" />
          <Button onClick={handleDownload} variant="outline" size="sm" className="w-full">
            <Download className="mr-2 h-4 w-4" /> Download QR Code
          </Button>
        </div>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center bg-muted p-2 rounded-md">
            <span className="font-medium text-muted-foreground">Status</span>
            <span className="font-bold text-yellow-500 animate-pulse">MENUNGGU PEMBAYARAN</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-muted-foreground">No. Referensi</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-primary">{reference}</span>
              <Copy className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => handleCopy(reference)} />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-muted-foreground">Total Pembayaran</span>
            <span className="font-bold">{formatRupiah(amountGross)}</span>
          </div>
          <div className="flex justify-between items-center text-green-600 dark:text-green-400">
            <span className="font-medium">Saldo Diterima</span>
            <span className="font-bold">{formatRupiah(amountNet)}</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p>Window ini akan tertutup otomatis setelah pembayaran dikonfirmasi.</p>
          <p className="font-bold">Jangan tutup window ini secara manual.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QrCodeModal;
