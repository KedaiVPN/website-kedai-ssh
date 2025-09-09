import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ResultDisplayProps {
  title: string;
  content: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ title, content }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Berhasil disalin ke clipboard!');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="p-4 bg-muted rounded-lg text-sm overflow-x-auto">
          <code>{content}</code>
        </pre>
      </CardContent>
    </Card>
  );
};

export default ResultDisplay;
