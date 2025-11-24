import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { xlService, type XLPackage, type XLScheduledPurchase } from '@/services/xlService';
import { balanceService } from '@/services/balanceService'; // Import balanceService
import { toast } from 'sonner';
import { AlertCircle, ChevronsUpDown, Check, X, Loader2, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const normalizePhoneNumber = (value: string): string => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('8')) {
        cleaned = '62' + cleaned;
    } else if (cleaned.startsWith('08')) {
        cleaned = '62' + cleaned.substring(1);
    }
    return cleaned;
};

const OfficialPackageSelector = ({ packages, selectedCode, onSelect, disabled = false }: {
  packages: XLPackage[];
  selectedCode: string;
  onSelect: (code: string) => void;
  disabled?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedPackage = packages.find((pkg) => pkg.package_code === selectedCode);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">{selectedPackage ? selectedPackage.name : "Pilih paket resmi..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Cari nama paket..." />
          <CommandList>
            <CommandEmpty>Paket tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {packages.map((pkg) => (
                <CommandItem
                  key={pkg.package_code}
                  value={pkg.name}
                  onSelect={() => {
                    onSelect(pkg.package_code);
                    setIsOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", selectedCode === pkg.package_code ? "opacity-100" : "opacity-0")} />
                  {pkg.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default function XLScheduledPurchase() {
    // Local state for balance and loading status
    const [balance, setBalance] = useState<number | null>(null);
    const [isBalanceLoading, setIsBalanceLoading] = useState(true);

    const [phoneNumber, setPhoneNumber] = useState('');
    const [officialPackages, setOfficialPackages] = useState<XLPackage[]>([]);
    const [selectedPackageCode, setSelectedPackageCode] = useState('');

    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [currentDate, setCurrentDate] = useState<Date | undefined>(new Date());

    const [existingSchedules, setExistingSchedules] = useState<XLScheduledPurchase[]>([]);
    const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const selectedPackage = officialPackages.find(p => p.package_code === selectedPackageCode);
    const estimatedCost = selectedPackage ? selectedPackage.fee * selectedDates.length : 0;
    // Use local balance for validation
    const canSubmit = balance !== null && balance >= estimatedCost;

    // Fetch balance and packages on component mount
    useEffect(() => {
        const loadInitialData = async () => {
            setIsBalanceLoading(true);
            try {
                // Fetch balance directly, just like the Dashboard
                const balanceResponse = await balanceService.getBalance();
                if (balanceResponse.success) {
                    setBalance(balanceResponse.balance || 0);
                } else {
                    toast.error("Gagal memuat saldo.");
                    setBalance(0);
                }

                // Fetch packages
                const allPackages = await xlService.getPackages();
                setOfficialPackages(allPackages.filter(p => p.kategori === 'resmi'));

            } catch (err) {
                setError("Gagal memuat data awal.");
                toast.error("Gagal memuat data awal.");
            } finally {
                setIsBalanceLoading(false);
            }
        };
        loadInitialData();
    }, []);

    // Fetch existing schedules when phone number is valid
    useEffect(() => {
        if (phoneNumber && /^628\d{8,12}$/.test(phoneNumber)) {
            const fetchSchedules = async () => {
                setIsLoadingSchedules(true);
                try {
                    const schedules = await xlService.getScheduledPurchases(phoneNumber);
                    setExistingSchedules(schedules);
                } catch (err: any) {
                    toast.error(err.message || 'Gagal mengambil jadwal.');
                } finally {
                    setIsLoadingSchedules(false);
                }
            };
            fetchSchedules();
        } else {
            setExistingSchedules([]);
        }
    }, [phoneNumber]);


    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
            toast.error("Tidak bisa memilih tanggal yang sudah lewat.");
            return;
        }
        if (selectedDates.length + existingSchedules.length >= 4) {
            toast.error("Maksimal 4 jadwal aktif per nomor telepon.");
            return;
        }
        const dateExists = selectedDates.some(d => d.getTime() === date.getTime());
        if (dateExists) {
            setSelectedDates(selectedDates.filter(d => d.getTime() !== date.getTime()));
        } else {
            setSelectedDates([...selectedDates, date].sort((a, b) => a.getTime() - b.getTime()));
        }
        setCurrentDate(date);
    };

    const handleRemoveDate = (dateToRemove: Date) => {
        setSelectedDates(selectedDates.filter(d => d.getTime() !== dateToRemove.getTime()));
    };

    const handleSubmit = async () => {
        if (!selectedPackage || selectedDates.length === 0 || !phoneNumber) {
            setError("Harap isi semua kolom: nomor HP, paket, dan minimal satu tanggal.");
            return;
        }
        if (!canSubmit) {
            setError("Saldo tidak mencukupi untuk total estimasi biaya.");
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            const formattedDates = selectedDates.map(d => format(d, 'yyyy-MM-dd'));
            await xlService.createScheduledPurchases(phoneNumber, selectedPackageCode, formattedDates);
            toast.success("Pembelian berhasil dijadwalkan!");
            setSelectedDates([]);
            setSelectedPackageCode('');
            const schedules = await xlService.getScheduledPurchases(phoneNumber);
            setExistingSchedules(schedules);
            // Refresh balance after successful submission
            const balanceResponse = await balanceService.getBalance();
            if (balanceResponse.success) {
              setBalance(balanceResponse.balance || 0);
            }
        } catch (err: any) {
            setError(err.message || "Gagal menjadwalkan pembelian.");
            toast.error(err.message || "Terjadi kesalahan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancelSchedule = async (scheduleId: number) => {
        try {
             await xlService.cancelScheduledPurchase(scheduleId);
             toast.success("Jadwal berhasil dibatalkan.");
             setExistingSchedules(prev => prev.filter(s => s.id !== scheduleId));
        } catch (err: any) {
             toast.error(err.message || "Gagal membatalkan jadwal.");
        }
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="font-semibold text-lg">Langkah 1: Masukkan Nomor HP</h3>
                <Input
                    type="tel"
                    placeholder="628xxxxx"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(normalizePhoneNumber(e.target.value))}
                    disabled={isSubmitting}
                />
            </div>

            <div className={cn("space-y-4 p-4 border rounded-lg", !phoneNumber && "opacity-50 cursor-not-allowed")}>
                 <h3 className="font-semibold text-lg">Langkah 2: Atur Jadwal</h3>
                 <div className="space-y-2">
                     <Label>Pilih Paket</Label>
                     <OfficialPackageSelector
                         packages={officialPackages}
                         selectedCode={selectedPackageCode}
                         onSelect={setSelectedPackageCode}
                         disabled={!phoneNumber || isSubmitting}
                     />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <Label>Pilih Tanggal (Maks. 4)</Label>
                         <Calendar
                            mode="single"
                            selected={currentDate}
                            onSelect={handleDateSelect}
                            className="rounded-md border"
                            disabled={!phoneNumber || !selectedPackageCode || isSubmitting}
                            locale={id}
                         />
                     </div>
                     <div>
                         <Label>Tanggal Terpilih</Label>
                         <div className="p-3 bg-muted/50 rounded-lg min-h-[120px] space-y-2">
                             {selectedDates.length === 0 ? (
                                 <p className="text-sm text-muted-foreground text-center pt-4">Pilih tanggal dari kalender.</p>
                             ) : (
                                selectedDates.map(date => (
                                    <div key={date.toISOString()} className="flex justify-between items-center bg-background p-2 rounded-md">
                                        <span className="text-sm">{format(date, 'dd MMMM yyyy', { locale: id })}</span>
                                        <Button size="icon" variant="ghost" onClick={() => handleRemoveDate(date)}>
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                ))
                             )}
                         </div>
                     </div>
                 </div>
            </div>

            <div className={cn("space-y-4 p-4 border rounded-lg", (!phoneNumber || !selectedPackage || selectedDates.length === 0) && "opacity-50")}>
                <h3 className="font-semibold text-lg">Langkah 3: Konfirmasi</h3>
                <Card>
                    <CardContent className="pt-6 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Paket</span>
                            <span className="font-medium text-right">{selectedPackage?.name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Biaya per jadwal</span>
                            <span className="font-medium">Rp{selectedPackage?.fee.toLocaleString() || 0}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Jumlah Jadwal</span>
                            <span className="font-medium">{selectedDates.length}</span>
                        </div>
                        <hr className="my-2"/>
                        <div className="flex justify-between text-lg">
                            <span className="font-bold">Estimasi Total Biaya</span>
                            <span className="font-bold">Rp{estimatedCost.toLocaleString()}</span>
                        </div>
                         <div className="flex justify-between text-sm items-center">
                            <span className="text-muted-foreground">Saldo Anda</span>
                            <span className={cn(canSubmit ? "text-green-600" : "text-red-600", "font-medium flex items-center gap-2")}>
                                {isBalanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Rp${(balance || 0).toLocaleString()}`}
                            </span>
                        </div>
                    </CardContent>
                </Card>
                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                <Button
                    className="w-full"
                    disabled={!canSubmit || isSubmitting || isBalanceLoading || selectedDates.length === 0}
                    onClick={handleSubmit}
                >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Jadwalkan Pembelian
                </Button>
                 {!canSubmit && !isBalanceLoading && selectedDates.length > 0 &&
                    <p className="text-sm text-center text-red-600">Saldo tidak mencukupi.</p>
                 }
            </div>

            <div className="space-y-4 p-4 border rounded-lg">
                 <h3 className="font-semibold text-lg">Jadwal Aktif Untuk Nomor Ini</h3>
                 {isLoadingSchedules && <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div>}
                 {!isLoadingSchedules && existingSchedules.length === 0 && (
                     <p className="text-sm text-muted-foreground text-center">Tidak ada jadwal aktif.</p>
                 )}
                 {!isLoadingSchedules && existingSchedules.length > 0 && (
                     <div className="space-y-2">
                         {existingSchedules.map(schedule => (
                             <div key={schedule.id} className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                                 <div>
                                     <p className="font-semibold">{schedule.package_name}</p>
                                     <p className="text-sm text-muted-foreground">
                                         Tanggal: {format(new Date(schedule.scheduled_date), 'dd MMMM yyyy', { locale: id })} - Biaya: Rp{schedule.fee.toLocaleString()}
                                     </p>
                                 </div>
                                 <Button size="icon" variant="destructive" onClick={() => handleCancelSchedule(schedule.id)}>
                                     <Trash2 className="h-4 w-4"/>
                                 </Button>
                             </div>
                         ))}
                     </div>
                 )}
            </div>
        </div>
    );
}
