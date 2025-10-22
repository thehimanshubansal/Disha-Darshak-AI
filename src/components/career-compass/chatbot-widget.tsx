'use client';
import { useEffect, useRef, useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { careerAdviceChatbot } from '@/ai/flows/career-advice-chatbot'; // Import the Server Action
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/app-context';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { Message } from '@/lib/services';

interface ChatbotWidgetProps {
  resumeAware: boolean;
  className?: string;
  activeSessionId: string | null;
  onSessionChange: (newId: string | null) => void;
}

export default function ChatbotWidget({ resumeAware, className, activeSessionId, onSessionChange }: ChatbotWidgetProps) {
  const { resumeText, authed, saveCurrentChat, chatHistory } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeSessionId) {
        const activeSession = chatHistory.find(s => s.id === activeSessionId);
        setMessages(activeSession?.messages || []);
    } else {
        setMessages([{
            role: 'bot',
            text: resumeAware ? "Hi! I've reviewed your resume. How can I help with your career?" : "Hi! Ask me anything about careers.",
        }]);
    }
  }, [activeSessionId, chatHistory, resumeAware]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user' as const, text: input.trim() };
    const conversationHistory = [...messages];
    const newMessages = [...messages, userMsg, { role: 'bot' as const, text: '' }]; // Add user message and bot placeholder
    
    setMessages(newMessages);
    setLoading(true);
    setInput(''); // Clear input immediately

    try {
      // Call the Server Action directly, passing the conversation history
      const response = await careerAdviceChatbot({
        resumeText: authed && resumeAware ? resumeText : '',
        userInput: userMsg.text,
        history: conversationHistory,
      });

      // Start the typing animation with the full response
      typewriterAnimation(response.advice, newMessages);

    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMsg = { role: 'bot' as const, text: "Sorry, I'm having trouble connecting. Please try again later." };
      setMessages(prev => [...prev.slice(0, -1), errorMsg]); // Replace placeholder with error
      setLoading(false);
    }
  };

  const typewriterAnimation = (fullText: string, initialMessages: Message[]) => {
    let typedText = '';
    const interval = setInterval(() => {
      // Reveal 2 characters at a time for speed, or adjust as needed
      typedText = fullText.slice(0, typedText.length + 2);
      
      setMessages(prev => {
        const updatedMessages = [...prev];
        updatedMessages[updatedMessages.length - 1].text = typedText;
        return updatedMessages;
      });

      if (typedText.length >= fullText.length) {
        clearInterval(interval);
        setLoading(false);
        // Save the final, complete conversation
        const finalMessages = [...initialMessages.slice(0, -1), { role: 'bot' as const, text: fullText }];
        saveCurrentChat(finalMessages, activeSessionId).then(newId => {
            if (newId && newId !== activeSessionId) {
                onSessionChange(newId);
            }
        });
      }
    }, 10); // Adjust typing speed here (lower is faster)
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
        setTimeout(() => {
            const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
            if(viewport) viewport.scrollTop = viewport.scrollHeight;
        }, 100);
    }
  }, [messages[messages.length - 1]?.text]);

  return (
    <div className={cn("rounded-lg border p-3 flex flex-col h-full", className)}>
      <ScrollArea className="h-48 flex-1 pr-3" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex items-start gap-3 text-sm", m.role === 'user' && 'justify-end')}>
              {m.role === 'bot' && <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
              <div className={cn(
                "rounded-lg px-3 py-2 max-w-[85%]",
                 m.role === 'bot' 
                  ? 'bg-muted prose prose-sm dark:prose-invert max-w-full'
                  : 'bg-primary text-primary-foreground'
              )}>
                <ReactMarkdown>{m.text + (loading && i === messages.length - 1 ? '▍' : '')}</ReactMarkdown>
              </div>
              {m.role === 'user' && <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="mt-4 flex gap-2">
        <Input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        <Button onClick={handleSend} disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}