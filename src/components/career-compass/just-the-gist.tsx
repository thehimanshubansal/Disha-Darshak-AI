
'use client';
import { useEffect, useState } from "react";
import { useAppContext } from "@/contexts/app-context";
import { extractSkillsFromResume } from "@/ai/flows/skill-extraction";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import CircularProgress from "./circular-progress";
import { Skeleton } from "../ui/skeleton";

export default function JustTheGist() {
    // Destructured handleNavigate from the context.
    const { user, resumeText, handleNavigate } = useAppContext();
    const [skills, setSkills] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSkills = async () => {
            if (resumeText) {
                try {
                    setLoading(true);
                    const result = await extractSkillsFromResume({ resumeText });
                    setSkills(result.skills.slice(0, 3)); // Show top 3 skills
                } catch (e) {
                    console.error("Failed to extract skills", e);
                    setSkills([]);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        fetchSkills();
    }, [resumeText]);

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
                                {loading ? (
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
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col items-center gap-2">
                            <CircularProgress progress={60} />
                            <span className="text-xs font-medium text-muted-foreground">Skill Readiness</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                             <CircularProgress progress={82} />
                            <span className="text-xs font-medium text-muted-foreground">Career Fit</span>
                        </div>
                    </div>
                    {/* Changed onClick to navigate to the 'profile' page. */}
                     <Button variant="outline" onClick={() => handleNavigate('profile')} className="ml-auto">View Profile</Button>
                </div>
            </CardContent>
        </Card>
    );
}
