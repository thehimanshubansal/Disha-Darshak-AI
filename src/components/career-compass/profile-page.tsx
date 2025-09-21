// src/components/career-compass/profile-page.tsx

'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/app-context";
import { Mail, Phone, Edit, Briefcase, GraduationCap, Bot, FileText, BarChart2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import CircularProgress from "./circular-progress";
import { Skeleton } from "../ui/skeleton";

export default function ProfilePage() {
    const { user, setShowEditProfile, evaluations, isLoadingAuth, handleNavigate } = useAppContext();

    // --- MODIFICATION START ---
    // Prepare the latest scores for display
    const latestScores = evaluations?.skillAssessments[0]?.scores;
    const keyScores = ['analytical', 'creative', 'teamwork', 'independent', 'stability'];
    // --- MODIFICATION END ---

    const NoDataPlaceholder = ({ message, buttonText, targetRoute }: { message: string, buttonText: string, targetRoute: string }) => (
        <div className="text-center py-12">
            <h3 className="font-semibold">{message}</h3>
            <p className="text-sm text-muted-foreground mt-1">Complete an evaluation to see your insights here.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => handleNavigate(targetRoute)}>
                {buttonText}
            </Button>
        </div>
    );

    if (isLoadingAuth || !user) {
        return (
             <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
             </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="shadow-sm">
                <div className="h-32 bg-muted rounded-t-xl" />
                <CardContent className="p-6">
                    <div className="flex items-end -mt-16">
                        <Avatar className="h-28 w-28 border-4 border-background">
                            <AvatarImage src={user?.avatar || undefined} />
                            <AvatarFallback className="text-4xl">{user?.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <Button variant="outline" className="ml-auto" onClick={() => setShowEditProfile(true)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit Profile
                        </Button>
                    </div>
                    <div className="mt-4">
                        <h2 className="text-2xl font-bold font-headline">{user.name}</h2>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" /> {user.email}
                            </div>
                            {user.mobile && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" /> {user.mobile}
                                </div>
                            )}
                        </div>
                        <div className="mt-4 pt-4 border-t">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <Card className="bg-muted/50 p-4">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2 mb-1">
                                        <Briefcase className="h-4 w-4 text-primary" />
                                        Field of Interest
                                    </CardTitle>
                                    <CardDescription>{user.fieldOfInterest || 'Not specified'}</CardDescription>
                                </Card>
                                <Card className="bg-muted/50 p-4">
                                     <CardTitle className="text-sm font-semibold flex items-center gap-2 mb-1">
                                        <GraduationCap className="h-4 w-4 text-primary" />
                                        Education
                                    </CardTitle>
                                    <CardDescription>{user.education || 'Not specified'}</CardDescription>
                                </Card>
                            </div>
                        </div>

                        {/* --- MODIFICATION START --- */}
                        {/* New section to display key scores, which also increases card height. */}
                        {latestScores && (
                            <div className="mt-4 pt-4 border-t">
                                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Core Strengths Analysis</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                    {keyScores.map(key => {
                                        const scoreValue = latestScores[key];
                                        if (scoreValue === undefined) return null;

                                        return (
                                            <Card key={key} className="p-3 bg-muted/50 text-center">
                                                <CardTitle className="text-xl">
                                                    {typeof scoreValue === 'number' ? scoreValue.toFixed(1) : scoreValue}
                                                    <span className="text-muted-foreground text-sm">/5</span>
                                                </CardTitle>
                                                <CardDescription className="text-xs capitalize mt-1">{key}</CardDescription>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        {/* --- MODIFICATION END --- */}
                        
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Career & Skill Insights</CardTitle>
                    <CardDescription>A summary of your completed assessments and interviews.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="skills">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="skills"><BarChart2 className="h-4 w-4 mr-2" />Skill Assessments</TabsTrigger>
                            <TabsTrigger value="resume"><FileText className="h-4 w-4 mr-2" />Resume Reviews</TabsTrigger>
                            <TabsTrigger value="interviews"><Bot className="h-4 w-4 mr-2" />Mock Interviews</TabsTrigger>
                        </TabsList>
                        
                        {/* ... (The TabsContent section remains unchanged from the previous version) ... */}
                        <TabsContent value="skills">
                            {evaluations?.skillAssessments.length ? (
                                <div className="mt-4 space-y-4">
                                    {evaluations.skillAssessments.slice(0, 1).map((assessment: any, index: number) => (
                                        <Card key={index} className="bg-muted/50">
                                            <CardHeader>
                                                <CardTitle className="text-lg">Latest Career Roadmap: <span className="text-primary">{assessment.chosenRole}</span></CardTitle>
                                                <CardDescription>Generated on {new Date(assessment.createdAt).toLocaleDateString()}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm italic mb-4">"{assessment.roadmap.introduction}"</p>
                                                <Accordion type="single" collapsible>
                                                    <AccordionItem value="item-1">
                                                        <AccordionTrigger>View 3-Month Plan</AccordionTrigger>
                                                        <AccordionContent>
                                                            <h4 className="font-semibold">{assessment.roadmap.timeline_steps[0].duration}</h4>
                                                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                                                                {assessment.roadmap.timeline_steps[0].action_items.map((action: string) => <li key={action}>{action}</li>)}
                                                            </ul>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : <NoDataPlaceholder message="No Career Roadmaps Found" buttonText="Generate Your Roadmap" targetRoute="path" />}
                        </TabsContent>
                        {/* Other TabsContent sections remain the same */}
                         <TabsContent value="resume">
                             {evaluations?.resumeReviews.length ? (
                                <div className="mt-4 space-y-4">
                                    {evaluations.resumeReviews.slice(0, 1).map((review: any, index: number) => (
                                        <Card key={index} className="bg-muted/50">
                                            <CardHeader>
                                                <CardTitle className="text-lg">Latest Resume Review for "{review.jobRole}"</CardTitle>
                                                <CardDescription>
                                                    Reviewed on {new Date(review.createdAt).toLocaleDateString()} &middot; 
                                                    Type: <span className="capitalize font-semibold">{review.type}</span>
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                {review.type === 'rank' && (
                                                    <div className="flex items-center gap-6">
                                                        <CircularProgress progress={review.result.match_score} size={80} />
                                                        <div>
                                                            <h4 className="font-semibold">Match Score: {review.result.match_score}%</h4>
                                                            <p className="text-sm text-muted-foreground">{review.result.final_recommendation}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {review.type === 'roast' && (
                                                    <blockquote className="border-l-2 pl-4 italic">
                                                        "{review.result.roast_comments[0]}"
                                                    </blockquote>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : <NoDataPlaceholder message="No Resume Reviews Found" buttonText="Go to TorchMyResume" targetRoute="ranker" />}
                        </TabsContent>
                        <TabsContent value="interviews">
                             {evaluations?.mockInterviews.length ? (
                                <div className="mt-4 space-y-4">
                                    {evaluations.mockInterviews.slice(0, 1).map((interview: any, index: number) => (
                                        <Card key={index} className="bg-muted/50">
                                            <CardHeader>
                                                <CardTitle className="text-lg">Latest Mock Interview: "{interview.jobRole}"</CardTitle>
                                                <CardDescription>
                                                    Completed on {new Date(interview.createdAt).toLocaleDateString()} &middot;
                                                    Difficulty: <span className="capitalize font-semibold">{interview.difficulty}</span>
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <Accordion type="single" collapsible>
                                                    <AccordionItem value="item-1">
                                                        <AccordionTrigger>Show Final Evaluation</AccordionTrigger>
                                                        <AccordionContent>
                                                            <p className="font-semibold">Soft Skill Score: {interview.evaluation.FinalEvaluation.SoftSkillScore}</p>
                                                            <p className="text-sm mt-2">{interview.evaluation.FinalEvaluation.OverallFeedback}</p>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : <NoDataPlaceholder message="No Mock Interviews Found" buttonText="Start an Interview" targetRoute="mock" />}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}