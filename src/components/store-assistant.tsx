import * as Dialog from '@radix-ui/react-dialog';
import { Mic, X, ArrowUp, Instagram, MapPin, AudioLines, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { content, store, type Language } from '@/lib/store-content';

// Integration boundary: replace the disconnected controls with an ElevenLabs
// session hook only after an agent and server-side credentials are configured.
export function StoreAssistant({ open, onOpenChange, language }: { open: boolean; onOpenChange: (value: boolean) => void; language: Language }) {
  const t = content[language];
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="assistant-overlay" />
      <Dialog.Content className="assistant-panel">
        <div className="assistant-header">
          <span className="assistant-avatar"><AudioLines aria-hidden="true" /></span>
          <div className="min-w-0"><Dialog.Title className="font-semibold">{t.assistantTitle}</Dialog.Title><p className="text-xs text-muted-foreground">{t.assistantStatus}</p></div>
          <Dialog.Close asChild><Button variant="ghost" size="icon" className="ml-auto min-h-11 min-w-11" aria-label={t.close}><X /></Button></Dialog.Close>
        </div>
        <div className="assistant-conversation">
          <span className="assistant-welcome-icon"><Mic aria-hidden="true" /></span>
          <h2>{t.assistantWelcome}</h2>
          <Dialog.Description className="text-muted-foreground leading-relaxed">{t.assistantText}</Dialog.Description>
          <Button variant="outline" asChild><a href="#contacts" onClick={() => onOpenChange(false)}><MapPin />{t.addressLabel}</a></Button>
          <Button asChild><a href={store.instagram} target="_blank" rel="noopener noreferrer"><Instagram />Instagram</a></Button>
        </div>
        <div className="assistant-composer">
          <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><PhoneOff size={14} />{t.voiceOff}</p>
          <div className="flex items-center gap-2"><Button disabled size="icon" aria-label={t.mic} className="min-h-11 min-w-11"><Mic /></Button><input disabled aria-label={t.assistantPlaceholder} placeholder={t.assistantPlaceholder} className="min-w-0 flex-1 bg-transparent text-sm" /><Button disabled size="icon" aria-label={t.assistantSend} className="min-h-11 min-w-11"><ArrowUp /></Button></div>
          <Button disabled variant="ghost" className="mt-3 w-full">{t.end}</Button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}