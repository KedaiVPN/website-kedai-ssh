import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Check } from 'lucide-react';

const TelegramReverseProxy = () => {
    const [fileId, setFileId] = useState('');
    const [generatedUrl, setGeneratedUrl] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = () => {
        setError('');
        if (!fileId.trim()) {
            setError('File ID tidak boleh kosong.');
            setGeneratedUrl('');
            return;
        }
        // Generate the URL locally in the frontend.
        // The backend will handle the actual proxying when this URL is requested.
        const url = `${window.location.origin}/api/proxy/video/${fileId.trim()}`;
        setGeneratedUrl(url);
    };

    const handleCopyToClipboard = () => {
        if (!generatedUrl) return;
        navigator.clipboard.writeText(generatedUrl).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2 seconds
        });
    };

    return (
        <div className="p-4 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Telegram Video Reverse Proxy</h2>
            <p className="text-sm text-muted-foreground mb-4">
                Masukkan File ID video dari Telegram untuk membuat link embed internal.
                Dapatkan File ID dari <a href="https://t.me/Kedaissh_notifBot" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Bot</a>.
            </p>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="file-id">Telegram File ID</Label>
                    <Input
                        id="file-id"
                        value={fileId}
                        onChange={(e) => setFileId(e.target.value)}
                        placeholder="Contoh: BAACAgIAAxkBAA..."
                    />
                     {error && <p className="text-sm text-red-500">{error}</p>}
                </div>

                <Button onClick={handleGenerate}>Generate Link</Button>

                {generatedUrl && (
                    <div className="space-y-2 pt-4">
                        <Label htmlFor="generated-url">URL Hasil Reverse Proxy</Label>
                        <div className="flex items-center gap-2">
                            <Input id="generated-url" value={generatedUrl} readOnly className="flex-1" />
                            <Button variant="outline" size="icon" onClick={handleCopyToClipboard}>
                                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                <span className="sr-only">Salin ke Clipboard</span>
                            </Button>
                        </div>
                          <div className="mt-4">
                            <Label>Pratinjau Video</Label>
                            <video key={generatedUrl} controls preload="metadata" className="w-full max-w-md mt-2 border rounded-lg bg-black">
                                <source src={generatedUrl} type="video/mp4" />
                                Browser Anda tidak mendukung tag video.
                            </video>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TelegramReverseProxy;
