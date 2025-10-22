'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { evaluationService } from '@/lib/services';
import { useAppContext } from '@/contexts/app-context';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

// The full, default list of questions for the main "Skill-set Finder" page.
const fullQuestions = [
    { id: 'educationLevel', question: 'What is your highest level of education completed?', type: 'mcq', options: ['High School', 'Diploma', 'Bachelor’s Degree', 'Master’s Degree', 'Doctorate', 'Other'], required: true },
    { id: 'specialization', question: 'What subjects or fields did you specialize in during your education?', type: 'mcq', options: ['Science', 'Engineering', 'Arts', 'Commerce', 'Management', 'Medicine', 'Law', 'Other'], required: true },
    { id: 'favoriteSubjects', question: 'Which subjects/topics do you enjoy the most?', type: 'mcq', options: ['Mathematics', 'Science', 'Technology', 'Literature', 'History', 'Arts', 'Business', 'Other'], required: true },
    { id: 'strongestSkills', question: 'What are your strongest skills?', type: 'mcq', options: ['Technical', 'Creative', 'Analytical', 'Communication', 'Leadership', 'Problem-solving', 'Other'], required: true },
    { id: 'skillsToImprove', question: 'Are there any skills you want to improve or learn in the future?', type: 'mcq', options: ['Programming', 'Public Speaking', 'Data Analysis', 'Writing', 'Design', 'Leadership', 'Other'], required: true },
    { id: 'dreamCareer', question: 'What is your dream career or job role (if you already have one in mind)?', type: 'text', required: false },
    { id: 'careerMotivation', question: 'What motivates you the most in a career?', type: 'mcq', options: ['Money', 'Stability', 'Creativity', 'Impact', 'Leadership', 'Work-life Balance', 'Growth Opportunities'], required: true },
    { id: 'workStyle', statement: 'Do you prefer working individually?', type: 'likert', required: true },
    { id: 'industryPreference', question: 'Which industries are you most interested in?', type: 'mcq', options: ['Technology', 'Healthcare', 'Business', 'Education', 'Arts', 'Finance', 'Government', 'Other'], required: true },
    { id: 'logicVsCreativity', statement: 'I see myself as more logical/analytical than creative/innovative.', type: 'likert', required: true },
    { id: 'problemSolvingStyle', statement: 'I usually solve problems through step-by-step analysis.', type: 'likert', required: true },
    { id: 'workEnvironment', statement: 'I work best in a structured and organized work environment.', type: 'likert', required: true },
    { id: 'futureVision', question: 'Where do you see yourself in the next 5–10 years?', type: 'text', required: false },
    { id: 'constraints', question: 'Do you have any specific limitations or constraints (financial, location, physical, etc.) that should be considered in your career planning?', type: 'text', required: false },
];

const likertOptions = [
    { value: 1, emoji: '☹️', label: 'Strongly Disagree' },
    { value: 2, emoji: '🙁', label: 'Disagree' },
    { value: 3, emoji: '😐', label: 'Neutral' },
    { value: 4, emoji: '🙂', label: 'Agree' },
    { value: 5, emoji: '😊', label: 'Strongly Agree' },
];

type RoleSuggestion = {
    role: string;
    why_it_fits: string;
    how_to_prepare: string[];
};

type InitialAnalysis = {
    scores?: Record<string, number | string>;
    roles?: RoleSuggestion[];
};

interface SkillAssessmentFormProps {
    onComplete?: (answers: any) => void;
    questions?: typeof fullQuestions;
}

export default function SkillAssessmentForm({ onComplete, questions: customQuestions }: SkillAssessmentFormProps) {
    const { user, refreshEvaluations } = useAppContext();
    const { toast } = useToast();

    const questions = customQuestions || fullQuestions;
    const isSignupQuiz = !!onComplete;

    const [isFinished, setIsFinished] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [key: string]: any }>({});
    const [error, setError] = useState('');
    
    const [analysis, setAnalysis] = useState<InitialAnalysis | null>(null);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [roadmap, setRoadmap] = useState<any | null>(null);

    const currentQuestion = questions[currentQuestionIndex];
    const progress = isFinished ? 100 : ((currentQuestionIndex) / questions.length) * 100;

    const resetForm = () => {
        setAnswers({});
        setCurrentQuestionIndex(0);
        setIsFinished(false);
        setAnalysis(null);
        setSelectedRole(null);
        setRoadmap(null);
        setError('');
    };

    const handleAnswer = (value: any) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
        if (error) setError('');
    };

    const handleNext = () => {
        if (currentQuestion.required && (answers[currentQuestion.id] === undefined || answers[currentQuestion.id] === '')) {
            setError('Please provide an answer to continue.');
            return;
        }
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if (isSignupQuiz && onComplete) {
            onComplete(answers);
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/skill-assessment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers }),
            });
            const data = await res.json();
            setAnalysis(data);
            setIsFinished(true);
            toast({ title: "Assessment Analyzed!", description: "Your career suggestions are ready below." });
        } catch (err) {
            toast({ title: "Error", description: "Failed to analyze assessment. Please try again.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRoleSelectAndGenerateRoadmap = async (role: string) => {
        setSelectedRole(role);
        setIsGeneratingRoadmap(true);
        try {
             const res = await fetch("/api/generate-roadmap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers, selectedRole: role }),
            });
            const finalData = await res.json();
            if (finalData.roadmap) {
                setRoadmap(finalData.roadmap);
                if (user) {
                    await evaluationService.saveSkillAssessment(user.uid, finalData);
                    await refreshEvaluations();
                }
                toast({ title: "Roadmap Generated!", description: `Your personalized plan for ${role} is ready.` });
            } else { throw new Error("Could not generate roadmap."); }
        } catch(err) {
             toast({ title: "Error", description: "Failed to generate roadmap. Please try again.", variant: "destructive" });
             setSelectedRole(null);
        } finally {
            setIsGeneratingRoadmap(false);
        }
    }

    const panelVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -30 },
    };

    const renderQuiz = () => (
        <>
            <CardHeader>
                <CardTitle className="font-headline">Skill Assessment</CardTitle>
                <CardDescription>Answer these questions to help us understand your profile better.</CardDescription>
                <Progress value={progress} className="mt-2" />
            </CardHeader>
            <CardContent className="min-h-[300px]">
                <AnimatePresence mode="wait">
                    <motion.div key={currentQuestionIndex} variants={panelVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }}>
                        <h3 className="text-lg font-semibold mb-4">{currentQuestion.question || currentQuestion.statement}</h3>
                        {renderInput()}
                        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
                    </motion.div>
                </AnimatePresence>
            </CardContent>
            <div className="p-6 border-t flex justify-between items-center">
                <Button variant="outline" onClick={() => setCurrentQuestionIndex(p => p - 1)} disabled={currentQuestionIndex === 0}><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Button>
                <Button onClick={handleNext} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{currentQuestionIndex < questions.length - 1 ? 'Next' : 'Submit Assessment'}{currentQuestionIndex < questions.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}</Button>
            </div>
        </>
    );
    
    const renderResults = () => {
        if (roadmap) {
            return (
                 <motion.div key="roadmap" variants={panelVariants} initial="hidden" animate="visible" exit="exit" className="p-6">
                    <div className="text-center mb-6"><CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" /><h3 className="text-2xl font-bold font-headline">Your Personalized Roadmap for a <span className="text-primary">{selectedRole}</span></h3><p className="text-muted-foreground mt-2 max-w-2xl mx-auto">{roadmap?.introduction}</p></div>
                    <Accordion type="multiple" defaultValue={['skills', 'timeline']} className="w-full max-w-2xl mx-auto">
                         <AccordionItem value="skills"><AccordionTrigger>Key Skills to Develop</AccordionTrigger><AccordionContent><ul className="space-y-3 pt-2">{roadmap?.key_skills_to_develop.map((item: any, index: number) => (<li key={index}><p className="font-semibold">{item.skill}</p><p className="text-xs text-muted-foreground">{item.importance}</p></li>))}</ul></AccordionContent></AccordionItem>
                        <AccordionItem value="timeline"><AccordionTrigger>Step-by-Step Timeline</AccordionTrigger><AccordionContent><ul className="space-y-4 pt-2">{roadmap?.timeline_steps.map((item: any, index: number) => (<li key={index}><p className="font-semibold">{item.duration}</p><ul className="list-disc list-inside text-sm text-muted-foreground mt-1">{item.action_items.map((action: string, idx: number) => <li key={idx}>{action}</li>)}</ul></li>))}</ul></AccordionContent></AccordionItem>
                        <AccordionItem value="projects"><AccordionTrigger>Portfolio Project Ideas</AccordionTrigger><AccordionContent><ul className="list-decimal list-inside space-y-2 pt-2 text-sm">{roadmap?.project_ideas.map((idea: string, index: number) => <li key={index}>{idea}</li>)}</ul></AccordionContent></AccordionItem>
                    </Accordion>
                    <p className="text-center text-sm text-muted-foreground mt-6 italic">{roadmap?.final_advice}</p>
                    <div className="text-center mt-4"><Button onClick={resetForm} variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Start a New Quiz</Button></div>
                </motion.div>
            );
        }

        return (
            <motion.div key="analysis" variants={panelVariants} initial="hidden" animate="visible" exit="exit" className="p-6">
                <div className="text-center"><Sparkles className="h-12 w-12 text-primary mx-auto mb-4" /><h3 className="text-xl font-bold font-headline">Assessment Complete!</h3><p className="text-muted-foreground mt-2 mb-6">Here are your results. Select a career path to generate a detailed, personalized roadmap.</p></div>
                {analysis?.scores && (<Card className="mb-6 bg-muted/50"><CardHeader><CardTitle className="text-lg">Your Profile Scores</CardTitle><CardDescription>These scores reflect your answers on a scale of 1 to 5.</CardDescription></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">{Object.entries(analysis.scores).map(([key, val]) => (<div key={key} className="p-3 border rounded-lg bg-background flex justify-between items-center"><span className="capitalize font-medium">{key.replace(/_/g, " ")}</span><span className="font-semibold text-primary">{typeof val === 'number' ? val.toFixed(1) : val}</span></div>))}</div></CardContent></Card>)}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{analysis?.roles?.map((role: RoleSuggestion) => (<Card key={role.role} className="shadow-md hover:shadow-lg transition flex flex-col"><CardHeader><CardTitle className="text-lg font-bold text-primary">{role.role}</CardTitle></CardHeader><CardContent className="space-y-4 flex-grow"><div><h3 className="font-semibold text-sm mb-1">Why it fits:</h3><p className="text-sm text-muted-foreground">{role.why_it_fits}</p></div><div><h3 className="font-semibold text-sm mb-1">How to prepare:</h3><ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">{role.how_to_prepare.map((step: string) => <li key={step}>{step}</li>)}</ul></div></CardContent><div className="p-6 pt-0"><Button className="w-full" onClick={() => handleRoleSelectAndGenerateRoadmap(role.role)} disabled={isGeneratingRoadmap}>{isGeneratingRoadmap && selectedRole === role.role ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Generate Roadmap</Button></div></Card>))}</div>
                 <div className="text-center mt-8"><Button onClick={resetForm} variant="link">Or, start a new quiz</Button></div>
            </motion.div>
        );
    };

    const renderInput = () => {
        const answer = answers[currentQuestion.id];
        const isOtherSelected = (typeof answer === 'object' && answer?.selected === 'Other') || answer === 'Other';
        switch(currentQuestion.type) {
            case 'mcq': return (<div className="space-y-2"><RadioGroup value={typeof answer === 'object' ? answer.selected : answer} onValueChange={(value) => { if (value === 'Other') { handleAnswer({ selected: 'Other', text: '' }); } else { handleAnswer(value); } }} className="space-y-2">{currentQuestion.options?.map(option => (<div key={option} className="flex items-center space-x-2 p-3 rounded-lg border has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 transition-colors"><RadioGroupItem value={option} id={option} /><Label htmlFor={option} className="flex-1 cursor-pointer">{option}</Label></div>))}</RadioGroup>{isOtherSelected && (<motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} className="pt-2"><Input placeholder="Please specify" value={typeof answer === 'object' ? answer.text : ''} onChange={(e) => handleAnswer({ selected: 'Other', text: e.target.value })} className="mt-2" required /></motion.div>)}</div>);
            case 'text': return <Textarea placeholder="Your answer here..." value={answers[currentQuestion.id] || ''} onChange={e => handleAnswer(e.target.value)} />;
            case 'likert': return (<div className="flex justify-around items-end pt-4">{likertOptions.map(opt => (<button key={opt.value} onClick={() => handleAnswer(opt.value)} className={cn("text-center group transition-transform hover:scale-110", answers[currentQuestion.id] === opt.value ? 'scale-110' : 'opacity-60 hover:opacity-100')}><div className={cn("text-4xl rounded-full p-2 transition-all")}>{opt.emoji}</div><div className={cn("text-xs font-medium text-muted-foreground mt-2", answers[currentQuestion.id] === opt.value && 'text-primary underline')}>{opt.label}</div></button>))}</div>);
            default: return null;
        }
    };
    
    if (isSignupQuiz) {
        return (
            <div className="min-h-[300px]">
                <AnimatePresence mode="wait">
                    <motion.div key={currentQuestionIndex} variants={panelVariants} initial="hidden" animate="visible" exit="exit">
                        <h3 className="text-lg font-semibold mb-4 text-center">{currentQuestion.question || currentQuestion.statement}</h3>
                        {renderInput()}
                        {error && <p className="text-sm text-destructive mt-2 text-center">{error}</p>}
                    </motion.div>
                </AnimatePresence>
                <div className="p-6 pt-8 flex justify-between items-center">
                    <Button variant="outline" onClick={() => setCurrentQuestionIndex(p => p - 1)} disabled={currentQuestionIndex === 0}><ArrowLeft className="mr-2 h-4 w-4" /> Previous</Button>
                    <Button onClick={handleNext}>{currentQuestionIndex < questions.length - 1 ? 'Next' : 'Get Suggestions'}{currentQuestionIndex < questions.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}</Button>
                </div>
                <Progress value={progress} className="h-1" />
            </div>
        );
    }
    
    return (
      <>
        <motion.h1 className="text-2xl md:text-3xl font-bold font-headline text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>AI Skill-set Finder</motion.h1>
        <Card className="max-w-6xl mx-auto shadow-sm">{!isFinished ? renderQuiz() : renderResults()}</Card>
      </>
    );
}