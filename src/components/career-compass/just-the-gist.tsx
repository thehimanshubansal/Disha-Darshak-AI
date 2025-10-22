'use client';

import { useEffect, useState, useMemo } from "react";
import { useAppContext } from "@/contexts/app-context";
import { extractSkillsFromResume } from "@/ai/flows/skill-extraction";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import CircularProgress from "./circular-progress";
import { Skeleton } from "../ui/skeleton";

export default function JustTheGist() {
    const { user, resumeText, handleNavigate, evaluations } = useAppContext();
    const [skills, setSkills] = useState<string[]>([]);
    const [loadingSkills, setLoadingSkills] = useState(true);

    const profileCompletion = useMemo(() => {
        if (!user) return 0;
        
        const fields: (keyof typeof user)[] = [
            'name', 'mobile', 'dob', 'gender', 'age', 'city', 'state', 'country', 
            'postalCode', 'college', 'degree', 'gradYear', 'skills', 
            'experience', 'linkedin', 'github', 'portfolio'
        ];
        
        const completedCount = fields.reduce((acc, field) => {
            const value = user[field];
            if (Array.isArray(value)) {
                if (value.length > 0) return acc + 1;
            } else if (value) {
                return acc + 1;
            }
            return acc;
        }, 0);

        return Math.round((completedCount / fields.length) * 100);
    }, [user]);

    const { skillReadiness, careerFit } = useMemo(() => {
        // Define intelligent weights for each metric
        const weights = {
            skillReadiness: { resume: 0.4, technical: 0.6 },
            careerFit:      { resume: 0.25, technical: 0.25, soft: 0.5 }
        };

        if (!evaluations) return { skillReadiness: 10, careerFit: 15 };

        // 1. Extract the latest scores from evaluations
        let resumeScore: number | null = null;
        const rankReview = evaluations.resumeReviews.find(r => r.type === 'rank' && r.result?.match_score);
        if (rankReview) {
            resumeScore = rankReview.result.match_score;
        }

        let interviewTechnicalScore: number | null = null;
        let interviewSoftSkillScore: number | null = null;
        const latestInterview = evaluations.mockInterviews[0];
        if (latestInterview?.evaluation) {
            // Calculate average technical score from question performance
            const questionScores = latestInterview.evaluation.QuestionPairs?.map((pair: any) => {
                const [score, max] = pair.FinalScore.split('/').map(Number);
                return !isNaN(score) && max > 0 ? (score / max) * 100 : null;
            }).filter((s: number | null) => s !== null) as number[];
            
            if (questionScores.length > 0) {
                interviewTechnicalScore = questionScores.reduce((a, b) => a + b, 0) / questionScores.length;
            }

            // Calculate soft skill score
            const softScoreString = latestInterview.evaluation.FinalEvaluation?.SoftSkillScore;
            if (softScoreString) {
                const [score, max] = softScoreString.split('/').map(Number);
                if (!isNaN(score) && max > 0) {
                    interviewSoftSkillScore = (score / max) * 100;
                }
            }
        }

        // 2. Calculate Skill Readiness using a weighted average
        let srTotalScore = 0;
        let srTotalWeight = 0;
        if (resumeScore !== null) {
            srTotalScore += resumeScore * weights.skillReadiness.resume;
            srTotalWeight += weights.skillReadiness.resume;
        }
        if (interviewTechnicalScore !== null) {
            srTotalScore += interviewTechnicalScore * weights.skillReadiness.technical;
            srTotalWeight += weights.skillReadiness.technical;
        }
        const finalSkillReadiness = srTotalWeight > 0 ? Math.round(srTotalScore / srTotalWeight) : 10;
        
        // 3. Calculate Career Fit using a weighted average
        let cfTotalScore = 0;
        let cfTotalWeight = 0;
        if (resumeScore !== null) {
            cfTotalScore += resumeScore * weights.careerFit.resume;
            cfTotalWeight += weights.careerFit.resume;
        }
        if (interviewTechnicalScore !== null) {
            cfTotalScore += interviewTechnicalScore * weights.careerFit.technical;
            cfTotalWeight += weights.careerFit.technical;
        }
        if (interviewSoftSkillScore !== null) {
            cfTotalScore += interviewSoftSkillScore * weights.careerFit.soft;
            cfTotalWeight += weights.careerFit.soft;
        }
        const finalCareerFit = cfTotalWeight > 0 ? Math.round(cfTotalScore / cfTotalWeight) : 15;

        return { skillReadiness: finalSkillReadiness, careerFit: finalCareerFit };

    }, [evaluations]);

    useEffect(() => {
        const fetchSkills = async () => {
            setLoadingSkills(true);
            if (resumeText) {
                try {
                    const result = await extractSkillsFromResume({ resumeText });
                    setSkills(result.skills.slice(0, 3));
                } catch (e) {
                    console.error("Failed to extract skills", e);
                    setSkills([]);
                }
            } else if (user?.skills?.length) {
                setSkills(user.skills.slice(0, 3));
            } else {
                setSkills([]);
            }
            setLoadingSkills(false);
        };
        fetchSkills();
    }, [resumeText, user?.skills]);

    if (!user) return null;

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="font-headline">Just the Gist</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex-1 flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                                {user.name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="text-xl font-bold font-headline">{user.name}</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {loadingSkills ? (
                                    <>
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                        <Skeleton className="h-6 w-24 rounded-full" />
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </>
                                ) : (
                                    skills.map((skill, i) => <Badge key={i}>{skill}</Badge>)
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 md:gap-8">
                        <div className="flex flex-col items-center gap-2 text-center">
                            <CircularProgress progress={profileCompletion} />
                            <span className="text-xs font-medium text-muted-foreground">Profile Complete</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 text-center">
                            <CircularProgress progress={skillReadiness} />
                            <span className="text-xs font-medium text-muted-foreground">Skill Readiness</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 text-center">
                             <CircularProgress progress={careerFit} />
                            <span className="text-xs font-medium text-muted-foreground">Career Fit</span>
                        </div>
                    </div>
                     <Button variant="outline" onClick={() => handleNavigate('profile')} className="ml-auto">View Profile</Button>
                </div>
            </CardContent>
        </Card>
    );
}