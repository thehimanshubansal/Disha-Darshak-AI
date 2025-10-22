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
  focusField: string;
}

const fieldsList = [ "Technology", "Software Development", "Data Science & Analytics", "AI & Machine Learning", "Cybersecurity", "Cloud Computing & DevOps", "IT Infrastructure & Networking", "UX/UI Design", "Business", "Finance & Accounting", "Healthcare", "Creative Arts", "Engineering (Core)" ];

// --- MODIFICATION START: Expanded the placeholder mapping ---
const fieldToJobRolePlaceholder: { [key: string]: string } = { 
    "Technology": "e.g., Software Engineer", 
    "Software Development": "e.g., Frontend Developer",
    "Data Science & Analytics": "e.g., Data Scientist", 
    "AI & Machine Learning": "e.g., ML Engineer",
    "Cybersecurity": "e.g., Security Analyst",
    "Cloud Computing & DevOps": "e.g., DevOps Engineer",
    "IT Infrastructure & Networking": "e.g., Network Engineer",
    "UX/UI Design": "e.g., Product Designer",
    "Business": "e.g., Business Analyst",
    "Finance & Accounting": "e.g., Financial Analyst",
    "Healthcare": "e.g., Healthcare IT Specialist",
    "Creative Arts": "e.g., Graphic Designer",
    "Engineering (Core)": "e.g., Mechanical Engineer",
};

export default function MockInterview() {
  const { resumeText: appResumeText, user, setResumeText, refreshEvaluations } = useAppContext();
  const { toast } = useToast();
  const [state, setState] = useState<InterviewState>('setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Setup state
  const [candidateName, setCandidateName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [field, setField] = useState('');
  const [jobRolePlaceholder, setJobRolePlaceholder] = useState('e.g., Enter job role');
  const [difficulty, setDifficulty] = useState<'easy' | 'intermediate' | 'hard' | ''>('');
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');

  // Interview state
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  
  const interviewContextRef = useRef<InterviewContext | null>(null);

  useEffect(() => { if (user) { setCandidateName(user.name); } }, [user]);
  useEffect(() => { return () => { if (pdfPreviewUrl) { URL.revokeObjectURL(pdfPreviewUrl); } }; }, [pdfPreviewUrl]);

  const handleFieldChange = (newField: string) => {
    setField(newField);
    setJobRolePlaceholder(fieldToJobRolePlaceholder[newField] || 'e.g., Enter job role');
    if (!resumeAnalysis) {
        setJobRole('');
    }
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
      const newField = analysis.focus_field || 'Technology';
      setField(newField);
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
    setCandidateName(user?.name || 'Candidate');
  };

  const startInterview = async () => {
    if (!jobRole || !field || !difficulty) return; // Redundant check for safety
    setLoading(true); setError(''); setMessages([]); setHistory([]); setEvaluation(null);

    const fullResumeText = resumeAnalysis 
      ? `CANDIDATE PROFILE:\nName: ${resumeAnalysis.name}\nTarget Role: ${resumeAnalysis.job_role}\nFocus Area: ${resumeAnalysis.focus_field}\n\nBACKGROUND:\n${resumeAnalysis.summary || ''}`
      : appResumeText || 'No resume provided';
      
    interviewContextRef.current = {
      resumeText: fullResumeText,
      candidateName: candidateName || 'Candidate',
      jobRole,
      difficulty,
      focusField: field,
    };
    
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
            await refreshEvaluations();
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
                <CardDescription>Set the parameters for your interview session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Upload Resume</label>
                    <p className="text-xs text-muted-foreground -mt-1 mb-2">This will tailor questions to your experience.</p>
                    {!uploadedFile ? (
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                            <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" id="resume-upload" />
                            <label htmlFor="resume-upload" className="cursor-pointer">
                                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">Upload a PDF resume (Max 5MB)</p>
                            </label>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="text-sm font-medium">{uploadedFile.name}</p>
                                    {analyzing && <p className="text-xs text-muted-foreground">Analyzing...</p>}
                                    {resumeAnalysis && <p className="text-xs text-green-600">✓ Analyzed</p>}
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={removeUploadedFile} className="h-8 w-8 p-0"> <X className="h-4 w-4" /> </Button>
                        </div>
                    )}
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-medium">Field / Industry *</label>
                     <Select value={field} onValueChange={handleFieldChange}>
                        <SelectTrigger><SelectValue placeholder="Select a field" /></SelectTrigger>
                        <SelectContent>{fieldsList.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Job Role *</label>
                    <Input placeholder={jobRolePlaceholder} value={jobRole} onChange={(e) => setJobRole(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty Level *</label>
                    <div className="grid grid-cols-3 gap-2">
                        <Button variant={difficulty === 'easy' ? 'default' : 'outline'} onClick={() => setDifficulty('easy')}>Easy</Button>
                        <Button variant={difficulty === 'intermediate' ? 'default' : 'outline'} onClick={() => setDifficulty('intermediate')}>Intermediate</Button>
                        <Button variant={difficulty === 'hard' ? 'default' : 'outline'} onClick={() => setDifficulty('hard')}>Hard</Button>
                    </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button onClick={startInterview} disabled={loading || !jobRole || !field || !difficulty}> {loading ? "Initializing..." : "Start Interview"} </Button>
            </CardContent>
        </Card>
        <AnimatePresence>
            {pdfPreviewUrl && (
                <motion.div key="resume-preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                     <Card className="h-[75vh]">
                        <CardHeader>
                            <CardTitle className="font-headline">Resume Preview</CardTitle>
                            <CardDescription>{uploadedFile?.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[calc(100%-78px)]">
                            <iframe src={pdfPreviewUrl} className="w-full h-full rounded-md border" title="Resume Preview" />
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