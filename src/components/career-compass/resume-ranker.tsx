// src/components/career-compass/resume-ranker.tsx

'use client';
import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileUp, CheckCircle, Lightbulb, ThumbsUp, ThumbsDown, Sparkles, Flame } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/contexts/app-context';
import { evaluationService } from '@/lib/services';
import { rankResumeFlow, RankResumeOutput } from '@/ai/flows/rank-resume';
import { roastResumeFlow, RoastResumeOutput } from '@/ai/flows/roast-resume';
import CircularProgress from './circular-progress';
// --- MODIFICATION START ---
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FIELDS_OF_INTEREST, findFieldDetails } from '@/lib/fields-of-interest';
// --- MODIFICATION END ---

export default function ResumeRanker() {
  const { toast } = useToast();
  const { user, refreshEvaluations } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');
  const [jobRole, setJobRole] = useState('Software Engineer');
  
  // --- MODIFICATION START ---
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof FIELDS_OF_INTEREST>('Software Engineering');
  const [selectedField, setSelectedField] = useState<string | null>(null);
  // --- MODIFICATION END ---

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRoasting, setIsRoasting] = useState(false);
  const [rankingResult, setRankingResult] = useState<RankResumeOutput | null>(null);
  const [roastResult, setRoastResult] = useState<RoastResumeOutput | null>(null);
  const [activeTab, setActiveTab] = useState('rank');

  useEffect(() => {
    if (user?.fieldOfInterest) {
        const details = findFieldDetails(user.fieldOfInterest);
        if (details) {
            setSelectedCategory(details.category as keyof typeof FIELDS_OF_INTEREST);
            setSelectedField(details.field);
        }
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  // --- MODIFICATION START ---
  const handleCategoryChange = (newCategoryKey: string) => {
    const newCategory = newCategoryKey as keyof typeof FIELDS_OF_INTEREST;
    setSelectedCategory(newCategory);
    setSelectedField(null);
  };
  // --- MODIFICATION END ---

  const processFile = async (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
        toast({ variant: 'destructive', title: "Invalid File Type", description: "Please upload a PDF file." });
        return;
    }

    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    setPdfPreviewUrl(previewUrl);

    setUploadedFile(file);
    setRankingResult(null);
    setRoastResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        setPdfBase64(base64);
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
    // --- MODIFICATION START ---
    const field = selectedField || selectedCategory;
    if (!pdfBase64 || !jobRole || !field) {
        toast({ variant: 'destructive', title: "Missing Information", description: "Please upload a resume, fill out the job role, and select a category." });
        return;
    }
    // --- MODIFICATION END ---
    if (!user) {
        toast({ variant: 'destructive', title: "Authentication Error", description: "You must be logged in to rank a resume." });
        return;
    }
    setPdfPreviewUrl('');
    setIsAnalyzing(true);
    setRankingResult(null);
    try {
        const result = await rankResumeFlow({ pdfBase64, jobRole, field });
        setRankingResult(result);
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
    // --- MODIFICATION START ---
    const field = selectedField || selectedCategory;
    if (!pdfBase64 || !jobRole || !field) {
        toast({ variant: 'destructive', title: "Missing Information", description: "Please upload a resume, fill out the job role, and select a category." });
        return;
    }
    // --- MODIFICATION END ---
    if (!user) {
        toast({ variant: 'destructive', title: "Authentication Error", description: "You must be logged in to roast a resume." });
        return;
    }
    setPdfPreviewUrl('');
    setIsRoasting(true);
    setRoastResult(null);
    try {
        const result = await roastResumeFlow({ pdfBase64, jobRole, field });
        setRoastResult(result);
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

  const ResumePreview = () => (
    <motion.div
        key="resume-preview"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
    >
        <Card className="h-[75vh]">
            <CardHeader>
                <CardTitle className="font-headline">Resume Preview</CardTitle>
                <CardDescription>{uploadedFile?.name}</CardDescription>
            </CardHeader>
            <CardContent className="h-[calc(100%-78px)]">
                <iframe
                    src={pdfPreviewUrl}
                    className="w-full h-full rounded-md border"
                    title="Resume Preview"
                />
            </CardContent>
        </Card>
    </motion.div>
  );

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
    </motion.div>
  );
  
  const Placeholder = ({ action }: { action: string }) => (
    <motion.div variants={itemVariants} className="flex items-center justify-center h-full">
        <Card className="w-full text-center p-12">
            <CardHeader>
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
                <CardTitle className="font-headline mt-4">Awaiting Your Resume</CardTitle>
                <CardDescription>Upload your resume, provide details, and click "{action}" to get started.</CardDescription>
            </CardHeader>
        </Card>
    </motion.div>
  );

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
                            {uploadedFile ? (
                                <div className="flex flex-col items-center gap-2 text-green-500">
                                    <CheckCircle className="h-8 w-8" />
                                    <span className="font-semibold text-foreground text-sm">{uploadedFile.name}</span>
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
                        <Input id="job-role" placeholder="e.g., Senior Frontend Developer" value={jobRole} onChange={e => setJobRole(e.target.value)} />
                    </div>
                    {/* --- MODIFICATION START --- */}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <Label>3. Field / Industry</Label>
                            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                <SelectContent>{Object.keys(FIELDS_OF_INTEREST).map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>4. Specialization (Optional)</Label>
                            <Select value={selectedField || ''} onValueChange={setSelectedField}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a specialization" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FIELDS_OF_INTEREST[selectedCategory]?.subFields.map((field) => (
                                        <SelectItem key={field} value={field}>{field}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {/* --- MODIFICATION END --- */}
                    <div className="pt-2">
                        <h3 className="text-sm font-medium mb-2">5. Choose Action</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <Button onClick={handleAnalyze} disabled={isAnalyzing || !pdfBase64}>
                                {isAnalyzing ? 'Analyzing...' : 'Rank Resume'}
                            </Button>
                            <Button onClick={handleRoast} disabled={isRoasting || !pdfBase64} variant="outline">
                                {isRoasting ? 'Roasting...' : 'Roast Resume'}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
        
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {pdfPreviewUrl ? (
              <ResumePreview />
            ) : (
              <motion.div
                key="results-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="rank">Rank Results</TabsTrigger>
                    <TabsTrigger value="roast">Roast Results</TabsTrigger>
                  </TabsList>
                  <TabsContent value="rank" className="space-y-6">
                    {isAnalyzing ? (
                      <div className="space-y-6">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
                    ) : rankingResult ? (
                      <RankingResults />
                    ) : (
                      <Placeholder action="Rank Resume" />
                    )}
                  </TabsContent>
                  <TabsContent value="roast" className="space-y-6">
                    {isRoasting ? (
                      <div className="space-y-6">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
                    ) : roastResult ? (
                      <RoastResults />
                    ) : (
                      <Placeholder action="Roast Resume" />
                    )}
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  );
}