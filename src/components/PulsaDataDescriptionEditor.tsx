import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { DigiflazzProduct } from '@/services/digiflazzService';

interface Props {
  product: DigiflazzProduct | null;
  productType: 'pulsa' | 'data';
  isOpen: boolean;
  onClose: () => void;
  onSave: (sku: string, description: string, productType: 'pulsa' | 'data') => Promise<void>;
}

const PulsaDataDescriptionEditor = ({ product, productType, isOpen, onClose, onSave }: Props) => {
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setDescription(product.description || '');
    }
  }, [product]);

  const handleSave = async () => {
    if (!product) return;
    setIsSaving(true);
    try {
      await onSave(product.buyer_sku_code, description, productType);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Deskripsi Produk</DialogTitle>
          <DialogDescription>
            Ubah deskripsi untuk produk: <span className="font-semibold">{product?.product_name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description-editor">Deskripsi</Label>
            <ReactQuill
              id="description-editor"
              theme="snow"
              value={description}
              onChange={setDescription}
              modules={modules}
              formats={formats}
              className="bg-white dark:bg-gray-800"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PulsaDataDescriptionEditor;
