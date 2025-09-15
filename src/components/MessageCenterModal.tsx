import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from './ui/scroll-area';
import { UserMessage } from '@/services/messageService';

interface MessageCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: UserMessage[];
  onMarkAsRead: (messageId: number) => void;
}

const MessageCenterModal: React.FC<MessageCenterModalProps> = ({
  isOpen,
  onClose,
  messages,
  onMarkAsRead,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pusat Pemberitahuan</DialogTitle>
          <DialogDescription>
            Berikut adalah semua pesan dan pemberitahuan untuk Anda.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 pr-6">
          {messages.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {messages.map((msg) => (
                <AccordionItem value={`item-${msg.id}`} key={msg.id}>
                  <AccordionTrigger
                    onClick={() => {
                      if (!msg.is_read) {
                        onMarkAsRead(msg.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                       {!msg.is_read && <div className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0" />}
                       <span className={!msg.is_read ? 'font-bold' : ''}>{msg.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="prose dark:prose-invert">
                    <p>{msg.content}</p>
                    <p className="text-xs text-muted-foreground mt-4">
                      Diterima: {new Date(msg.created_at).toLocaleString('id-ID')}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-10">
              Tidak ada pesan untuk ditampilkan.
            </p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default MessageCenterModal;
