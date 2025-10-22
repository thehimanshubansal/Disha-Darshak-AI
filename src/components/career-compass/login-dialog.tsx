'use client';
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserPlus, Upload, ArrowRight, Sparkles, HelpCircle, Lightbulb, Eye, EyeOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/app-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SkillAssessmentForm from './skill-assessment-form';

type View = 'login' | 'signup';
type SignUpView = 'form' | 'quiz' | 'quiz_results';

const signupQuestions = [
    { id: 'favoriteSubjects', question: 'Which subjects or topics do you enjoy the most?', type: 'mcq', options: ['Mathematics', 'Science', 'Technology', 'Literature', 'History', 'Arts', 'Business', 'Other'], required: true },
    { id: 'strongestSkills', question: 'What are your strongest skills?', type: 'mcq', options: ['Technical', 'Creative', 'Analytical', 'Communication', 'Leadership', 'Problem-solving', 'Other'], required: true },
    { id: 'careerMotivation', question: 'What motivates you the most in a career?', type: 'mcq', options: ['Money', 'Stability', 'Creativity', 'Impact', 'Leadership', 'Work-life Balance', 'Growth Opportunities'], required: true },
    { id: 'logicVsCreativity', statement: 'I see myself as more logical/analytical than creative/innovative.', type: 'likert', required: true },
    { id: 'industryPreference', question: 'Which industries are you most interested in?', type: 'mcq', options: ['Technology', 'Healthcare', 'Business', 'Education', 'Arts', 'Finance', 'Government', 'Other'], required: true },
];

export default function LoginDialog() {
  const { showLogin, setShowLogin, handleLogin, handleSignUp, loginView, setLoginView } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [signUpView, setSignUpView] = useState<SignUpView>('form');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [fieldOfInterest, setFieldOfInterest] = useState('');
  const [interestSuggestions, setInterestSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  // Independent state for password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const photoRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  
  const submitLogin = async () => {
    setLoading(true);
    try { await handleLogin(email, password); } 
    catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };
  
  const submitSignUp = async () => {
    if (currentStep !== 4 || !fieldOfInterest) {
        alert('Please complete all steps and select a field of interest.');
        return;
    }
    setLoading(true);
    try {
      await handleSignUp({
          firstName, 
          lastName, 
          email, 
          password, 
          mobile,
          age,
          gender,
          country,
          language,
          fieldOfInterest,
          avatar: avatarPreview
      });
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
        if (!firstName || !email || !password || !confirmPassword) {
            alert('Please fill all required personal information fields.');
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }
    }
    if (currentStep === 2) {
        if (!age || !gender || !country || !mobile) {
            alert('Please fill all required demographic fields.');
            return;
        }
        if (!/^\d{10}$/.test(mobile)) {
            alert('Please enter a valid 10-digit mobile number.');
            return;
        }
    }
    if (currentStep === 3 && !language) {
        alert('Please select a preferred language.');
        return;
    }
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
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
        if (data && data.roles && data.roles.length > 0) {
            setInterestSuggestions(data.roles);
        } else {
            setInterestSuggestions(['Data Science', 'Cloud Computing', 'UX/UI Design']);
        }
    } catch (e) {
      console.error("Failed to get suggestions:", e);
      setInterestSuggestions(['Data Science', 'Cloud Computing', 'UX/UI Design']);
    } finally {
      setIsSuggesting(false);
    }
  };

  const renderLogin = () => (
    <>
      <div className="flex items-center gap-3 mb-4">
        <User className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-headline font-semibold">Welcome Back</h2>
      </div>
      <p className="text-muted-foreground text-sm mb-4">Login to unlock your personalized career advisor.</p>
      <div className="space-y-3">
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        <div className="relative">
            <Input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
        <Button className="w-full" onClick={submitLogin} disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</Button>
        <Button variant="link" className="w-full text-xs" onClick={() => setLoginView('signup')}>Don't have an account? Sign Up</Button>
      </div>
    </>
  );

  const renderPanelOne = () => (
    <div className="space-y-4">
      <h3 className="font-semibold">Step 1: Personal Information</h3>
       <div className='flex items-center gap-4'>
          <Avatar className='h-16 w-16'><AvatarImage src={avatarPreview || undefined} alt="Avatar Preview" /><AvatarFallback className='text-xs'>Photo</AvatarFallback></Avatar>
          <Button variant="outline" onClick={() => photoRef.current?.click()} className="flex-1"><Upload className="h-4 w-4 mr-2" /> Upload Photo</Button>
          <input type="file" ref={photoRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
        </div>
        <div className="flex gap-3">
            <Input placeholder="First Name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <Input type="email" placeholder="Email Address *" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="relative">
            <Input type={showPassword ? "text" : "password"} placeholder="Create Password *" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
        <div className="relative">
            <Input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password *" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
        <div className="flex justify-end pt-2"><Button size="sm" onClick={handleNextStep}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
    </div>
  );
  
  const renderPanelTwo = () => (
    <div className="space-y-4">
      <h3 className="font-semibold">Step 2: Demographics</h3>
        <Input type="number" placeholder="Age *" value={age} onChange={(e) => setAge(e.target.value)} />
        <Select onValueChange={setGender} value={gender}>
            <SelectTrigger><SelectValue placeholder="Gender *" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
        </Select>
        <Select onValueChange={setCountry} value={country}>
            <SelectTrigger><SelectValue placeholder="Country *" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="india">India</SelectItem>
                <SelectItem value="usa">United States</SelectItem>
                <SelectItem value="uk">United Kingdom</SelectItem>
                <SelectItem value="canada">Canada</SelectItem>
                <SelectItem value="other">Other</SelectItem>
            </SelectContent>
        </Select>
        <Input type="tel" placeholder="Contact No (10 digits) *" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} maxLength={10} />
        <div className="flex justify-end pt-2"><Button size="sm" onClick={handleNextStep}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
    </div>
  );

  const renderPanelThree = () => (
    <div className="space-y-4">
      <h3 className="font-semibold">Step 3: Preferences</h3>
        <Select onValueChange={setLanguage} value={language}>
            <SelectTrigger><SelectValue placeholder="Preferred Language *" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="hindi">Hindi</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="french">French</SelectItem>
            </SelectContent>
        </Select>
        <div className="flex justify-end pt-2"><Button size="sm" onClick={handleNextStep}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
    </div>
  );

  const renderPanelFour = () => (
    <div className="space-y-4">
        <h3 className="font-semibold">Step 4: Field of Interest</h3>
        <div className="flex items-center gap-2 text-primary"><Sparkles className="h-5 w-5" /><p className="text-sm font-medium">What is your field of interest? *</p></div>
        <Input placeholder="e.g., Artificial Intelligence" value={fieldOfInterest} onChange={(e) => setFieldOfInterest(e.target.value)} />
        <div className="flex flex-wrap gap-2">{['Technology', 'Healthcare', 'Finance', 'Creative Arts'].map(role => (<Button key={role} variant={fieldOfInterest === role ? 'default' : 'outline'} size="sm" onClick={() => setFieldOfInterest(role)}>{role}</Button>))}</div>
        <div className="text-center pt-2"><Button variant="link" size="sm" onClick={() => setSignUpView('quiz')}><HelpCircle className="h-4 w-4 mr-2"/>Not sure? Take a quick quiz</Button></div>
    </div>
  );
  
  const renderQuizResults = () => (
    <div>
      <h3 className="font-semibold text-center">Choose Your Career Path</h3>
      <p className="text-sm text-muted-foreground text-center mb-4">Select the role that excites you most.</p>
      {isSuggesting ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground h-32"><Lightbulb className="h-4 w-4 animate-pulse" /><span>Generating...</span></div>
      ) : (
        <div className="flex flex-col gap-3 items-center">{interestSuggestions.map((role, idx) => (<Button key={idx} size="lg" variant={fieldOfInterest === role ? "default" : "outline"} onClick={() => setFieldOfInterest(role)} className="w-full">{role}</Button>))}</div>
      )}
      {fieldOfInterest && (<div className="flex justify-center mt-4"><Button onClick={() => setSignUpView("form")}>Continue with {fieldOfInterest}</Button></div>)}
    </div>
  );

  const renderSignUp = () => {
    if (signUpView === 'quiz') {
        return <SkillAssessmentForm questions={signupQuestions} onComplete={handleQuizComplete} />;
    }
    if (signUpView === 'quiz_results') {
        return renderQuizResults();
    }

    const progress = (currentStep / 4) * 100;
    return (
        <>
            <div className="flex items-center gap-3 mb-4"><UserPlus className="h-5 w-5 text-primary" /><h2 className="text-lg font-headline font-semibold">Create Account</h2></div>
            <Progress value={progress} className="mb-4 h-2" />
            <AnimatePresence mode="wait">
                <motion.div key={currentStep} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                    {currentStep === 1 && renderPanelOne()}
                    {currentStep === 2 && renderPanelTwo()}
                    {currentStep === 3 && renderPanelThree()}
                    {currentStep === 4 && renderPanelFour()}
                </motion.div>
            </AnimatePresence>
            <div className="mt-4 space-y-2">
                {currentStep === 4 && (<Button className="w-full" onClick={submitSignUp} disabled={loading || !fieldOfInterest}>{loading ? 'Creating Account…' : 'Sign Up'}</Button>)}
                <Button variant="link" className="w-full text-xs" onClick={() => setLoginView('login')}>Already have an account? Login</Button>
            </div>
        </>
    );
  };

  if (!showLogin) return null;

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div key={loginView + signUpView} initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.95 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="relative z-10 w-[90%] max-w-md rounded-xl border bg-background p-6 shadow-xl">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8 rounded-full"
          onClick={() => setShowLogin(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
        {loginView === 'login' ? renderLogin() : renderSignUp()}
      </motion.div>
    </motion.div>
  );
}