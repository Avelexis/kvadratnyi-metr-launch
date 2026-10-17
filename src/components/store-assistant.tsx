import * as Dialog from '@radix-ui/react-dialog';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { Mic, X, ArrowUp, AudioLines, PhoneOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { content, type Language } from '@/lib/store-content';
import { getAssistantCredentials } from '@/lib/assistant.functions';

type ChatMessage = { role: 'user' | 'agent'; text: string };
type AssistantError = 'mic' | 'connection' | null;

export function StoreAssistant({ open, onOpenChange, language }: { open: boolean; onOpenChange: (value: boolean) => void; language: Language }) {
  return <ConversationProvider>
    <AssistantDialog open={open} onOpenChange={onOpenChange} language={language} />
  </ConversationProvider>;
}

function AssistantDialog({ open, onOpenChange, language }: { open: boolean; onOpenChange: (value: boolean) => void; language: Language }) {
  const t = content[language];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<AssistantError>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const credentialsRef = useRef<{ token: string; signedUrl: string | null } | null>(null);
  const fellBackRef = useRef(false);

  const conversation = useConversation({
    onMessage: (message) => {
      const text = message.message;
      if (!text.trim()) return;
      setMessages(prev => [...prev, { role: message.role === 'user' ? 'user' : 'agent', text }]);
    },
    onError: () => { setError('connection'); setConnecting(false); },
    onConnect: () => setConnecting(false),
    onDisconnect: () => setConnecting(false),
    onStatusChange: ({ status }) => {
      // WebRTC media can be blocked by the visitor's network; retry once over WebSocket.
      if (status === 'error' && !fellBackRef.current && credentialsRef.current?.signedUrl) {
        fellBackRef.current = true;
        setConnecting(true);
        try {
          conversation.startSession({ signedUrl: credentialsRef.current.signedUrl, connectionType: 'websocket' });
        } catch {
          setError('connection');
          setConnecting(false);
        }
      }
    },
  });

  const connected = conversation.status === 'connected';

  const startConversation = useCallback(async () => {
    if (connecting || connected) return; // one session at a time
    setError(null);
    setConnecting(true);
    fellBackRef.current = false;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('mic');
      setConnecting(false);
      return;
    }
    try {
      const credentials = await getAssistantCredentials();
      credentialsRef.current = credentials;
      conversation.startSession({ conversationToken: credentials.token, connectionType: 'webrtc' });
    } catch {
      setError('connection');
      setConnecting(false);
    }
  }, [connecting, connected, conversation]);

  const endConversation = useCallback(() => {
    conversation.endSession();
    setConnecting(false);
  }, [conversation]);

  // Clean up the session whenever the panel closes.
  useEffect(() => {
    if (!open && conversation.status !== 'disconnected') conversation.endSession();
  }, [open, conversation]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function sendText(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || !connected) return;
    conversation.sendUserMessage(text);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
  }

  const statusText = connecting ? t.assistantConnecting
    : connected ? (conversation.isSpeaking ? t.assistantSpeaking : t.assistantListening)
    : t.assistantStatus;

  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="assistant-overlay" />
      <Dialog.Content className="assistant-panel" onEscapeKeyDown={() => onOpenChange(false)}>
        <div className="assistant-header">
          <span className="assistant-avatar"><AudioLines aria-hidden="true" /></span>
          <div className="min-w-0"><Dialog.Title className="font-semibold">{t.assistantTitle}</Dialog.Title><p className="text-xs text-muted-foreground" role="status" data-sdk-status={conversation.status}>{statusText}</p></div>
          <Dialog.Close asChild><Button variant="ghost" size="icon" className="ml-auto min-h-11 min-w-11" aria-label={t.close}><X /></Button></Dialog.Close>
        </div>
        <div className="assistant-conversation" ref={scrollRef}>
          <span className="assistant-welcome-icon"><Mic aria-hidden="true" /></span>
          <h2>{t.assistantWelcome}</h2>
          <Dialog.Description className="text-muted-foreground leading-relaxed">{t.assistantText}</Dialog.Description>
          {messages.map((message, i) => <p key={i} className={`assistant-message ${message.role === 'user' ? 'is-user' : 'is-agent'}`}>{message.text}</p>)}
        </div>
        <div className="assistant-composer">
          {error && <p className="mb-3 flex items-center gap-2 text-xs text-destructive" role="alert"><PhoneOff size={14} />{error === 'mic' ? t.assistantMicError : t.assistantConnectionError}</p>}
          <form className="flex items-center gap-2" onSubmit={sendText}>
            {connected
              ? <Button type="button" variant="destructive" size="icon" aria-label={t.end} className="min-h-11 min-w-11" onClick={endConversation}><PhoneOff /></Button>
              : <Button type="button" size="icon" aria-label={t.assistantStart} className="min-h-11 min-w-11" disabled={connecting} onClick={startConversation}>{connecting ? <Loader2 className="animate-spin" /> : <Mic />}</Button>}
            <input aria-label={t.assistantPlaceholder} placeholder={connected ? t.assistantPlaceholder : t.assistantPlaceholderOff} disabled={!connected} value={input} onChange={e => setInput(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm" />
            <Button type="submit" size="icon" aria-label={t.assistantSend} className="min-h-11 min-w-11" disabled={!connected || !input.trim()}><ArrowUp /></Button>
          </form>
          {connected
            ? <Button variant="ghost" className="mt-3 w-full" onClick={endConversation}>{t.end}</Button>
            : <Button variant="ghost" className="mt-3 w-full" disabled={connecting} onClick={startConversation}>{connecting ? t.assistantConnecting : t.assistantStart}</Button>}
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
