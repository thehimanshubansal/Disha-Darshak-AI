// src/components/career-compass/mock-interview.tsx

'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, CheckCircle, Award, BrainCircuit, Mic, Send, Upload, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/app-context';
import { conductInterview, InterviewEvaluation } from '@/ai/flows/mock-interview-flow';
import { analyzeResume } from '@/ai/flows/resume-analysis';
import { evaluationService } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';
import VoiceInterviewUI from './voice-interview-ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { FIELDS_OF_INTEREST, findFieldDetails } from '@/lib/fields-of-interest';

type Message = {
  role: 'user' | 'bot';
  text: string;
};

type InterviewState = 'setup' | 'interviewing' | 'finished';

type ResumeAnalysis = {
  name: string;
  job_role: string;
  focus_field: string;
  summary?: string;
};

interface InterviewContext {
  resumeText: string;
  candidateName: string;
  jobRole: string;
  difficulty: 'easy' | 'intermediate' | 'hard';
  focusCategory: string;
  focusField: string;
}

export default function MockInterview() {
  const { resumeText: appResumeText, user, setResumeText } = useAppContext();
  const { toast } = useToast();
  const [state, setState] = useState<InterviewState>('setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [candidateName, setCandidateName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobRolePlaceholder, setJobRolePlaceholder] = useState('e.g., Software Engineer');
  const [difficulty, setDifficulty] = useState<'easy' | 'intermediate' | 'hard'>('intermediate');
  
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof FIELDS_OF_INTEREST>("Software Engineering");
  // --- MODIFICATION START ---
  const [selectedField, setSelectedField] = useState<string | null>(null);
  // --- MODIFICATION END ---
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');

  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  
  const interviewContextRef = useRef<InterviewContext | null>(null);

  useEffect(() => {
    if (user) {
      setCandidateName(user.name);
      const userFieldDetails = findFieldDetails(user.fieldOfInterest);
      if (userFieldDetails) {
        setSelectedCategory(userFieldDetails.category as keyof typeof FIELDS_OF_INTEREST);
        setSelectedField(userFieldDetails.field);
        setJobRolePlaceholder(FIELDS_OF_INTEREST[userFieldDetails.category as keyof typeof FIELDS_OF_INTEREST].placeholder);
      } else {
        const defaultCategory = "Software Engineering";
        setSelectedCategory(defaultCategory);
        // --- MODIFICATION START ---
        setSelectedField(null);
        // --- MODIFICATION END ---
        setJobRolePlaceholder(FIELDS_OF_INTEREST[defaultCategory].placeholder);
      }
    } else {
        const defaultCategory = "Software Engineering";
        setSelectedCategory(defaultCategory);
        setSelectedField(null);
        setJobRolePlaceholder(FIELDS_OF_INTEREST[defaultCategory].placeholder);
    }
  }, [user]);

  useEffect(() => { 
    return () => { if (pdfPreviewUrl) { URL.revokeObjectURL(pdfPreviewUrl); } }; 
  }, [pdfPreviewUrl]);

  const handleCategoryChange = (newCategoryKey: string) => {
    const newCategory = newCategoryKey as keyof typeof FIELDS_OF_INTEREST;
    setSelectedCategory(newCategory);
    // --- MODIFICATION START ---
    setSelectedField(null);
    // --- MODIFICATION END ---
    setJobRole('');
    setJobRolePlaceholder(FIELDS_OF_INTEREST[newCategory].placeholder || 'e.g., Enter job role');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf' || file.size > 5 * 1024 * 1024) {
        setError('Please upload a PDF file under 5MB.');
        return;
      }
      setUploadedFile(file);
      setError('');
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(URL.createObjectURL(file));
      analyzeResumeFile(file);
    }
  };

  const analyzeResumeFile = async (file: File) => {
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const analysis = await analyzeResume({ file: formData });
      setResumeAnalysis(analysis);
      setCandidateName(analysis.name);
      setJobRole(analysis.job_role);
      
      const fieldDetails = findFieldDetails(analysis.focus_field);
      if (fieldDetails) {
          handleCategoryChange(fieldDetails.category);
          setSelectedField(fieldDetails.field);
      }
      
      if (analysis.summary) setResumeText(analysis.summary);
    } catch (error: any) {
      setError('Failed to analyze resume.');
    } finally {
      setAnalyzing(false);
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setResumeAnalysis(null);
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl('');
  };

  const startInterview = async () => {
    setLoading(true); setError(''); setMessages([]); setHistory([]); setEvaluation(null);

    const fullResumeText = resumeAnalysis 
      ? `CANDIDATE PROFILE:\nName: ${resumeAnalysis.name}\nTarget Role: ${resumeAnalysis.job_role}\nFocus Area: ${resumeAnalysis.focus_field}\n\nBACKGROUND:\n${resumeAnalysis.summary || ''}`
      : appResumeText || 'No resume provided';
      
    // --- MODIFICATION START ---
    interviewContextRef.current = {
      resumeText: fullResumeText,
      candidateName: candidateName || 'Candidate',
      jobRole,
      difficulty,
      focusCategory: selectedCategory,
      focusField: selectedField || selectedCategory, // Use category if field is not selected
    };
    // --- MODIFICATION END ---
    
    try {
      const response = await conductInterview({
        ...interviewContextRef.current,
        history: [],
        userResponse: "Please start the interview."
      });
      setMessages([{ role: 'bot', text: response.question }]);
      setHistory(response.history);
      setState('interviewing');
    } catch (e: any) {
      setError('Failed to start the interview. The AI service may be busy.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || loading || !interviewContextRef.current) return;

    const userMsg: Message = { role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    
    try {
      const response = await conductInterview({
        ...interviewContextRef.current,
        history,
        userResponse: userMsg.text
      });

      if (response.evaluation) {
        setEvaluation(response.evaluation);
        setState('finished');
        
        if (user) {
            await evaluationService.saveInterview(user.uid, { 
                jobRole: interviewContextRef.current.jobRole,
                field: interviewContextRef.current.focusField,
                difficulty: interviewContextRef.current.difficulty,
                evaluation: response.evaluation, 
                history: response.history 
            });
        }
        
        toast({ title: "Interview Finished", description: "Your evaluation has been saved." });
      } else if (response.question && response.question.trim()) {
        const botMsg: Message = { role: 'bot', text: response.question };
        setMessages(prev => [...prev, botMsg]);
        setHistory(response.history);
      } else {
        throw new Error("AI returned an empty response.");
      }
    } catch (error: any) {
      const errorMsg: Message = { role: 'bot', text: "Sorry, I'm having trouble connecting. Please try again." };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  const endInterview = async () => {
    await handleSend("Please end the interview and provide my evaluation.");
  }

  const renderSetup = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="font-headline text-2xl md:text-3xl">AI Mock Interview</CardTitle>
                <CardDescription>Upload your resume and select your field to begin a personalized session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Upload Resume (Required)</label>
                    <div 
                        onClick={() => document.getElementById('resume-upload-mock')?.click()}
                        className="mt-1 flex justify-center rounded-lg border border-dashed border-muted-foreground/30 px-6 py-10 cursor-pointer hover:border-primary transition-colors"
                    >
                        <div className="text-center">
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-sm leading-6 text-muted-foreground">
                                <span className="font-semibold text-primary">Upload a file</span> or drag and drop
                            </p>
                            <p className="text-xs leading-5 text-muted-foreground">PDF up to 5MB</p>
                        </div>
                        <input id="resume-upload-mock" name="resume-upload-mock" type="file" className="sr-only" onChange={handleFileUpload} accept=".pdf" />
                    </div>
                    {analyzing && <p className="text-sm text-center text-muted-foreground animate-pulse">Analyzing resume...</p>}
                    {uploadedFile && !analyzing && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground border p-2 rounded-md">
                            <div className="flex items-center gap-2 truncate">
                                <FileText className="h-4 w-4 shrink-0" />
                                <span className="font-medium text-foreground truncate">{uploadedFile.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={removeUploadedFile} className="h-6 w-6 shrink-0">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Field of Interest</label>
                        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                            <SelectTrigger><SelectValue placeholder="Select a field" /></SelectTrigger>
                            <SelectContent>{Object.keys(FIELDS_OF_INTEREST).map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    {/* --- MODIFICATION START --- */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Specialization</label>
                        <Select value={selectedField || ''} onValueChange={setSelectedField}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a specialization (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {FIELDS_OF_INTEREST[selectedCategory]?.subFields.map((field) => (
                                    <SelectItem key={field} value={field}>{field}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* --- MODIFICATION END --- */}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Target Job Role</label>
                    <Input placeholder={jobRolePlaceholder} value={jobRole} onChange={(e) => setJobRole(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty Level</label>
                    <div className="grid grid-cols-3 gap-2">
                        <Button variant={difficulty === 'easy' ? 'default' : 'outline'} onClick={() => setDifficulty('easy')}>Easy</Button>
                        <Button variant={difficulty === 'intermediate' ? 'default' : 'outline'} onClick={() => setDifficulty('intermediate')}>Intermediate</Button>
                        <Button variant={difficulty === 'hard' ? 'default' : 'outline'} onClick={() => setDifficulty('hard')}>Hard</Button>
                    </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button onClick={startInterview} disabled={loading || !jobRole || !resumeAnalysis}>
                  {loading ? "Initializing..." : "Start Interview"}
                </Button>
            </CardContent>
        </Card>
        <AnimatePresence>
            {pdfPreviewUrl && (
                <motion.div 
                    className="h-[70vh] lg:h-auto"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="font-headline">Resume Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[calc(100%-60px)]">
                            <iframe src={pdfPreviewUrl} className="w-full h-full rounded-md border" title="Resume Preview"/>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
  );

  const renderInterviewing = () => ( <VoiceInterviewUI messages={messages} loading={loading} onSend={handleSend} onEnd={endInterview} /> );

  const renderFinished = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-sm max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"> <CheckCircle className="h-6 w-6 text-green-500"/> Interview Complete! </CardTitle>
                <CardDescription>Here is your detailed evaluation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {evaluation && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className='bg-muted/50'>
                            <CardHeader> <CardTitle className='text-lg font-bold flex items-center gap-2'><Award className='h-5 w-5 text-primary' /> Final Evaluation</CardTitle> </CardHeader>
                            <CardContent className='space-y-4'>
                                <div>
                                    <p className="text-sm text-muted-foreground">Soft Skill Score</p>
                                    <p className="text-2xl font-bold">{evaluation.FinalEvaluation.SoftSkillScore}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm">Overall Feedback</h4>
                                    <p className="text-sm text-muted-foreground mt-1">{evaluation.FinalEvaluation.OverallFeedback}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader> <CardTitle className='text-lg font-bold flex items-center gap-2'><BrainCircuit className='h-5 w-5 text-primary' /> Question Breakdown</CardTitle> </CardHeader>
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    {evaluation.QuestionPairs.map((pair, index) => (
                                        <AccordionItem value={`item-${index}`} key={index}>
                                            <AccordionTrigger>
                                                <div className='flex justify-between w-full pr-2'>
                                                    <span>{pair.QuestionNumber}. {pair.Question.substring(0, 30)}...</span>
                                                    <span className='font-bold text-primary'>{pair.FinalScore}</span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className='space-y-3'>
                                                <div>
                                                    <h5 className='font-semibold text-xs text-muted-foreground'>Ideal Answer</h5>
                                                    <p className='text-sm'>{pair.IdealAnswer}</p>
                                                </div>
                                                <div>
                                                    <h5 className='font-semibold text-xs text-muted-foreground'>Areas for Improvement</h5>
                                                    <p className='text-sm'>{pair.PotentialAreasOfImprovement}</p>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </CardContent>
                        </Card>
                    </div>
                )}
                <Button onClick={() => { setState('setup'); setEvaluation(null); }} className="w-full">Start New Interview</Button>
            </CardContent>
        </Card>
    </motion.div>
  );

  return (
    <div className='space-y-6'>
      {state === 'setup' && renderSetup()}
      {state === 'interviewing' && renderInterviewing()}
      {state === 'finished' && renderFinished()}
    </div>
  );
}