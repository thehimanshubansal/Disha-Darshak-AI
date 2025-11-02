'use client';
import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Upload, ArrowRight, Sparkles, HelpCircle, Loader2, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext, SignupFormState } from '@/contexts/app-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SkillAssessmentForm from './skill-assessment-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

type SignUpView = 'form' | 'quiz' | 'quiz_results';

const signupQuestions = [
    { id: 'favoriteSubjects', question: 'Which subjects or topics do you enjoy the most?', type: 'mcq', options: ['Mathematics', 'Science', 'Technology', 'Literature', 'History', 'Arts', 'Business', 'Other'], required: true },
    { id: 'strongestSkills', question: 'What are your strongest skills?', type: 'mcq', options: ['Technical', 'Creative', 'Analytical', 'Communication', 'Leadership', 'Problem-solving', 'Other'], required: true },
    { id: 'careerMotivation', question: 'What motivates you the most in a career?', type: 'mcq', options: ['Money', 'Stability', 'Creativity', 'Impact', 'Leadership', 'Work-life Balance', 'Growth Opportunities'], required: true },
    { id: 'logicVsCreativity', statement: 'I see myself as more logical/analytical than creative/innovative.', type: 'likert', required: true },
    { id: 'industryPreference', question: 'Which industries are you most interested in?', type: 'mcq', options: ['Technology', 'Healthcare', 'Business', 'Education', 'Arts', 'Finance', 'Government', 'Other'], required: true },
];

const panelOneSchema = z.object({
  firstName: z.string().min(2, "First name is required."),
  lastName: z.string().optional(),
  email: z.string().email("Please enter a valid email."),
});

const panelTwoSchema = z.object({
  age: z.string().regex(/^\d+$/, "Please enter a valid age.").min(1, "Age is required."),
  gender: z.string().min(1, "Please select a gender."),
  country: z.string().min(1, "Please select a country."),
  mobile: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit mobile number."),
});

const panelThreeSchema = z.object({
  language: z.string().min(1, "Please select a language."),
});

const panelFourSchema = z.object({
  fieldOfInterest: z.string().min(3, "Please specify your field of interest."),
});

const fullCompletionSchema = z.object({
    ...panelOneSchema.shape,
    ...panelTwoSchema.shape,
    ...panelThreeSchema.shape,
    ...panelFourSchema.shape,
});

type ProfileCompletionFormValues = z.infer<typeof fullCompletionSchema>;


export default function ProfileCompletionDialog() {
  const { user, handleProfileUpdate, signupFormState, setSignupFormState, handleCancelSignUp } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [signUpView, setSignUpView] = useState<SignUpView>('form');
  const [interestSuggestions, setInterestSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<ProfileCompletionFormValues>({
    resolver: zodResolver(fullCompletionSchema),
    defaultValues: {
        firstName: signupFormState.firstName || '',
        lastName: signupFormState.lastName || '',
        email: signupFormState.email || '',
        age: signupFormState.age || '',
        gender: signupFormState.gender || '',
        country: signupFormState.country || '',
        mobile: signupFormState.mobile || '',
        language: signupFormState.language || '',
        fieldOfInterest: signupFormState.fieldOfInterest || '',
    },
  });

  useEffect(() => {
    form.reset({
        firstName: signupFormState.firstName || user?.name?.split(' ')[0] || '',
        lastName: signupFormState.lastName || user?.name?.split(' ').slice(1).join(' ') || '',
        email: signupFormState.email || user?.email || '',
        age: signupFormState.age || '',
        gender: signupFormState.gender || '',
        country: signupFormState.country || '',
        mobile: signupFormState.mobile || '',
        language: signupFormState.language || '',
        fieldOfInterest: signupFormState.fieldOfInterest || '',
    });
  }, [signupFormState, user, form]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => setSignupFormState(prev => ({ ...prev, avatar: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };
  
  const onFinalSubmit = form.handleSubmit(async (data) => {
    if (!user) {
        alert('Authentication error. Please try again.');
        return;
    }
    setLoading(true);
    try {
      await handleProfileUpdate({
          uid: user.uid,
          name: `${data.firstName} ${data.lastName || ''}`.trim(), 
          mobile: data.mobile,
          age: data.age ? parseInt(data.age, 10) : undefined,
          gender: data.gender,
          country: data.country,
          language: data.language,
          fieldOfInterest: data.fieldOfInterest,
          avatar: signupFormState.avatar,
          profileCompleted: true,
      });
    } catch (error) { 
      console.error(error); 
      alert('Failed to save profile. Please try again.');
      setLoading(false);
    } 
  });

  const handleNextStep = async () => {
    const currentStep = signupFormState.currentStep || 1;
    let fieldsToValidate: (keyof ProfileCompletionFormValues)[] = [];
    if (currentStep === 1) fieldsToValidate = ['firstName', 'email'];
    else if (currentStep === 2) fieldsToValidate = ['age', 'gender', 'country', 'mobile'];
    else if (currentStep === 3) fieldsToValidate = ['language'];
    else if (currentStep === 4) fieldsToValidate = ['fieldOfInterest'];

    const result = await form.trigger(fieldsToValidate);
    if (result) {
        const values = form.getValues();
        setSignupFormState(prev => ({ ...prev, ...values, currentStep: (prev.currentStep || 1) + 1 }));
    }
  };

  const handleBackStep = () => {
    const values = form.getValues();
    setSignupFormState(prev => ({ ...prev, ...values, currentStep: (prev.currentStep || 2) - 1 }));
  };

  const handleQuizComplete = async (answers: any) => {
    setIsSuggesting(true);
    setSignUpView('quiz_results');
    try {
        const res = await fetch('/api/path-finder-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        });
        const data = await res.json();
        setInterestSuggestions(data.roles || ['Data Science', 'Cloud Computing']);
    } catch (e) {
      console.error("Failed to get suggestions:", e);
      setInterestSuggestions(['Data Science', 'Cloud Computing', 'UX/UI Design']);
    } finally {
      setIsSuggesting(false);
    }
  };

  const renderPanelOne = () => (
    <div className="space-y-4">
      <h3 className="font-semibold">Step 1: Personal Information</h3>
       <div className='flex items-center gap-4'>
          <Avatar className='h-16 w-16'><AvatarImage src={signupFormState.avatar || user?.avatar || undefined} alt="Avatar Preview" /><AvatarFallback className='text-xs'>{signupFormState.firstName?.[0]}</AvatarFallback></Avatar>
          <Button variant="outline" type="button" onClick={() => photoRef.current?.click()} className="flex-1"><Upload className="h-4 w-4 mr-2" /> Upload Photo</Button>
          <input type="file" ref={photoRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
        </div>
        <div className="flex gap-3">
            <FormField control={form.control} name="firstName" render={({ field }) => <FormItem><FormControl><Input placeholder="First Name *" {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="lastName" render={({ field }) => <FormItem><FormControl><Input placeholder="Last Name" {...field} /></FormControl><FormMessage /></FormItem>} />
        </div>
        <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormControl><Input type="email" placeholder="Email Address" {...field} readOnly disabled /></FormControl><FormMessage /></FormItem>} />
    </div>
  );
  
  const renderPanelTwo = () => (
    <div className="space-y-4">
      <h3 className="font-semibold">Step 2: Demographics</h3>
      <FormField control={form.control} name="age" render={({ field }) => <FormItem><FormControl><Input type="number" placeholder="Age *" {...field} /></FormControl><FormMessage /></FormItem>} />
      <FormField control={form.control} name="gender" render={({ field }) => <FormItem><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Gender *" /></SelectTrigger></FormControl><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
      <FormField control={form.control} name="country" render={({ field }) => <FormItem><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Country *" /></SelectTrigger></FormControl><SelectContent><SelectItem value="india">India</SelectItem><SelectItem value="usa">United States</SelectItem><SelectItem value="uk">United Kingdom</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
      <FormField control={form.control} name="mobile" render={({ field }) => <FormItem><FormControl><Input type="tel" placeholder="Contact No (10 digits) *" {...field} maxLength={10} /></FormControl><FormMessage /></FormItem>} />
    </div>
  );

  const renderPanelThree = () => (
    <div className="space-y-4">
      <h3 className="font-semibold">Step 3: Preferences</h3>
      <FormField control={form.control} name="language" render={({ field }) => <FormItem><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Preferred Language *" /></SelectTrigger></FormControl><SelectContent><SelectItem value="english">English</SelectItem><SelectItem value="hindi">Hindi</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />
    </div>
  );

  const renderPanelFour = () => (
    <div className="space-y-4">
        <h3 className="font-semibold">Step 4: Field of Interest</h3>
        <div className="flex items-center gap-2 text-primary"><Sparkles className="h-5 w-5" /><p className="text-sm font-medium">What is your primary field of interest? *</p></div>
        <FormField control={form.control} name="fieldOfInterest" render={({ field }) => <FormItem><FormControl><Input placeholder="e.g., Artificial Intelligence" {...field} /></FormControl><FormMessage /></FormItem>} />
        <div className="flex flex-wrap gap-2">{['Technology', 'Healthcare', 'Finance', 'Creative Arts'].map(role => (<Button key={role} type="button" variant={form.getValues("fieldOfInterest") === role ? 'default' : 'outline'} size="sm" onClick={() => form.setValue("fieldOfInterest", role, { shouldValidate: true })}>{role}</Button>))}</div>
        <div className="text-center pt-2"><Button variant="link" size="sm" type="button" onClick={() => setSignUpView('quiz')}><HelpCircle className="h-4 w-4 mr-2"/>Not sure? Take a quick quiz</Button></div>
    </div>
  );
  
  const renderQuizResults = () => {
    const field = form.getValues("fieldOfInterest");
    return(
    <div>
      <h3 className="font-semibold text-center">Choose Your Career Path</h3>
      <p className="text-sm text-muted-foreground text-center mb-4">Select the role that excites you most.</p>
      {isSuggesting ? <div className='text-center'><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div> : (
        <div className="flex flex-col gap-3 items-center">{interestSuggestions.map((role, idx) => (<Button key={idx} type="button" size="lg" variant={field === role ? "default" : "outline"} onClick={() => form.setValue("fieldOfInterest", role)} className="w-full">{role}</Button>))}</div>
      )}
      {field && (<div className="flex justify-center mt-4"><Button type="button" onClick={() => setSignUpView("form")}>Continue with {field}</Button></div>)}
    </div>
  )};

  const renderForm = () => {
    if (signUpView === 'quiz') {
        return <SkillAssessmentForm questions={signupQuestions} onComplete={handleQuizComplete} />;
    }
    if (signUpView === 'quiz_results') {
        return renderQuizResults();
    }
    const currentStep = signupFormState.currentStep || 1;
    const progress = (currentStep / 4) * 100;
    return (
        <Form {...form}>
            <form onSubmit={onFinalSubmit}>
                <div className="flex items-center gap-3 mb-4"><UserPlus className="h-5 w-5 text-primary" /><h2 className="text-lg font-headline font-semibold">Complete Your Profile</h2></div>
                <p className="text-sm text-muted-foreground mb-4">Welcome! Just a few more details to get you started.</p>
                <Progress value={progress} className="mb-4 h-2" />
                <AnimatePresence mode="wait">
                    <motion.div key={currentStep} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                        {currentStep === 1 && renderPanelOne()}
                        {currentStep === 2 && renderPanelTwo()}
                        {currentStep === 3 && renderPanelThree()}
                        {currentStep === 4 && renderPanelFour()}
                    </motion.div>
                </AnimatePresence>
                <div className="mt-6 flex items-center justify-between">
                    <div>
                        {currentStep > 1 && (
                            <Button variant="ghost" type="button" onClick={handleBackStep} disabled={loading}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                        )}
                    </div>
                    <div>
                        {currentStep < 4 ? (
                            <Button size="sm" type="button" onClick={handleNextStep} disabled={loading}>
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Finish Setup
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </Form>
    );
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
    >
      <motion.div 
        key={signUpView} 
        initial={{ y: 20, opacity: 0, scale: 0.95 }} 
        animate={{ y: 0, opacity: 1, scale: 1 }} 
        exit={{ y: 20, opacity: 0, scale: 0.95 }} 
        transition={{ duration: 0.2, ease: 'easeOut' }} 
        className="relative z-10 w-[90%] max-w-md rounded-xl border bg-background p-6 shadow-xl"
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-4 h-8 w-8 rounded-full" 
          onClick={() => handleCancelSignUp()}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cancel and Close</span>
        </Button>
        {renderForm()}
      </motion.div>
    </motion.div>
  );
}