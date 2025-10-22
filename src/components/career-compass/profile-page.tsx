'use client';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAppContext } from "@/contexts/app-context";
import { cn } from "@/lib/utils";
import { Edit, Save, X, CalendarIcon, Loader2, User as UserIcon, GraduationCap, Briefcase, Link as LinkIcon, BarChart2, FileText, Bot } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import CircularProgress from "./circular-progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";

// Zod schema for validation
const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").regex(/^[a-zA-Z\s]*$/, "Name can only contain letters."),
  email: z.string().email("Please enter a valid email address."),
  mobile: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits."),
  dob: z.date({ required_error: "Date of birth is required." }).max(new Date(), "Date of birth cannot be in the future."),
  gender: z.string().min(1, "Please select a gender."),
  age: z.coerce.number().min(1, "Age is required.").max(120, "Please enter a valid age."),
  city: z.string().min(2, "City is required."),
  state: z.string().min(2, "State is required."),
  country: z.string().min(2, "Country is required."),
  postalCode: z.string().regex(/^\d{5,6}$/, "Please enter a valid postal code."),
  skills: z.array(z.string()).min(1, "Please add at least one skill."),
  experience: z.string().optional(),
  college: z.string().min(2, "College name is required."),
  degree: z.string().min(2, "Degree is required."),
  gradYear: z.coerce.number().min(1950, "Invalid year.").max(new Date().getFullYear() + 5, "Invalid year."),
  linkedin: z.string().url({ message: "Please enter a valid URL (e.g., https://...)" }).optional().or(z.literal('')),
  github: z.string().url({ message: "Please enter a valid URL (e.g., https://...)" }).optional().or(z.literal('')),
  portfolio: z.string().url({ message: "Please enter a valid URL (e.g., https://...)" }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Helper component for multi-tag skill input
const SkillsInput = ({ field }: { field: any }) => {
    const [inputValue, setInputValue] = useState("");
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newSkill = inputValue.trim();
            if (newSkill && !field.value.includes(newSkill)) {
                field.onChange([...field.value, newSkill]);
            }
            setInputValue("");
        }
    };
    const removeSkill = (skillToRemove: string) => {
        field.onChange(field.value.filter((skill: string) => skill !== skillToRemove));
    };

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-2">
                {field.value.map((skill: string) => (
                    <div key={skill} className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)}><X className="h-3 w-3" /></button>
                    </div>
                ))}
            </div>
            <Input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a skill and press Enter"
            />
        </div>
    );
};

export default function ProfilePage() {
    const { user, handleProfileUpdate, isLoadingAuth, evaluations, handleNavigate } = useAppContext();
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            skills: [],
        },
    });

    useEffect(() => {
        if (user) {
            form.reset({
                name: user.name || '',
                email: user.email || '',
                mobile: user.mobile || '',
                dob: user.dob ? parseISO(user.dob) : undefined,
                gender: user.gender || '',
                age: user.age || undefined,
                city: user.city || '',
                state: user.state || '',
                country: user.country || '',
                postalCode: user.postalCode || '',
                skills: user.skills || [],
                experience: user.experience || '',
                college: user.college || '',
                degree: user.degree || '',
                gradYear: user.gradYear || undefined,
                linkedin: user.linkedin || '',
                github: user.github || '',
                portfolio: user.portfolio || '',
            });
        }
    }, [user, form]);

    const onSubmit = async (data: ProfileFormValues) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const profileData = {
                ...data,
                dob: format(data.dob, 'yyyy-MM-dd'),
            };
            await handleProfileUpdate({ uid: user.uid, ...profileData });
            setIsEditMode(false);
        } catch (error) {
            console.error("Failed to update profile", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const NoDataPlaceholder = ({ message, buttonText, targetRoute }: { message: string, buttonText: string, targetRoute: string }) => (
        <div className="text-center py-12">
            <h3 className="font-semibold">{message}</h3>
            <p className="text-sm text-muted-foreground mt-1">Complete an evaluation to see your insights here.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => handleNavigate(targetRoute)}>{buttonText}</Button>
        </div>
    );

    if (isLoadingAuth || !user) {
        return <Skeleton className="h-[500px] w-full" />;
    }

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <Card className="shadow-sm">
                        <div className="h-32 bg-muted rounded-t-xl" />
                        <CardContent className="p-4 md:p-6">
                            <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20">
                                <Avatar className="h-28 w-28 border-4 border-background"><AvatarImage src={user?.avatar || undefined} /><AvatarFallback className="text-4xl">{user?.name?.[0]}</AvatarFallback></Avatar>
                                <div className="flex-1 ml-4 mt-4 sm:mt-0"><h2 className="text-2xl font-bold font-headline">{user.name}</h2><p className="text-sm text-muted-foreground">{user.email}</p></div>
                                {!isEditMode ? (<Button variant="outline" onClick={() => setIsEditMode(true)}><Edit className="h-4 w-4 mr-2" /> Edit Profile</Button>) : (<div className="flex gap-2 mt-4 sm:mt-0"><Button variant="outline" type="button" onClick={() => { setIsEditMode(false); form.reset(); }}>Cancel</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button></div>)}
                            </div>
                            
                            <div className="mt-6 space-y-6">
                                {/* --- MODIFICATION START: RESTRUCTURED FORM --- */}
                                <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserIcon className="text-primary"/>Basic & Address Details</CardTitle></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} readOnly={!isEditMode} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} readOnly={!isEditMode} type="email" /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="mobile" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} readOnly={!isEditMode} type="tel" maxLength={10} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="dob" render={({ field }) => (<FormItem><FormLabel>Date of Birth</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={!isEditMode}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditMode}><FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="age" render={({ field }) => (<FormItem><FormLabel>Age</FormLabel><FormControl><Input {...field} readOnly={!isEditMode} type="number" /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} readOnly={!isEditMode} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="state" render={({ field }) => (<FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} readOnly={!isEditMode} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="country" render={({ field }) => (<FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} readOnly={!isEditMode} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="postalCode" render={({ field }) => (<FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input {...field} readOnly={!isEditMode} type="text" maxLength={6} /></FormControl><FormMessage /></FormItem>)} />
                                </CardContent></Card>
                                
                                <Card><CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="text-primary"/>Education</CardTitle></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="college" render={({ field }) => (<FormItem><FormLabel>College/University</FormLabel><FormControl><Input {...field} readOnly={!isEditMode} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="degree" render={({ field }) => (<FormItem><FormLabel>Degree</FormLabel><FormControl><Input {...field} readOnly={!isEditMode} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="gradYear" render={({ field }) => (<FormItem><FormLabel>Year of Graduation</FormLabel><FormControl><Input {...field} readOnly={!isEditMode} type="number" /></FormControl><FormMessage /></FormItem>)} />
                                </CardContent></Card>
                                
                                <Card><CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="text-primary"/>Professional Info</CardTitle></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField control={form.control} name="skills" render={({ field }) => (<FormItem><FormLabel>Skills</FormLabel><FormControl>{isEditMode ? <SkillsInput field={field} /> : <div className="flex flex-wrap gap-2">{field.value.map(skill => <div key={skill} className="bg-muted text-sm px-3 py-1 rounded">{skill}</div>)}</div>}</FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="experience" render={({ field }) => (<FormItem><FormLabel>Work Experience / Internships</FormLabel><FormControl><Textarea {...field} readOnly={!isEditMode} placeholder="Describe your roles and responsibilities..."/></FormControl><FormMessage /></FormItem>)} />
                                </CardContent></Card>
                                
                                <Card><CardHeader><CardTitle className="flex items-center gap-2"><LinkIcon className="text-primary"/>Social & Professional Links</CardTitle></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="linkedin" render={({ field }) => (<FormItem><FormLabel>LinkedIn</FormLabel><FormControl><Input {...field} readOnly={!isEditMode} placeholder="https://linkedin.com/in/..." /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="github" render={({ field }) => (<FormItem><FormLabel>GitHub</FormLabel><FormControl><Input {...field} readOnly={!isEditMode} placeholder="https://github.com/..." /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="portfolio" render={({ field }) => (<FormItem><FormLabel>Portfolio</FormLabel><FormControl><Input {...field} readOnly={!isEditMode} placeholder="https://..." /></FormControl><FormMessage /></FormItem>)} />
                                </CardContent></Card>
                                {/* --- END OF RESTRUCTURED FORM --- */}
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </Form>

            {/* --- CAREER INSIGHTS SECTION (UNCHANGED) --- */}
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
                        <TabsContent value="skills">
                             {evaluations?.skillAssessments.length ? (
                                <div className="mt-4 space-y-4">{evaluations.skillAssessments.slice(0, 1).map((assessment: any, index: number) => (<Card key={index} className="bg-muted/50"><CardHeader><CardTitle className="text-lg">Latest Career Roadmap: <span className="text-primary">{assessment.chosenRole}</span></CardTitle><CardDescription>Generated on {new Date(assessment.createdAt).toLocaleDateString()}</CardDescription></CardHeader><CardContent><p className="text-sm italic mb-4">"{assessment.roadmap.introduction}"</p><Accordion type="single" collapsible><AccordionItem value="item-1"><AccordionTrigger>View 3-Month Plan</AccordionTrigger><AccordionContent><h4 className="font-semibold">{assessment.roadmap.timeline_steps[0].duration}</h4><ul className="list-disc list-inside text-sm text-muted-foreground mt-1">{assessment.roadmap.timeline_steps[0].action_items.map((action: string) => <li key={action}>{action}</li>)}</ul></AccordionContent></AccordionItem></Accordion></CardContent></Card>))}</div>
                            ) : <NoDataPlaceholder message="No Career Roadmaps Found" buttonText="Generate Your Roadmap" targetRoute="path" />}
                        </TabsContent>
                        <TabsContent value="resume">
                             {evaluations?.resumeReviews.length ? (
                                <div className="mt-4 space-y-4">{evaluations.resumeReviews.slice(0, 1).map((review: any, index: number) => (<Card key={index} className="bg-muted/50"><CardHeader><CardTitle className="text-lg">Latest Resume Review for "{review.jobRole}"</CardTitle><CardDescription>Reviewed on {new Date(review.createdAt).toLocaleDateString()} &middot; Type: <span className="capitalize font-semibold">{review.type}</span></CardDescription></CardHeader><CardContent>{review.type === 'rank' ? (<div className="flex items-center gap-6"><CircularProgress progress={review.result.match_score} size={80} /><div><h4 className="font-semibold">Match Score: {review.result.match_score}%</h4><p className="text-sm text-muted-foreground">{review.result.final_recommendation}</p></div></div>) : (<blockquote className="border-l-2 pl-4 italic">"{review.result.roast_comments[0]}"</blockquote>)}</CardContent></Card>))}</div>
                            ) : <NoDataPlaceholder message="No Resume Reviews Found" buttonText="Go to TorchMyResume" targetRoute="ranker" />}
                        </TabsContent>
                        <TabsContent value="interviews">
                             {evaluations?.mockInterviews.length ? (
                                <div className="mt-4 space-y-4">{evaluations.mockInterviews.slice(0, 1).map((interview: any, index: number) => (<Card key={index} className="bg-muted/50"><CardHeader><CardTitle className="text-lg">Latest Mock Interview: "{interview.jobRole}"</CardTitle><CardDescription>Completed on {new Date(interview.createdAt).toLocaleDateString()} &middot; Difficulty: <span className="capitalize font-semibold">{interview.difficulty}</span></CardDescription></CardHeader><CardContent><Accordion type="single" collapsible><AccordionItem value="item-1"><AccordionTrigger>Show Final Evaluation</AccordionTrigger><AccordionContent><p className="font-semibold">Soft Skill Score: {interview.evaluation.FinalEvaluation.SoftSkillScore}</p><p className="text-sm mt-2">{interview.evaluation.FinalEvaluation.OverallFeedback}</p></AccordionContent></AccordionItem></Accordion></CardContent></Card>))}</div>
                            ) : <NoDataPlaceholder message="No Mock Interviews Found" buttonText="Start an Interview" targetRoute="mock" />}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}