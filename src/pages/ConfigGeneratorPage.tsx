import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { getBugsForUser, BugHost } from '@/services/bugService';
import { authService } from '@/services/authService';
import { FileCode, Loader2, Download } from 'lucide-react';

interface GeneratorFormValues {
  protocol: 'ssh' | 'vmess' | 'vless' | 'trojan';
  appType: 'hc' | 'hc_old' | 'dark';
  templateId: string;
  accountId: string;
}

const API_BASE_URL = window.location.origin;

export const ConfigGeneratorPage: React.FC = () => {
  const [templates, setTemplates] = useState<BugHost[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<GeneratorFormValues>({
    defaultValues: {
      protocol: 'ssh',
      appType: 'hc',
      templateId: '',
      accountId: '',
    },
  });

  const selectedProtocol = form.watch('protocol');
  const isXray = ['vmess', 'vless', 'trojan'].includes(selectedProtocol);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [bugsData, accountsResponse] = await Promise.all([
          getBugsForUser(),
          fetch(`${API_BASE_URL}/api/accounts`, {
            headers: { 'Authorization': `Bearer ${authService.getToken()}` }
          }).then(res => res.json())
        ]);

        setTemplates(bugsData);
        if (accountsResponse.success) {
            setAccounts(accountsResponse.data);
        }
      } catch (error) {
        toast.error('Gagal memuat data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter templates based on selected protocol
  const filteredTemplates = useMemo(() => {
      return templates.filter(t => {
          if (selectedProtocol === 'ssh') {
              return t.protocol === 'ssh';
          } else if (['vmess', 'vless', 'trojan'].includes(selectedProtocol)) {
              return t.protocol === 'xray'; // vmess, vless, trojan share xray templates
          }
          return false;
      });
  }, [templates, selectedProtocol]);

  // Filter accounts based on selected protocol
  const filteredAccounts = useMemo(() => {
      return accounts.filter(a => {
          // Hanya tampilkan akun dengan status active (belum expired)
          return a.protocol === selectedProtocol && a.status === 'active';
      });
  }, [accounts, selectedProtocol]);

  // Reset dependent fields when protocol changes
  useEffect(() => {
      form.setValue('templateId', '');
      form.setValue('accountId', '');
  }, [selectedProtocol, form]);


  const onSubmit = async (values: GeneratorFormValues) => {
    setIsGenerating(true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/config-generator/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authService.getToken()}`
            },
            body: JSON.stringify({
                accountId: values.accountId,
                templateId: values.templateId,
                appType: values.appType === 'hc_old' ? 'hc_old' : (values.appType === 'hc' ? 'hc' : 'dark')
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Gagal meng-generate config');
        }

        // Handle file download
        const blob = await response.blob();

        // Extract filename from header if possible
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'config_generated';
        if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(contentDisposition);
            if (matches != null && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        } else {
             // Fallback extension
             filename += (values.appType === 'dark' ? '.dark' : '.hc');
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success('Config berhasil di-generate dan diunduh!');
    } catch (error: any) {
        toast.error(error.message);
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-20">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
                <FileCode className="h-8 w-8 text-primary"/>
                <div>
                    <CardTitle>Config Generator</CardTitle>
                    <CardDescription>Buat file konfigurasi (.hc / .dark) secara otomatis.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="protocol"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Pilih Protokol</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih protokol..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="ssh">SSH</SelectItem>
                                    <SelectItem value="vmess">VMESS</SelectItem>
                                    <SelectItem value="vless">VLESS</SelectItem>
                                    <SelectItem value="trojan">TROJAN</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="appType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Pilih Aplikasi</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih aplikasi..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="hc">HTTP Custom (.hc)</SelectItem>
                                    <SelectItem value="dark">Dark Tunnel (.dark)</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>

                    <FormField
                    control={form.control}
                    name="templateId"
                    rules={{ required: 'Silakan pilih template.' }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Template Payload / Bug</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger disabled={filteredTemplates.length === 0}>
                                    <SelectValue placeholder={filteredTemplates.length === 0 ? "Tidak ada template untuk protokol ini" : "Pilih template..."} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-72">
                                {filteredTemplates.map(bug => (
                                    <SelectItem key={bug.id} value={String(bug.id)}>{bug.label}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                    control={form.control}
                    name="accountId"
                    rules={{ required: 'Silakan pilih akun VPN.' }}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Pilih Akun Anda</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger disabled={filteredAccounts.length === 0}>
                                    <SelectValue placeholder={filteredAccounts.length === 0 ? "Anda tidak memiliki akun dengan protokol ini" : "Pilih akun..."} />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-72">
                                {filteredAccounts.map(acc => (
                                    <SelectItem key={acc.id} value={String(acc.id)}>{acc.username} ({acc.server_name})</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                    />

                    <Button type="submit" className="w-full" disabled={isGenerating || filteredTemplates.length === 0 || filteredAccounts.length === 0}>
                        {isGenerating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        {isGenerating ? 'Memproses...' : 'Generate & Download'}
                    </Button>
                </form>
                </Form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ConfigGeneratorPage;
