'use client';
import { useEffect, useRef, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, CheckCircle, Award, BrainCircuit, Mic, Send, Upload, FileText, X, MessageSquare } from 'lucide-react';
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

interface InterviewContext {
  resumeText: string;
  candidateName: string;
  jobRole: string;
  difficulty: 'easy' | 'intermediate' | 'hard';
  focusField: string;
}

const fieldsList = [ "Technology", "Software Development", "Data Science & Analytics", "AI & Machine Learning", "Cybersecurity", "Cloud Computing & DevOps", "IT Infrastructure & Networking", "UX/UI Design", "Business", "Finance & Accounting", "Healthcare", "Creative Arts", "Engineering (Core)" ];

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
  const { user, mockInterviewState, setMockInterviewState, handleClearMockInterviewState, refreshEvaluations, setResumeText, startChatWithEvaluationContext, setIsInterviewActive } = useAppContext();
  const { toast } = useToast();
  
  const [isInterviewing, setIsInterviewing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  const interviewContextRef = useRef<InterviewContext | null>(null);
  
  const [jobRolePlaceholder, setJobRolePlaceholder] = useState('e.g., Enter job role');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // This cleanup effect ensures the main UI is restored if the user navigates away
  useEffect(() => {
    return () => {
      setIsInterviewActive(false);
    };
  }, [setIsInterviewActive]);


  const handleFieldChange = (newField: string) => {
    setMockInterviewState({ field: newField });
    setJobRolePlaceholder(fieldToJobRolePlaceholder[newField] || 'e.g., Enter job role');
    if (!mockInterviewState.resumeAnalysis) {
        setMockInterviewState({ jobRole: '' });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };
  
  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf' || file.size > 5 * 1024 * 1024) {
      setError('Please upload a PDF file under 5MB.');
      return;
    }
    setError('');

    const newPreviewUrl = URL.createObjectURL(file);
    // Clear any previous evaluation when a new file is uploaded
    setMockInterviewState({ uploadedFile: file, pdfPreviewUrl: newPreviewUrl, resumeAnalysis: null, evaluation: null });
    setIsAnalyzing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      const analysis = await analyzeResume({ file: formData });
      setMockInterviewState({
        resumeAnalysis: analysis,
        candidateName: analysis.name,
      });
      if (analysis.summary) setResumeText(analysis.summary);
    } catch (error: any) {
      setError('Failed to analyze resume.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startInterview = async () => {
    const { jobRole, field, difficulty, resumeAnalysis, candidateName } = mockInterviewState;

    if (!jobRole || !field || !difficulty) {
      setError('Please fill all required fields to start.');
      return;
    }
    setIsInterviewActive(true); // <-- HIDE MAIN UI
    setLoading(true); 
    setError(''); 
    setMessages([]); 
    setHistory([]);
    setMockInterviewState({ evaluation: null });

    const fullResumeText = resumeAnalysis 
      ? `CANDIDATE PROFILE:\nName: ${resumeAnalysis.name}\nTarget Role: ${resumeAnalysis.job_role}\nFocus Area: ${resumeAnalysis.focus_field}\n\nBACKGROUND:\n${resumeAnalysis.summary || ''}`
      : 'No resume provided';
      
    interviewContextRef.current = {
      resumeText: fullResumeText,
      candidateName: candidateName || 'Candidate',
      jobRole,
      difficulty,
      focusField: field,
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
      setIsInterviewing(true);
    } catch (e: any) {
      setError('Failed to start the interview. The AI service may be busy.');
      setIsInterviewActive(false); // <-- RESTORE UI ON ERROR
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
        setMockInterviewState({ evaluation: response.evaluation });
        setIsInterviewing(false);
        setIsInterviewActive(false); // <-- RESTORE MAIN UI
        
        if (user) {
            await evaluationService.saveInterview(user.uid, { 
                jobRole: interviewContextRef.current.jobRole,
                field: interviewContextRef.current.focusField,
                difficulty: interviewContextRef.current.difficulty,
                evaluation: response.evaluation, 
                history: response.history 
            });
            await refreshEvaluations();
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

  const handleInsight = () => {
    if (!mockInterviewState.evaluation || !interviewContextRef.current) return;
    startChatWithEvaluationContext({
        type: 'Mock Interview',
        inputs: {
            jobRole: interviewContextRef.current.jobRole,
            field: interviewContextRef.current.focusField,
            difficulty: interviewContextRef.current.difficulty,
        },
        result: mockInterviewState.evaluation,
        resumeText: interviewContextRef.current.resumeText,
    });
  };

  const renderSetup = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="font-headline text-2xl md:text-3xl">AI Mock Interview</CardTitle>
                <CardDescription>Set the parameters for your interview session.</CardDescription>
                <CardDescription>Set the parameters for your interview session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Upload Resume</label>
                    <p className="text-xs text-muted-foreground -mt-1 mb-2">This will tailor questions to your experience.</p>
                    {!mockInterviewState.uploadedFile ? (
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
                                    <p className="text-sm font-medium">{mockInterviewState.uploadedFile.name}</p>
                                    {isAnalyzing && <p className="text-xs text-muted-foreground">Analyzing...</p>}
                                    {mockInterviewState.resumeAnalysis && !isAnalyzing && <p className="text-xs text-green-600">✓ Analyzed</p>}
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setMockInterviewState({ uploadedFile: null, pdfPreviewUrl: '', resumeAnalysis: null, jobRole: '', field: '' })} className="h-8 w-8 p-0"> <X className="h-4 w-4" /> </Button>
                        </div>
                    )}
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-medium">Field / Industry *</label>
                     <Select value={mockInterviewState.field} onValueChange={handleFieldChange}>
                        <SelectTrigger><SelectValue placeholder="Select a field" /></SelectTrigger>
                        <SelectContent>{fieldsList.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Job Role *</label>
                    <Input placeholder={jobRolePlaceholder} value={mockInterviewState.jobRole} onChange={(e) => setMockInterviewState({ jobRole: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty Level *</label>
                    <label className="text-sm font-medium">Difficulty Level *</label>
                    <div className="grid grid-cols-3 gap-2">
                        <Button variant={mockInterviewState.difficulty === 'easy' ? 'default' : 'outline'} onClick={() => setMockInterviewState({ difficulty: 'easy' })}>Easy</Button>
                        <Button variant={mockInterviewState.difficulty === 'intermediate' ? 'default' : 'outline'} onClick={() => setMockInterviewState({ difficulty: 'intermediate' })}>Intermediate</Button>
                        <Button variant={mockInterviewState.difficulty === 'hard' ? 'default' : 'outline'} onClick={() => setMockInterviewState({ difficulty: 'hard' })}>Hard</Button>
                    </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button onClick={startInterview} disabled={loading || isAnalyzing || !mockInterviewState.jobRole || !mockInterviewState.field || !mockInterviewState.difficulty}> {loading ? "Initializing..." : "Start Interview"} </Button>
            </CardContent>
        </Card>
        <AnimatePresence>
            {mockInterviewState.pdfPreviewUrl && (
                <motion.div key="resume-preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                     <Card className="h-full min-h-[75vh]">
                        <CardHeader>
                            <CardTitle className="font-headline">Resume Preview</CardTitle>
                            <CardDescription>{mockInterviewState.uploadedFile?.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[calc(100%-78px)]">
                            <iframe src={mockInterviewState.pdfPreviewUrl} className="w-full h-full rounded-md border" title="Resume Preview" />
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
  );

  const renderInterviewing = () => ( <VoiceInterviewUI messages={messages} loading={loading} onSend={handleSend} onEnd={endInterview} /> );

  const renderFinished = () => {
      const { evaluation } = mockInterviewState;
      if (!evaluation) return null;

      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="shadow-sm max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"> <CheckCircle className="h-6 w-6 text-green-500"/> Interview Complete! </CardTitle>
                    <CardDescription>Here is your detailed evaluation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button onClick={handleInsight}>
                            <MessageSquare className="mr-2 h-4 w-4" /> Get more AI insight
                        </Button>
                        <Button onClick={handleClearMockInterviewState} variant="outline">Start New Interview</Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
      )
  };

  const renderContent = () => {
    if (mockInterviewState.evaluation) return renderFinished();
    if (isInterviewing) return renderInterviewing();
    return renderSetup();
  }

  return (
    <div className='space-y-6'>
      {renderContent()}
    </div>
  );
}