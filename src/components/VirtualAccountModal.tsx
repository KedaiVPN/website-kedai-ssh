import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface Instruction {
  title: string;
  steps: string[];
}

interface VirtualAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentName: string;
  payCode: string;
  amountGross: number;
  amountNet: number;
  reference: string;
  instructions: Instruction[];
}

const VirtualAccountModal: React.FC<VirtualAccountModalProps> = ({ 
  isOpen, 
  onClose, 
  paymentName, 
  payCode, 
  amountGross,
  amountNet,
  reference,
  instructions 
}) => {
  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`'${text}' copied to clipboard!`);
  };

  const formatRupiah = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Complete Payment</DialogTitle>
          <DialogDescription className="text-center">
            Use the details below to complete your payment for {paymentName}.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-1">Virtual Account Number ({paymentName})</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-mono text-primary">{payCode}</span>
              <Button variant="ghost" size="icon" onClick={() => handleCopy(payCode)}>
                <Copy className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-sm">
           <div className="flex justify-between items-center bg-muted p-2 rounded-md">
            <span className="font-medium text-muted-foreground">Status</span>
            <span className="font-bold text-yellow-500 animate-pulse">MENUNGGU PEMBAYARAN</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-muted-foreground">No. Referensi</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{reference}</span>
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
        
        <div className="mt-4">
          <h3 className="font-semibold mb-2 text-center">Payment Instructions:</h3>
          <Accordion type="single" collapsible className="w-full" defaultValue={instructions[0]?.title}>
            {instructions.map((instr, index) => (
              <AccordionItem value={instr.title} key={index}>
                <AccordionTrigger>{instr.title}</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm" dangerouslySetInnerHTML={{ __html: instr.steps.join('') }} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-xs text-muted-foreground text-center mt-4 p-2 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p>This window will automatically close after payment is confirmed.</p>
          <p className="font-bold">Do not close this window manually.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VirtualAccountModal;
