'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Send, Bot, Loader2, MessageSquare, User, Trash2, StopCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

type Message = {
  role: 'user' | 'bot';
  text: string;
};

interface VoiceInterviewUIProps {
  messages: Message[];
  loading: boolean;
  onSend: (text: string) => void;
  onEnd: () => void;
}

const SpeakingAnimation = () => (
    <div className="flex items-center justify-center gap-1.5 h-16 w-16">
        <motion.div
            className="w-2 h-4 bg-white rounded-full"
            animate={{ height: ["8px", "32px", "8px"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
            className="w-2 h-8 bg-white rounded-full"
            animate={{ height: ["32px", "8px", "32px"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
        <motion.div
            className="w-2 h-4 bg-white rounded-full"
            animate={{ height: ["8px", "32px", "8px"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        />
    </div>
);

export default function VoiceInterviewUI({ messages, loading, onSend, onEnd }: VoiceInterviewUIProps) {
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSpokenTextRef = useRef<string | null>(null);
  const finalTranscriptRef = useRef<string>('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const lastMessage = messages[messages.length - 1];

  // This effect will disable and re-enable body scrolling
  useEffect(() => {
    // When the interview UI mounts, disable scrolling on the main page.
    document.body.style.overflow = 'hidden';

    // When the interview UI unmounts (interview ends), re-enable scrolling.
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []); // The empty array ensures this runs only once on mount and unmount.

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const speakLastBotMessage = async () => {
    if (!lastMessage || lastMessage.role !== 'bot' || !lastMessage.text || !lastMessage.text.trim()) return;
    if (lastMessage.text === lastSpokenTextRef.current) return;
    if (isListening) handleCancelVoice();

    setIsSpeaking(true);
    lastSpokenTextRef.current = lastMessage.text;

    try {
      const response = await textToSpeech({ text: lastMessage.text });
      if (response.audio && audioRef.current) {
        audioRef.current.src = `data:audio/mpeg;base64,${response.audio}`;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Audio playback failed:", error);
            setIsSpeaking(false);
          });
        }
      } else {
        setIsSpeaking(false);
      }
    } catch (e) {
      console.error('Backend TTS error:', e);
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      speakLastBotMessage();
    }
  }, [lastMessage, loading]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const handleAudioEnd = () => setIsSpeaking(false);
      audioElement.addEventListener('ended', handleAudioEnd);
      audioElement.addEventListener('pause', handleAudioEnd);
      return () => {
        audioElement.removeEventListener('ended', handleAudioEnd);
        audioElement.removeEventListener('pause', handleAudioEnd);
      };
    }
  }, []);
  
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicSupported(false);
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    
    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setVoiceTranscript(finalTranscriptRef.current + interimTranscript);
    };

    recognitionRef.current.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        setMicError('Microphone access denied. Please check your browser settings.');
        setIsListening(false);
      }
    };

    recognitionRef.current.onend = () => {};

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const startListening = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicError(null);
      finalTranscriptRef.current = '';
      setVoiceTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    } catch (e) {
      setMicError('Microphone access denied.');
    }
  };

  const stopAndSend = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
    setTimeout(() => {
      const textToSend = (voiceTranscript).trim();
      if (textToSend) {
        onSend(textToSend);
      }
      setVoiceTranscript('');
      finalTranscriptRef.current = '';
    }, 100);
  };

  const handleCancelVoice = () => {
    if (recognitionRef.current) recognitionRef.current.abort();
    setIsListening(false);
    setVoiceTranscript('');
    finalTranscriptRef.current = '';
  };

  const handleMainMicClick = () => {
    if (!micSupported || loading || isSpeaking) return;
    if (isListening) {
      stopAndSend();
    } else {
      startListening();
    }
  };

  const handleSendText = () => {
    if (inputValue.trim()) {
      onSend(inputValue);
      setInputValue('');
    }
  };

  const getOrbState = () => {
    if (loading && !isSpeaking) return 'loading';
    if (isSpeaking) return 'speaking';
    if (isListening) return 'listening';
    return 'idle';
  };
  
  const orbVariants: Record<string, any> = {
    idle: { scale: 1, transition: { duration: 1.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } },
    listening: { scale: 1.15, boxShadow: '0 0 40px hsl(var(--primary) / 0.5)', transition: { duration: 0.3, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } },
    speaking: { scale: 1.08, boxShadow: '0 0 60px hsl(var(--accent) / 0.6)', transition: { duration: 0.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } },
    loading: { scale: 1.08, boxShadow: '0 0 60px hsl(var(--accent) / 0.6)', transition: { duration: 0.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } },
  };

  return (
    <TooltipProvider delayDuration={300}>
        <div className="fixed inset-0 bg-background z-[60] grid grid-cols-1 md:grid-cols-2 h-full">
        
        <div className="flex flex-col items-center justify-between p-8 relative overflow-hidden bg-black/5">
          <div className="h-20" />

          <div className="flex-1 flex items-center justify-center w-full">
            <motion.div
              key="orb"
              className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-2xl"
              variants={orbVariants}
              animate={getOrbState()}
              initial="idle"
            >
              <AnimatePresence mode="wait">
                <motion.div 
                    key={getOrbState()} 
                    initial={{ opacity: 0, scale: 0.8 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="drop-shadow-md"
                >
                  {isSpeaking || (loading && !isListening) ? <SpeakingAnimation /> : <Mic className="h-16 w-16" />}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="w-full max-w-lg mx-auto flex flex-col items-center gap-6">
            <div className="h-48 w-full flex items-end justify-center">
                <AnimatePresence>
                {isListening && voiceTranscript && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.9 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                        className="bg-card/90 backdrop-blur-md border shadow-xl rounded-xl p-4 text-center w-full interview-scrollbar"
                        style={{ maxHeight: '12rem', overflowY: 'auto' }}
                    >
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Live Transcript</p>
                        <p className="text-lg font-medium leading-relaxed text-foreground">{voiceTranscript}</p>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
            
            <div className="flex items-center justify-center w-full gap-6 z-10">
              <div className="w-14 h-14">
                <AnimatePresence>
                  {isListening && (
                      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                           <Tooltip>
                              <TooltipTrigger asChild>
                                  <Button variant="secondary" size="icon" className="rounded-full w-14 h-14 bg-muted hover:bg-muted/80 border shadow-sm" onClick={handleCancelVoice}>
                                      <Trash2 className="h-6 w-6 text-muted-foreground" />
                                  </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Cancel Voice Input</p></TooltipContent>
                           </Tooltip>
                      </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" className={cn('rounded-full w-24 h-24 shadow-xl transition-all duration-300', isListening ? 'bg-red-500 hover:bg-red-600 hover:scale-105' : 'bg-primary hover:bg-primary/90 hover:scale-105', (loading || isSpeaking) && 'opacity-50 cursor-not-allowed')} onClick={handleMainMicClick} disabled={!micSupported || loading || isSpeaking}>
                    {isListening ? <StopCircle className="h-10 w-10 text-white" /> : <Mic className="h-10 w-10 text-white" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isListening ? 'Stop & Send' : 'Start Speaking'}</p></TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full w-14 h-14 hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-colors" onClick={onEnd}>
                    <X className="h-8 w-8" />
                  </Button>
                </TooltipTrigger>
                 <TooltipContent><p>End Interview</p></TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          <AnimatePresence>
            {micError && (
              <motion.div initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} className="absolute bottom-2 w-full px-4">
                  <div className="text-sm font-medium text-center text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-4 py-2 max-w-md mx-auto shadow-sm">{micError}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-muted/30 flex flex-col h-full min-h-0 overflow-hidden border-t md:border-t-0 md:border-l backdrop-blur-xl">
          <Card className="flex-1 m-0 md:m-4 shadow-lg bg-background/60 border-0 md:border flex flex-col rounded-none md:rounded-xl overflow-hidden">
            <CardHeader className="border-b bg-background/50 backdrop-blur-md py-4">
              <CardTitle className="font-headline flex items-center gap-2 text-lg"> <MessageSquare className="h-5 w-5 text-primary" /> Interview Transcript </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0 relative">
              <div ref={scrollContainerRef} className="h-full overflow-y-auto interview-scrollbar px-4 py-6 space-y-6">
                {messages.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex w-full items-start gap-3", m.role === 'user' && "justify-end")}>
                    {m.role === 'bot' && (<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20"><Bot className="h-5 w-5 text-primary" /></div>)}
                    <div className={cn("rounded-2xl px-4 py-3 max-w-[85%] shadow-sm text-sm", m.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-card border rounded-tl-none")}>
                      <ReactMarkdown components={{ p: ({...props}) => <p className={cn("max-w-full", m.role === 'user' ? "dark:prose-invert" : "")} {...props} /> }}>{m.text}</ReactMarkdown>
                    </div>
                    {m.role === 'user' && (<div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 border border-accent/20"><User className="h-5 w-5 text-accent" /></div>)}
                  </motion.div>
                ))}
                
                {loading && !isSpeaking && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Bot className="h-5 w-5 text-primary" /></div>
                    <div className="rounded-2xl px-4 py-3 bg-card border text-sm flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /><span className="text-muted-foreground font-medium">Thinking...</span></div>
                  </motion.div>
                )}
              </div>
            </CardContent>
            
            <div className="p-4 border-t bg-background/80 backdrop-blur-md">
              <div className="flex gap-2 relative">
                <Input placeholder="Type your answer here..." className="pr-12 py-6 text-base shadow-sm bg-background/80 backdrop-blur-sm" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendText()} disabled={loading} />
                <Button size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full" onClick={handleSendText} disabled={!inputValue.trim() || loading}><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        </div>
        
        <audio ref={audioRef} className="hidden" preload="auto" playsInline />
      </div>
    </TooltipProvider>
  );
}