import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { xlService, type XLPackage, type XLScheduledPurchase } from '@/services/xlService';
import { balanceService } from '@/services/balanceService';
import { toast } from 'sonner';
import { AlertCircle, Loader2, Settings, ChevronsUpDown, Check, X, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';

const normalizePhoneNumber = (value: string): string => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('08')) {
        cleaned = '62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
        cleaned = '62' + cleaned;
    }
    return cleaned;
};

const OfficialPackageSelector = ({ packages, selectedCode, onSelect, disabled = false }: { packages: XLPackage[], selectedCode: string, onSelect: (code: string) => void, disabled?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedPackage = packages.find((pkg) => pkg.package_code === selectedCode);
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={isOpen} className="w-full justify-between" disabled={disabled}>
          <span className="truncate">{selectedPackage ? selectedPackage.name : "Pilih paket resmi..."}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command><CommandInput placeholder="Cari nama paket..." /><CommandList><CommandEmpty>Paket tidak ditemukan.</CommandEmpty><CommandGroup>
              {packages.map((pkg) => (
                <CommandItem key={pkg.package_code} value={pkg.name} onSelect={() => { onSelect(pkg.package_code); setIsOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", selectedCode === pkg.package_code ? "opacity-100" : "opacity-0")} />{pkg.name}
                </CommandItem>
              ))}
        </CommandGroup></CommandList></Command>
      </PopoverContent>
    </Popover>
  );
};

const ScheduleOptionsModal = ({ phoneNumber, onUpdate }: { phoneNumber: string, onUpdate: () => void }) => {
    const [allSchedules, setAllSchedules] = useState<XLScheduledPurchase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newDates, setNewDates] = useState<Date[]>([]);

    const activeSchedules = allSchedules.filter(s => s.status === 'active');
    const historySchedules = allSchedules.filter(s => s.status !== 'active');
    const packageCode = activeSchedules.length > 0 ? activeSchedules[0].package_code : null;

    const lastSelectedDate = newDates.length > 0 ? newDates[newDates.length - 1] : null;
    const recommendedDate = lastSelectedDate ? addDays(lastSelectedDate, 7) : null;
    const modifiers = { recommended: recommendedDate ? [recommendedDate] : [] };
    const modifiersStyles = {
        selected: { color: '#2563eb', fontWeight: 'bold' },
        recommended: { color: '#16a34a', fontWeight: 'bold' },
    };

    const fetchSchedules = () => {
        setIsLoading(true);
        xlService.getAllScheduledPurchases(phoneNumber)
            .then(setAllSchedules)
            .catch(() => toast.error(`Gagal memuat jadwal untuk ${phoneNumber}`))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        if (phoneNumber) {
            fetchSchedules();
        }
    }, [phoneNumber]);

    const handleCancelSchedule = async (scheduleId: number) => {
        try {
            await xlService.cancelScheduledPurchase(scheduleId);
            toast.success("Jadwal berhasil dibatalkan.");

            // Check if this was the last active schedule BEFORE re-fetching
            if (activeSchedules.length === 1 && activeSchedules[0].id === scheduleId) {
                onUpdate(); // This will close the modal and refresh the number list
            } else {
                fetchSchedules(); // Just refresh the schedule list in the modal
            }
        } catch (err: any) {
             toast.error(err.message || "Gagal membatalkan jadwal.");
        }
    };

    const handleAddNewDates = async () => {
        if (!packageCode || newDates.length === 0) {
            toast.error("Silakan pilih setidaknya satu tanggal baru.");
            return;
        }
        try {
            const formattedDates = newDates.map(d => format(d, 'yyyy-MM-dd'));
            await xlService.createScheduledPurchases(phoneNumber, packageCode, formattedDates);
            toast.success("Jadwal baru berhasil ditambahkan!");
            setNewDates([]);
            setIsAdding(false);
            fetchSchedules(); // Use the existing fetch function
        } catch (err: any) {
            toast.error(err.message || "Gagal menambahkan jadwal baru.");
        }
    };

    return (
        <DialogContent>
            <DialogHeader><DialogTitle>Opsi Jadwal untuk {phoneNumber}</DialogTitle></DialogHeader>
            {isLoading ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin"/></div> : (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold mb-2">Jadwal Aktif</h4>
                        {activeSchedules.length > 0 ? (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {activeSchedules.map(schedule => (
                                    <div key={schedule.id} className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                                        <div>
                                            <p className="font-semibold">{schedule.package_name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Tanggal: {format(new Date(schedule.scheduled_date), 'dd MMMM yyyy', { locale: id })}
                                            </p>
                                        </div>
                                        <Button size="icon" variant="destructive" onClick={() => handleCancelSchedule(schedule.id)}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Tidak ada jadwal aktif.</p>
                        )}
                    </div>

                    {!isAdding && (
                        <div>
                            <h4 className="font-semibold mb-2">Riwayat Jadwal</h4>
                            {historySchedules.length > 0 ? (
                                 <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {historySchedules.map(schedule => (
                                        <div key={schedule.id} className="flex justify-between items-center bg-muted/50 p-3 rounded-md opacity-70">
                                            <div>
                                                <p className="font-semibold">{schedule.package_name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Tanggal: {format(new Date(schedule.scheduled_date), 'dd MMMM yyyy', { locale: id })}
                                                </p>
                                            </div>
                                            <span className={cn("text-sm font-bold", schedule.status === 'completed' ? 'text-green-500' : 'text-red-500')}>
                                                {schedule.status === 'completed' ? 'Berhasil' : 'Gagal'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Tidak ada riwayat.</p>
                            )}
                        </div>
                    )}

                    {!isAdding && activeSchedules.length < 4 && <Button className="w-full" onClick={() => setIsAdding(true)}>Tambahkan Jadwal</Button>}

                    {isAdding && (
                        <div className="space-y-4 pt-4 border-t">
                            <h4 className="font-semibold">Pilih Tanggal Baru</h4>
                            <Calendar
                                mode="multiple"
                                selected={newDates}
                                onSelect={(dates) => setNewDates(dates || [])}
                                disabled={{ before: addDays(new Date(), 1) }}
                                className="rounded-md border"
                                modifiers={modifiers}
                                modifiersStyles={modifiersStyles}
                            />
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setIsAdding(false)} className="w-full">Batal</Button>
                                <Button onClick={handleAddNewDates} className="w-full">Simpan Jadwal Baru</Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </DialogContent>
    );
};

export default function XLScheduledPurchase() {
    const [scheduledNumbers, setScheduledNumbers] = useState<string[]>([]);
    const [isLoadingNumbers, setIsLoadingNumbers] = useState(true);
    const [activePhoneNumber, setActivePhoneNumber] = useState('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);

    const [balance, setBalance] = useState<number | null>(null);
    const [isBalanceLoading, setIsBalanceLoading] = useState(true);
    const [officialPackages, setOfficialPackages] = useState<XLPackage[]>([]);
    const [selectedPackageCode, setSelectedPackageCode] = useState('');
    const [selectedDates, setSelectedDates] = useState<Date[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const loadScheduledNumbers = async () => {
        setIsLoadingNumbers(true);
        try {
            const numbers = await xlService.getScheduledNumbers();
            setScheduledNumbers(numbers);
        } catch (err) {
            toast.error("Gagal memuat nomor terjadwal.");
        } finally {
            setIsLoadingNumbers(false);
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setIsBalanceLoading(true);
            try {
                const [packages, balanceRes] = await Promise.all([
                    xlService.getPackages(),
                    balanceService.getBalance()
                ]);
                setOfficialPackages(packages.filter(p => p.kategori === 'resmi'));
                if (balanceRes.success) setBalance(balanceRes.balance || 0); else setBalance(0);
            } catch (err) {
                toast.error("Gagal memuat data halaman.");
            } finally {
                setIsBalanceLoading(false);
            }
        };
        loadInitialData();
        loadScheduledNumbers();
    }, []);

    useEffect(() => {
        const phoneIsValid = activePhoneNumber && /^628\d{8,12}$/.test(activePhoneNumber);
        if (phoneIsValid && !scheduledNumbers.includes(activePhoneNumber)) {
            setIsCreatingNew(true);
        } else {
            setIsCreatingNew(false);
        }
    }, [activePhoneNumber, scheduledNumbers]);

    const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const normalized = normalizePhoneNumber(e.target.value);
        setActivePhoneNumber(normalized);
    };

    const handleDateSelect = (dates: Date[] | undefined) => {
        if (!dates) { setSelectedDates([]); return; }
        if (dates.length > 4) { toast.error("Maksimal 4 jadwal aktif per nomor telepon."); return; }
        setSelectedDates(dates.sort((a, b) => a.getTime() - b.getTime()));
    };

    const handleRemoveDate = (dateToRemove: Date) => setSelectedDates(selectedDates.filter(d => d.getTime() !== dateToRemove.getTime()));

    const handleSubmitNewSchedule = async () => {
        const selectedPackage = officialPackages.find(p => p.package_code === selectedPackageCode);
        if (!selectedPackage || selectedDates.length === 0 || !activePhoneNumber) {
            setError("Harap isi semua kolom: nomor HP, paket, dan minimal satu tanggal.");
            return;
        }
        setIsSubmitting(true);
        setError('');
        try {
            const formattedDates = selectedDates.map(d => format(d, 'yyyy-MM-dd'));
            await xlService.createScheduledPurchases(activePhoneNumber, selectedPackageCode, formattedDates);
            toast.success("Pembelian berhasil dijadwalkan!");
            setSelectedDates([]);
            setSelectedPackageCode('');
            setActivePhoneNumber('');
            loadScheduledNumbers();
        } catch (err: any) {
            setError(err.message || "Gagal menjadwalkan pembelian.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderNewScheduleForm = () => {
        const selectedPackage = officialPackages.find(p => p.package_code === selectedPackageCode);
        const estimatedCost = selectedPackage ? selectedPackage.fee * selectedDates.length : 0;
        const canSubmit = balance !== null && balance >= estimatedCost;

        const lastSelectedDate = selectedDates.length > 0 ? selectedDates[selectedDates.length - 1] : null;
        const recommendedDate = lastSelectedDate ? addDays(lastSelectedDate, 7) : null;
        const modifiers = { recommended: recommendedDate ? [recommendedDate] : [] };
        const modifiersStyles = {
            selected: { color: '#2563eb', fontWeight: 'bold' },
            recommended: { color: '#16a34a', fontWeight: 'bold' },
        };

        return (
             <div className="mt-6 p-4 border rounded-lg animate-in fade-in-50 space-y-6">
                <h3 className="font-semibold text-lg">Buat Jadwal Baru untuk {activePhoneNumber}</h3>
                <div className="space-y-2"><Label>Pilih Paket</Label><OfficialPackageSelector packages={officialPackages} selectedCode={selectedPackageCode} onSelect={setSelectedPackageCode} /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <Label>Pilih Tanggal (Maks. 4)</Label>
                         <Calendar mode="multiple" selected={selectedDates} onSelect={handleDateSelect} className="rounded-md border" disabled={{ before: addDays(new Date(), 1) }} locale={id} modifiers={modifiers} modifiersStyles={modifiersStyles} />
                     </div>
                     <div>
                         <Label>Tanggal Terpilih</Label>
                         <div className="p-3 bg-muted/50 rounded-lg min-h-[120px] space-y-2">
                            {selectedDates.map(date => (
                                <div key={date.toISOString()} className="flex justify-between items-center bg-background p-2 rounded-md">
                                    <span className="text-sm">{format(date, 'dd MMMM yyyy', { locale: id })}</span>
                                    <Button size="icon" variant="ghost" onClick={() => handleRemoveDate(date)}><X className="h-4 w-4"/></Button>
                                </div>
                            ))}
                         </div>
                     </div>
                </div>
                <Card>
                    <CardContent className="pt-6 space-y-3">
                         <div className="flex justify-between text-sm items-center">
                            <span className="text-muted-foreground">Saldo Anda</span>
                            <span className={cn(canSubmit ? "text-green-600" : "text-red-600", "font-medium flex items-center gap-2")}>
                                {isBalanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Rp${(balance || 0).toLocaleString()}`}
                            </span>
                        </div>
                        <div className="flex justify-between text-lg">
                            <span className="font-bold">Estimasi Total Biaya</span>
                            <span className="font-bold">Rp{estimatedCost.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                <Button className="w-full" disabled={!canSubmit || isSubmitting || selectedDates.length === 0} onClick={handleSubmitNewSchedule}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Jadwalkan Pembelian
                </Button>
            </div>
        )
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="phone-number-input">Nomor Telepon</Label>
                <Input id="phone-number-input" type="tel" placeholder="Masukkan nomor atau pilih dari daftar" value={activePhoneNumber} onChange={handlePhoneNumberChange} />
            </div>

            {isLoadingNumbers ? <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div> : (
                <div className="space-y-4">
                    {scheduledNumbers.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Nomor Terjadwal</h3>
                            <div className="border rounded-lg">
                                {scheduledNumbers.map(num => (
                                    <div key={num} className="flex justify-between items-center p-3 border-b last:border-b-0">
                                        <span className="font-medium cursor-pointer hover:text-primary" onClick={() => setActivePhoneNumber(num)}>{num}</span>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm"><Settings className="mr-2 h-4 w-4"/> Opsi</Button>
                                            </DialogTrigger>
                                            <ScheduleOptionsModal phoneNumber={num} onUpdate={loadScheduledNumbers} />
                                        </Dialog>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {isCreatingNew && renderNewScheduleForm()}
                </div>
            )}
        </div>
    );
}
