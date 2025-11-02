'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { careerAdviceChatbot } from '@/ai/flows/career-advice-chatbot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext, EvaluationContext } from '@/contexts/app-context';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { Message } from '@/lib/services';

interface ChatbotWidgetProps {
  className?: string;
  activeSessionId: string | null;
  onSessionChange: (newId: string | null) => void;
}

// Session-storage keys
const SS_INPUT_KEY = 'chatBotWidget_input';
const SS_SESSION_KEY = 'chatBotWidget_activeSessionId';
const SS_CONTEXT_KEY = 'newChatWithContext';

export default function ChatbotWidget({
  className,
  activeSessionId,
  onSessionChange,
}: ChatbotWidgetProps) {
  const { authed, saveCurrentChat, chatHistory, generateUserProfileJsonForChat } = useAppContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const handleSend = useCallback(async (
    textToSend: string, 
    isPersonalizedRequest: boolean = false, 
    // Allow passing a custom profile JSON for the *first* message with context
    customProfileJson?: string 
  ) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: 'user', text: textToSend.trim() };
    const conversationHistory = [...messages];
    const newMessages = [...messages, userMsg, { role: 'bot' as const, text: '' }];

    setMessages(newMessages);
    setLoading(true);
    setInput('');
    sessionStorage.removeItem(SS_INPUT_KEY);

    try {
      // Use the custom profile if provided (for context injection), otherwise generate it.
      const finalProfileJson = customProfileJson 
        ?? (isPersonalizedRequest ? generateUserProfileJsonForChat() : undefined);

      const response = await careerAdviceChatbot({
        userInput: userMsg.text,
        history: conversationHistory.filter(m => m.text), // Ensure no empty history messages
        userProfileJson: finalProfileJson,
      });

      typewriterAnimation(response.advice, newMessages);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMsg = { role: 'bot' as const, text: "Sorry, I'm having trouble connecting. Please try again later." };
      setMessages(prev => [...prev.slice(0, -1), errorMsg]);
      setLoading(false);
    }
  }, [loading, messages, generateUserProfileJsonForChat, saveCurrentChat, onSessionChange, activeSessionId]);
  
  const typewriterAnimation = (fullText: string, initialMessages: Message[]) => {
    let typed = '';
    const step = 2; 
    const interval = setInterval(() => {
      typed = fullText.slice(0, typed.length + step);
      setMessages((prev) => {
        const copy = [...prev];
        if (copy.length > 0) {
          copy[copy.length - 1].text = typed;
        }
        return copy;
      });

      if (typed.length >= fullText.length) {
        clearInterval(interval);
        setLoading(false);

        const final = [...initialMessages.slice(0, -1), { role: 'bot', text: fullText }];
        saveCurrentChat(final, activeSessionId).then((newId) => {
          if (newId && newId !== activeSessionId) {
            onSessionChange(newId);
          }
        });
      }
    }, 10);
  };

  // --- REFACTORED LOGIC ---
  // This single useEffect handles initial setup, including context injection.
  useEffect(() => {
    if (!isFirstRender.current) return;
    isFirstRender.current = false;
    
    const rawContext = sessionStorage.getItem(SS_CONTEXT_KEY);

    if (rawContext) {
      // --- CONTEXT INJECTION PATH ---
      sessionStorage.removeItem(SS_CONTEXT_KEY);
      try {
        const context: EvaluationContext = JSON.parse(rawContext);
        
        // 1. Create the initial user message.
        const initialUserMessage = `Give me deeper insights on my ${context.type} results.`;

        // 2. Enrich the user's base profile with the specific evaluation data.
        const baseProfile = generateUserProfileJsonForChat() || '{}';
        const enrichedProfileJson = JSON.stringify({
          ...JSON.parse(baseProfile),
          recentEvaluation: {
            type: context.type,
            inputs: context.inputs,
            data: context.result,
          },
          // Include resume text if it was part of the context
          ...(context.resumeText && { resumeUsedInEvaluation: context.resumeText }),
        }, null, 2);
        
        // 3. Set up the UI for a new chat and trigger the first AI call.
        onSessionChange(null);
        setMessages([{ role: 'user', text: initialUserMessage }]);
        handleSend(initialUserMessage, true, enrichedProfileJson);

      } catch (e) {
        console.error('Failed to parse chat context from sessionStorage', e);
        // Fallback to normal behavior if parsing fails
        loadNormalChatState();
      }
    } else {
      // --- NORMAL CHAT PATH ---
      loadNormalChatState();
    }
  }, [onSessionChange, generateUserProfileJsonForChat, handleSend, chatHistory, authed]);

  const loadNormalChatState = () => {
    const savedInput = sessionStorage.getItem(SS_INPUT_KEY);
    if (savedInput) setInput(savedInput);

    const savedId = sessionStorage.getItem(SS_SESSION_KEY);
    if (savedId && savedId !== 'null') {
      onSessionChange(savedId);
      const session = chatHistory.find(s => s.id === savedId);
      setMessages(session?.messages || []);
    } else {
      // Fresh chat, show a greeting.
      setMessages([{
        role: 'bot',
        text: authed ? "Hi! How can I help with your career? Click the ✨ button to get personalized advice." : 'Hi! Ask me anything about careers.',
      }]);
    }
  };

  // Sync messages when activeSessionId changes, but only if not in a context-injection flow.
  useEffect(() => {
    if (isFirstRender.current) return; // Don't run on the very first render

    const rawContext = sessionStorage.getItem(SS_CONTEXT_KEY);
    if (rawContext) return; // If context is present, the other effect will handle it.

    if (activeSessionId) {
      const session = chatHistory.find((s) => s.id === activeSessionId);
      setMessages(session?.messages || []);
    } else {
      // Switched to "New Chat"
      setMessages([{
          role: 'bot',
          text: authed ? "Hi! How can I help you plan your career?" : 'Hi! Ask me anything about careers.',
      }]);
      setInput('');
    }
  }, [activeSessionId, chatHistory, authed]);

  // Persist input & session ID to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(SS_INPUT_KEY, input);
    sessionStorage.setItem(SS_SESSION_KEY, activeSessionId || 'null');
  }, [input, activeSessionId]);
  
  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [messages]);

  const handlePersonalizedRequest = () => {
    handleSend('Please provide personalized advice based on my profile.', true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className={cn('rounded-lg border p-3 flex flex-col h-full', className)}>
      <ScrollArea className="flex-1 pr-3" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn('flex items-start gap-3 text-sm', m.role === 'user' && 'justify-end')}
            >
              {m.role === 'bot' && <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
              <div
                className={cn(
                  'rounded-lg px-3 py-2 max-w-[85%] break-words',
                  m.role === 'bot'
                    ? 'bg-muted prose prose-sm dark:prose-invert max-w-full'
                    : 'bg-primary text-primary-foreground'
                )}
              >
                <ReactMarkdown>
                  {m.text + (loading && i === messages.length - 1 ? '▋' : '')}
                </ReactMarkdown>
              </div>
              {m.role === 'user' && <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />}
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleFormSubmit} className="mt-4 flex gap-2">
        {authed && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handlePersonalizedRequest}
            disabled={loading}
            title="Get Personalized Advice"
          >
            <Sparkles className="h-4 w-4" />
          </Button>
        )}
        <Input
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}