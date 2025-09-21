'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Send, Bot, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';

// AnimatedText component (no changes)
const AnimatedText = ({ text, isActive, speed = 50 }: { text: string; isActive: boolean; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isActive || !text) {
      setDisplayedText('');
      setCurrentIndex(0);
      return;
    }
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [text, isActive, currentIndex, speed]);

  useEffect(() => {
    if (isActive) {
      setDisplayedText('');
      setCurrentIndex(0);
    }
  }, [text, isActive]);

  return (
    <span className="inline-block">
      {displayedText}
      {isActive && currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          className="inline-block w-0.5 h-4 bg-current ml-1"
        />
      )}
    </span>
  );
};


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

export default function VoiceInterviewUI({ messages, loading, onSend, onEnd }: VoiceInterviewUIProps) {
  const [showTextInput, setShowTextInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isAnimatingText, setIsAnimatingText] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSpokenTextRef = useRef<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const lastMessage = messages[messages.length - 1];

  // --- FINAL, ROBUST TTS FUNCTION ---
  const speakLastBotMessage = async () => {
    if (!lastMessage || lastMessage.role !== 'bot' || !lastMessage.text || !lastMessage.text.trim()) {
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setIsAnimatingText(true);
    setIsSpeaking(true);
    lastSpokenTextRef.current = lastMessage.text;

    try {
      const response = await textToSpeech({ text: lastMessage.text });
      if (response.audio && audioRef.current) {
        const audioSrc = `data:audio/mpeg;base64,${response.audio}`;
        audioRef.current.src = audioSrc;
        
        // CRITICAL FIX: Handle the promise returned by .play() to catch autoplay errors.
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Audio playback failed:", error);
            // This happens if the browser blocks autoplay. Gracefully stop animations.
            setIsSpeaking(false);
            setIsAnimatingText(false);
          });
        }
      } else {
        // If no audio is returned, stop the speaking state.
        setIsSpeaking(false);
        setIsAnimatingText(false);
      }
    } catch (e) {
      console.error('Backend TTS error:', e);
      setIsSpeaking(false);
      setIsAnimatingText(false);
    }
  };

  useEffect(() => {
    if (lastMessage?.role === 'bot' && lastMessage.text !== lastSpokenTextRef.current) {
      speakLastBotMessage();
    }
  }, [lastMessage]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const handleAudioEnd = () => {
        setIsSpeaking(false);
        setTimeout(() => setIsAnimatingText(false), 500);
      };
      audioElement.addEventListener('ended', handleAudioEnd);
      return () => {
        audioElement.removeEventListener('ended', handleAudioEnd);
      };
    }
  }, []);
  
  // ... (rest of the component remains the same)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicSupported(false);
      return;
    }
    try {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript += transcript;
          else interimTranscript += transcript;
        }
        setVoiceTranscript(finalTranscript + interimTranscript);
      };
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') setMicError('Microphone permission denied.');
      };
      recognitionRef.current.onend = () => setIsListening(false);
    } catch (e) {
      setMicSupported(false);
    }
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleMicClick = async () => {
    if (!micSupported) return;
    if (isSpeaking || loading) {
      setMicError('Wait for AI to finish speaking.');
      setTimeout(() => setMicError(null), 3000);
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicError(null);
    } catch (e) {
      setMicError('Microphone permission denied.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      if (voiceTranscript.trim()) onSend(voiceTranscript.trim());
      setVoiceTranscript('');
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSendText = () => {
    if (inputValue.trim()) {
      onSend(inputValue);
      setInputValue('');
      setShowTextInput(false);
    }
  };

  const getOrbState = () => {
    if (loading && !isSpeaking) return 'loading';
    if (isSpeaking) return 'speaking';
    if (isProcessingVoice) return 'processing';
    if (isListening) return 'listening';
    return 'idle';
  };
  
  const orbVariants: Record<string, any> = {
    idle: { scale: 1, transition: { duration: 1.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } },
    listening: { scale: 1.1, boxShadow: '0 0 40px rgba(59,130,246,0.35)', transition: { duration: 0.3, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } },
    speaking: { scale: 1.05, boxShadow: '0 0 50px rgba(99,102,241,0.45)', transition: { duration: 0.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' } },
    loading: { rotate: 360, transition: { duration: 1, repeat: Infinity, ease: 'linear' } },
  };

  return (
    <div className="fixed inset-0 bg-background z-50 grid grid-cols-1 md:grid-cols-2 h-full">
      <div className="flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <motion.div
          key="orb"
          className="relative w-32 h-24 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-blue-300 via-sky-400 to-primary flex items-center justify-center text-white"
          variants={orbVariants}
          animate={getOrbState()}
          initial="idle"
        >
          {isSpeaking && (
            <div className="absolute bottom-6 flex items-end gap-1">
              {[5, 8, 12, 8, 5].map((h, idx) => (
                <motion.div key={idx} initial={{ height: h }} animate={{ height: [h, h + 14, h - 6, h + 10, h] }} transition={{ duration: 0.9 + idx * 0.05, repeat: Infinity, ease: 'easeInOut' }} className="w-1.5 rounded-sm bg-white/80" />
              ))}
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div key={getOrbState()} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center text-center">
              {loading && !isSpeaking && <Loader2 className="h-8 md:h-12 w-8 md:w-12 animate-spin" />}
              {isSpeaking && <p className="text-xs md:text-base font-medium">AI is speaking...</p>}
              {isListening && <p className="text-xs md:text-base font-medium">Listening...</p>}
              {!loading && !isSpeaking && !isListening && <Mic className="h-8 md:h-12 w-8 md:w-12" />}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {isAnimatingText && lastMessage?.role === 'bot' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute bottom-32 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white text-center max-w-md mx-auto">
              <AnimatedText text={lastMessage.text} isActive={isAnimatingText} speed={40} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isListening && voiceTranscript && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute bottom-32 left-4 right-4 bg-blue-500/80 backdrop-blur-sm rounded-lg p-4 text-white text-center max-w-md mx-auto">
              <p className="text-sm opacity-80 mb-1">You're saying:</p>
              <p className="font-medium">{voiceTranscript}</p>
              {voiceTranscript.trim() && (
                <Button size="sm" onClick={() => { if (voiceTranscript.trim()) { onSend(voiceTranscript.trim()); setVoiceTranscript(''); } }} className="mt-2 h-7 text-xs">
                  Send Now
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTextInput && (
            <motion.div className="w-full max-w-md mt-4 md:mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
              <div className="flex gap-2">
                <Input placeholder="Or type your answer..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendText()} />
                <Button onClick={handleSendText} disabled={!inputValue.trim()}> <Send className="h-4 w-4" /> </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-4 flex items-center justify-center w-full gap-4 sm:gap-8">
          <Button variant="ghost" className="text-muted-foreground" onClick={() => setShowTextInput((s) => !s)}> Type </Button>
          <Button size="lg" className={cn('rounded-full w-16 h-16 md:w-20 md:h-20 shadow-lg', isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-primary')} onClick={handleMicClick} disabled={!micSupported || loading || isSpeaking}>
            <Mic className="h-6 md:h-8 w-6 md:w-8" />
          </Button>
          <Button variant="destructive" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12" onClick={onEnd}> <X className="h-5 md:h-6 w-5 md:w-6" /> </Button>
        </div>

        {micError && (
          <div className="absolute bottom-20 w-full px-4">
            <div className="text-xs md:text-sm text-center text-destructive bg-destructive/10 rounded-md px-3 py-2"> {micError} </div>
          </div>
        )}
      </div>

      <div className="bg-muted/50 flex flex-col h-full min-h-0 overflow-hidden border-t md:border-t-0 md:border-l">
        <Card className="flex-1 m-2 md:m-4 shadow-inner bg-background/50">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"> <MessageSquare className="h-5 w-5" /> Interview Transcript </CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-78px)] min-h-0">
            <ScrollArea className="h-full pr-4 overflow-y-auto" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((m, i) => {
                  const isLatestBotMessage = i === messages.length - 1 && m.role === 'bot';
                  return (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      {m.role === 'bot' && <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
                      <div className="rounded-lg px-3 py-2 bg-background/80 flex-1">
                        {isLatestBotMessage && isAnimatingText ? ( <AnimatedText text={m.text} isActive={true} speed={40} /> ) : ( m.text )}
                      </div>
                    </div>
                  );
                })}
                {loading && !isSpeaking && (
                  <div className="flex items-start gap-3 text-sm">
                    <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="rounded-lg px-3 py-2 bg-background/80 animate-pulse flex-1">Thinking...</div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <audio ref={audioRef} className="hidden" preload="auto" playsInline />
    </div>
  );
}