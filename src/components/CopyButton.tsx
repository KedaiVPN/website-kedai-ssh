import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy, className }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      toast.success('Teks berhasil disalin!');
      setTimeout(() => {
        setIsCopied(false);
      }, 2000); // Reset ikon setelah 2 detik
    }).catch(err => {
      console.error('Gagal menyalin teks: ', err);
      toast.error('Gagal menyalin teks.');
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`absolute top-2 right-2 z-10 h-8 w-8 text-gray-400 hover:text-gray-900 dark:hover:text-white ${className ?? ''}`}
      onClick={handleCopy}
    >
      {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      <span className="sr-only">Salin ke clipboard</span>
    </Button>
  );
};

export default CopyButton;
