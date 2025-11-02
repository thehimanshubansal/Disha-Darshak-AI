'use client';
import { useRef, useState, useEffect, memo } from 'react';
import { useRef, useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileUp, CheckCircle, Lightbulb, ThumbsUp, ThumbsDown, Sparkles, Flame, Loader2, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/contexts/app-context';
import { evaluationService } from '@/lib/services';
import { rankResumeFlow } from '@/ai/flows/rank-resume';
import { roastResumeFlow } from '@/ai/flows/roast-resume';
import CircularProgress from './circular-progress';

const MemoizedResumePreview = memo(function MemoizedResumePreview({ url, fileName }: { url: string, fileName: string | undefined }) {
  return (
    <motion.div
      key="resume-preview"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="h-full"
    >
      <Card className="h-full min-h-[75vh]">
        <CardHeader>
          <CardTitle className="font-headline">Resume Preview</CardTitle>
          <CardDescription>{fileName}</CardDescription>
        </CardHeader>
        <CardContent className="h-[calc(100%-78px)]">
          <iframe
            src={url}
            className="w-full h-full rounded-md border"
            title="Resume Preview"
          />
        </CardContent>
      </Card>
    </motion.div>
  );
});

export default function ResumeRanker() {
  const { toast } = useToast();
  const { user, refreshEvaluations, resumeRankerState, setResumeRankerState, startChatWithEvaluationContext } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRoasting, setIsRoasting] = useState(false);
  const [activeTab, setActiveTab] = useState('rank');
  
  const { rankingResult, roastResult } = resumeRankerState;

  const processFile = async (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
        toast({ variant: 'destructive', title: "Invalid File Type", description: "Please upload a PDF file." });
        return;
    }

    const previewUrl = URL.createObjectURL(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        setResumeRankerState({
          uploadedFile: file,
          pdfPreviewUrl: previewUrl,
          pdfBase64: base64,
          // Clear previous results when a new file is uploaded
          rankingResult: null,
          roastResult: null,
        });
        toast({ title: "Resume Loaded", description: `Ready to analyze ${file.name}.` });
    };
    reader.onerror = () => {
        toast({ variant: 'destructive', title: "File Read Error", description: "Could not read the file." });
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if(file) processFile(file);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if(file) processFile(file);
  };

  const handleAnalyze = async () => {
    const { pdfBase64, jobRole, field } = resumeRankerState;
    if (!pdfBase64 || !jobRole || !field) {
        toast({ variant: 'destructive', title: "Missing Information", description: "Please upload a resume and fill out the job role and field." });
        toast({ variant: 'destructive', title: "Missing Information", description: "Please upload a resume and fill out the job role and field." });
        return;
    }
    if (!user) {
        toast({ variant: 'destructive', title: "Authentication Error", description: "You must be logged in to rank a resume." });
        return;
    }
    
    
    setIsAnalyzing(true);
    setResumeRankerState({ rankingResult: null, roastResult: null });
    try {
        const result = await rankResumeFlow({ pdfBase64, jobRole, field });
        setResumeRankerState({ rankingResult: result });
        setActiveTab('rank');
        await evaluationService.saveRankResult(user.uid, { jobRole, field, result });
        await refreshEvaluations();
        toast({ title: "Analysis Complete", description: "Your resume has been ranked and the result saved." });
    } catch (error) {
        console.error("Ranking error:", error);
        toast({ variant: 'destructive', title: "Analysis Failed", description: "The AI could not process your resume. Please try again." });
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleRoast = async () => {
    const { pdfBase64, jobRole, field } = resumeRankerState;
    if (!pdfBase64 || !jobRole || !field) {
        toast({ variant: 'destructive', title: "Missing Information", description: "Please upload a resume and fill out the job role and field." });
        toast({ variant: 'destructive', title: "Missing Information", description: "Please upload a resume and fill out the job role and field." });
        return;
    }
    if (!user) {
        toast({ variant: 'destructive', title: "Authentication Error", description: "You must be logged in to roast a resume." });
        return;
    }
    
    
    setIsRoasting(true);
    setResumeRankerState({ rankingResult: null, roastResult: null });
    try {
        const result = await roastResumeFlow({ pdfBase64, jobRole, field });
        setResumeRankerState({ roastResult: result });
        setActiveTab('roast');
        await evaluationService.saveRoastResult(user.uid, { jobRole, field, result });
        await refreshEvaluations();
        toast({ title: "Roast Complete", description: "Your resume has been roasted and the result saved." });
    } catch (error) {
        console.error("Roasting error:", error);
        toast({ variant: 'destructive', title: "Roast Failed", description: "The AI is feeling too nice today. Please try again." });
    } finally {
        setIsRoasting(false);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' }}
  };

  const handleRankInsight = () => {
    if (!rankingResult) return;
    startChatWithEvaluationContext({
        type: 'Resume Ranking',
        inputs: { jobRole: resumeRankerState.jobRole, field: resumeRankerState.field },
        result: rankingResult,
    });
  };

  const handleRoastInsight = () => {
    if (!roastResult) return;
    startChatWithEvaluationContext({
        type: 'Resume Roast',
        inputs: { jobRole: resumeRankerState.jobRole, field: resumeRankerState.field },
        result: roastResult,
    });
  };

  const RankingResults = () => (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }} className="space-y-6">
        <motion.div variants={itemVariants}>
            <Card>
                <CardHeader className="text-center">
                    <div className="mx-auto">
                        <CircularProgress progress={rankingResult?.match_score || 0} size={120} strokeWidth={10}/>
                    </div>
                    <CardTitle className="font-headline text-2xl pt-2">Match Score</CardTitle>
                    <CardDescription>{rankingResult?.final_recommendation}</CardDescription>
                </CardHeader>
            </Card>
        </motion.div>
        <motion.div variants={itemVariants}><Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ThumbsUp className="h-5 w-5 text-green-500"/> Strengths</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">{rankingResult?.strengths}</p></CardContent>
        </Card></motion.div>
        <motion.div variants={itemVariants}><Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ThumbsDown className="h-5 w-5 text-red-500"/> Weaknesses</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">{rankingResult?.weaknesses}</p></CardContent>
        </Card></motion.div>
        <motion.div variants={itemVariants}><Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-yellow-500"/> Missing Keywords</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                {rankingResult?.keywords_missing.map(k => <Badge key={k} variant="secondary">{k}</Badge>)}
            </CardContent>
        </Card></motion.div>
        <motion.div variants={itemVariants} className="text-center pt-4">
            <Button onClick={handleRankInsight}>
                <MessageSquare className="mr-2 h-4 w-4" /> Get more AI insight
            </Button>
        </motion.div>
    </motion.div>
  );

  const RoastResults = () => (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }} className="space-y-6">
        <motion.div variants={itemVariants}><Card>
            <CardHeader><CardTitle className="flex items-center gap-2 font-headline"><Flame className="h-6 w-6 text-orange-500"/> The Roast</CardTitle></CardHeader>
            <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    {roastResult?.roast_comments.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
            </CardContent>
        </Card></motion.div>
        <motion.div variants={itemVariants}><Card>
            <CardHeader><CardTitle className="flex items-center gap-2 font-headline"><Sparkles className="h-6 w-6 text-accent"/> (Actually Useful) Tips</CardTitle></CardHeader>
            <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    {roastResult?.improvement_tips.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
            </CardContent>
        </Card></motion.div>
        <motion.div variants={itemVariants} className="text-center pt-4">
            <Button onClick={handleRoastInsight}>
                <MessageSquare className="mr-2 h-4 w-4" /> Get more AI insight
            </Button>
        </motion.div>
    </motion.div>
  );
  
  const Placeholder = () => (
    <Card className="w-full text-center p-12 min-h-[75vh] flex flex-col justify-center">
        <CardHeader>
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
            <CardTitle className="font-headline mt-4">Awaiting Your Resume</CardTitle>
            <CardDescription>Upload your resume, provide details, and click an action to get started.</CardDescription>
        </CardHeader>
    </Card>
  const Placeholder = () => (
    <Card className="w-full text-center p-12 min-h-[75vh] flex flex-col justify-center">
        <CardHeader>
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
            <CardTitle className="font-headline mt-4">Awaiting Your Resume</CardTitle>
            <CardDescription>Upload your resume, provide details, and click an action to get started.</CardDescription>
        </CardHeader>
    </Card>
  );

  const showResults = !isAnalyzing && !isRoasting && (rankingResult || roastResult);
  const showPreview = resumeRankerState.pdfPreviewUrl && !showResults;

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1 } } }} className="space-y-6">
      <motion.h1 variants={itemVariants} className="text-2xl md:text-3xl font-bold font-headline text-center">TorchMyResume</motion.h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
            <Card className="shadow-sm sticky top-20">
                <CardHeader>
                    <CardTitle className="font-headline">Evaluation Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="resume-upload">1. Upload Resume (PDF only)</Label>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" id="resume-upload"/>
                        <div onClick={() => fileInputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                            className={cn("mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                            isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50")}>
                            {resumeRankerState.uploadedFile ? (
                                <div className="flex flex-col items-center gap-2 text-green-500">
                                    <CheckCircle className="h-8 w-8" />
                                    <span className="font-semibold text-foreground text-sm">{resumeRankerState.uploadedFile.name}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <FileUp className="h-8 w-8" />
                                    <span className="font-semibold text-foreground">Drag & drop or click</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="job-role">2. Target Job Role</Label>
                        <Input id="job-role" placeholder="e.g., Senior Frontend Developer" value={resumeRankerState.jobRole} onChange={e => setResumeRankerState({ jobRole: e.target.value })} />
                    </div>
                     <div>
                        <Label htmlFor="field">3. Field / Industry</Label>
                        <Input id="field" placeholder="e.g., FinTech" value={resumeRankerState.field} onChange={e => setResumeRankerState({ field: e.target.value })} />
                    </div>
                    <div className="pt-2">
                        <h3 className="text-sm font-medium mb-2">4. Choose Action</h3>
                        <h3 className="text-sm font-medium mb-2">4. Choose Action</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <Button onClick={handleAnalyze} disabled={isAnalyzing || isRoasting || !resumeRankerState.pdfBase64}>
                                {isAnalyzing && <Loader2 className="animate-spin" />}
                                Rank Resume
                            </Button>
                            <Button onClick={handleRoast} disabled={isAnalyzing || isRoasting || !resumeRankerState.pdfBase64} variant="outline">
                                {isRoasting && <Loader2 className="animate-spin" />}
                                Roast Resume
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
        
        <div className="lg:col-span-2 relative">
            <AnimatePresence>
                {(isAnalyzing || isRoasting) && (
                    <motion.div 
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="font-semibold text-lg">{isAnalyzing ? 'Ranking Your Resume...' : 'Roasting Your Resume...'}</p>
                        <p className="text-sm text-muted-foreground">The AI is hard at work. This may take a moment.</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {showResults ? (
                    <motion.div
                        key="results-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="rank" disabled={!rankingResult}>Rank Results</TabsTrigger>
                                <TabsTrigger value="roast" disabled={!roastResult}>Roast Results</TabsTrigger>
                            </TabsList>
                            <TabsContent value="rank">
                                {rankingResult ? <RankingResults /> : <Placeholder />}
                            </TabsContent>
                            <TabsContent value="roast">
                                {roastResult ? <RoastResults /> : <Placeholder />}
                            </TabsContent>
                        </Tabs>
                    </motion.div>
                ) : showPreview ? (
                    <MemoizedResumePreview url={resumeRankerState.pdfPreviewUrl} fileName={resumeRankerState.uploadedFile?.name} />
                ) : (
                    <motion.div key="placeholder-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Placeholder />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}