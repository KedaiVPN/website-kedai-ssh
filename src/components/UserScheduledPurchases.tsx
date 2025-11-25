import { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';

interface ScheduledPurchase {
  id: number;
  phone_number: string;
  package_code: string;
  package_name: string;
  scheduled_date: string;
}

interface UserScheduledPurchasesProps {
  userId: number;
}

const UserScheduledPurchases = ({ userId }: UserScheduledPurchasesProps) => {
  const [schedules, setSchedules] = useState<ScheduledPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getScheduledPurchasesForUser(userId);
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching scheduled purchases:', error);
      toast.error('Gagal memuat jadwal pembelian.');
      setSchedules([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSchedules();
    }
  }, [userId]);

  const handleCancelSchedule = async (scheduleId: number) => {
    try {
      await adminService.cancelScheduledPurchase(scheduleId);
      toast.success('Jadwal pembelian berhasil dibatalkan.');
      // Refresh the list after cancellation
      fetchSchedules();
    } catch (error) {
      console.error('Error canceling schedule:', error);
      toast.error('Gagal membatalkan jadwal pembelian.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!Array.isArray(schedules) || schedules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pembelian Terjadwal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Pengguna ini tidak memiliki pembelian terjadwal.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pembelian Terjadwal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div>
                <p className="font-semibold">{schedule.package_name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nomor: {schedule.phone_number}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tanggal: {new Date(schedule.scheduled_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Batalkan
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini akan membatalkan jadwal pembelian paket "{schedule.package_name}" untuk nomor {schedule.phone_number}. Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleCancelSchedule(schedule.id)}>
                      Lanjutkan
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserScheduledPurchases;
