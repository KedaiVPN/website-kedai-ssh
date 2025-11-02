import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { getBugsForUser } from '@/services/bugService';
import * as vpnUriService from '@/services/vpnUriService';
import ResultDisplay from '@/components/ResultDisplay';
import { Bug, Wand2 } from 'lucide-react';

interface InjectorFormValues {
  uri: string;
  bugId: string; // Storing ID as string from select
  action: 'generate-uri' | 'generate-yaml';
}

const BugInjectorPage: React.FC = () => {
  const [bugOptions, setBugOptions] = useState<vpnUriService.BugHost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<{ title: string; content: string } | null>(null);

  const form = useForm<InjectorFormValues>({
    defaultValues: {
      uri: '',
      action: 'generate-uri',
    },
  });

  const uriValue = form.watch('uri');

  const parsedConfig = useMemo(() => {
    if (!uriValue) return null;
    try {
      if (uriValue.startsWith('vmess://')) {
        return { type: 'vmess', config: vpnUriService.parseVMess(uriValue) };
      }
      if (uriValue.startsWith('vless://')) {
        return { type: 'vless', config: vpnUriService.parseVlessTrojan(uriValue) };
      }
      if (uriValue.startsWith('trojan://')) {
        return { type: 'trojan', config: vpnUriService.parseVlessTrojan(uriValue) };
      }
    } catch (e) {
      return null;
    }
    return null;
  }, [uriValue]);

  useEffect(() => {
    const fetchBugs = async () => {
      try {
        const bugs = await getBugsForUser();
        setBugOptions(bugs);
      } catch (error) {
        toast.error('Gagal memuat daftar bug.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBugs();
  }, []);

  const onSubmit = (values: InjectorFormValues) => {
    if (!parsedConfig) {
      toast.error('URI tidak valid. Silakan periksa kembali.');
      return;
    }
    const selectedBug = bugOptions.find(b => b.id === parseInt(values.bugId, 10));
    if (!selectedBug) {
      toast.error('Silakan pilih bug terlebih dahulu.');
      return;
    }

    const modifiedConfig = vpnUriService.injectBug(parsedConfig.config, selectedBug);

    if (values.action === 'generate-uri') {
      const newUri = vpnUriService.generateURI(parsedConfig.type as any, modifiedConfig);
      setResult({ title: 'Generated URI', content: newUri });
    } else {
      const newYaml = vpnUriService.generateYAML(parsedConfig.type as any, modifiedConfig);
      setResult({ title: 'Generated YAML', content: newYaml });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
                <Wand2 className="h-8 w-8 text-primary"/>
                <div>
                    <CardTitle>Bug Host Injector</CardTitle>
                    <CardDescription>Generate URI atau YAML dengan bug host kustom.</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="uri"
                  rules={{ required: 'URI tidak boleh kosong.' }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raw URI</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tempel URI vmess://, vless://, atau trojan:// di sini..." {...field} rows={6} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {parsedConfig && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="bugId"
                        rules={{ required: 'Silakan pilih bug.' }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Pilih Bug</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger disabled={isLoading}>
                                        <SelectValue placeholder={isLoading ? 'Memuat...' : 'Pilih bug host...'} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-72">
                                    {bugOptions.map(bug => (
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
                        name="action"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Pilih Aksi</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih aksi..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="generate-uri">Generate URI</SelectItem>
                                    <SelectItem value="generate-yaml">Generate YAML</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    <Button type="submit" className="w-full">
                        <Bug className="mr-2 h-4 w-4"/>
                        Generate
                    </Button>
                  </div>
                )}
              </form>
            </Form>

            {result && (
                <div className="mt-6 animate-fade-in">
                    <ResultDisplay title={result.title} content={result.content}/>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default BugInjectorPage;
