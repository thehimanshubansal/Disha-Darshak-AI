// src/components/career-compass/login-dialog.tsx

'use client';
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserPlus, Upload, ArrowRight, Sparkles, HelpCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/app-context';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import SkillAssessmentForm from './skill-assessment-form';
import { FIELDS_OF_INTEREST } from '@/lib/fields-of-interest';

type View = 'login' | 'signup';
type SignUpView = 'form' | 'quiz' | 'quiz_results';

// A shorter, more focused set of questions for the sign-up process
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
  
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('password');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');

  const [currentStep, setCurrentStep] = useState(1);
  const [signUpView, setSignUpView] = useState<SignUpView>('form');
  
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof FIELDS_OF_INTEREST>('Software Engineering');
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [interestSuggestions, setInterestSuggestions] = useState<string[]>([]);
  
  const [isSuggesting, setIsSuggesting] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const submitLogin = async () => {
    setLoading(true);
    try {
      await handleLogin(email, password);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const submitSignUp = async () => {
    const fieldOfInterest = selectedField || selectedCategory;
    if (!fieldOfInterest) {
        alert('Please choose a category of interest to complete your profile.');
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
          education: '',
          fieldOfInterest: fieldOfInterest,
          currentJobRole: '',
          avatar: avatarPreview
      });
    } catch (error)      {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && (!firstName || !lastName || !mobile || !email || !password)) {
        alert('Please fill all required fields.');
        return;
    }
    if (currentStep < 2) {
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
        if (data && data.fields && data.fields.length > 0) {
            setInterestSuggestions(data.fields);
        } else {
            // Fallback suggestions
            setInterestSuggestions(['Software Engineering', 'Data & AI', 'Product & Design']);
        }
    } catch (e) {
      console.error("Failed to get suggestions, showing demo data.", e);
      setInterestSuggestions(['Software Engineering', 'Data & AI', 'Product & Design']);
    } finally {
      setIsSuggesting(false);
    }
  };
  
  const handleCategoryChange = (newCategoryKey: string) => {
    const newCategory = newCategoryKey as keyof typeof FIELDS_OF_INTEREST;
    setSelectedCategory(newCategory);
    setSelectedField(null); // Reset field when category changes
  };

  const renderLogin = () => (
    <>
      <div className="flex items-center gap-3 mb-4">
        <User className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-headline font-semibold">Welcome Back</h2>
      </div>
      <p className="text-muted-foreground text-sm mb-4">Login to unlock your personalized career advisor.</p>
      <div className="space-y-3">
        <Input placeholder="Email (e.g., demo@example.com)" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Password (any)" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button className="w-full" onClick={submitLogin} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign In'}
        </Button>
        <Button variant="link" className="w-full text-xs" onClick={() => setLoginView('signup')}>
          Don't have an account? Sign Up
        </Button>
      </div>
    </>
  );

  const renderPanelOne = () => (
    <div className="space-y-4">
      <h3 className="font-semibold">Step 1: Account Details</h3>
       <div className='flex items-center gap-4'>
          <Avatar className='h-16 w-16'>
              <AvatarImage src={avatarPreview || undefined} alt="Avatar Preview" />
              <AvatarFallback className='text-xs'>Photo</AvatarFallback>
          </Avatar>
          <Button variant="outline" onClick={() => photoRef.current?.click()} className="flex-1">
              <Upload className="h-4 w-4 mr-2" /> Upload Photo
          </Button>
          <input type="file" ref={photoRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
        </div>
        <div className="flex gap-3">
            <Input placeholder="First Name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input placeholder="Last Name *" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <Input placeholder="Contact No *" value={mobile} onChange={(e) => setMobile(e.target.value)} />
        <Input placeholder="Email Address *" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Create Password *" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex justify-end pt-2">
            <Button size="sm" onClick={handleNextStep}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
    </div>
  );
  
  const renderPanelTwo = () => (
    <div className="space-y-4">
        <h3 className="font-semibold">Step 2: Field of Interest</h3>
        <div className="space-y-2">
            <label className="text-sm font-medium">What is your field of interest? *</label>
             <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>{Object.keys(FIELDS_OF_INTEREST).map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
            </Select>
        </div>
         <div className="space-y-2">
            <label className="text-sm font-medium">Any specialization? (Optional)</label>
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
        <div className="text-center pt-2">
          <Button variant="link" size="sm" onClick={() => setSignUpView('quiz')}>
            <HelpCircle className="h-4 w-4 mr-2"/>
            Not sure? Take a quick quiz to find out!
          </Button>
        </div>
    </div>
  );

  const renderQuizResults = () => (
    <div>
      <h3 className="font-semibold text-center">Choose Your Career Field</h3>
      <p className="text-sm text-muted-foreground text-center mb-4">
        Select the category that excites you most to pre-fill your profile.
      </p>
      {isSuggesting ? (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Lightbulb className="h-4 w-4 animate-pulse" />
          <span>Generating suggestions...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-3 items-center">
            {interestSuggestions.map((category, idx) => (
                <Button
                key={idx}
                size="lg"
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => {
                    handleCategoryChange(category);
                    setSignUpView("form");
                }}
                >
                {category}
                </Button>
            ))}
        </div>
      )}
    </div>
  );

  const renderSignUp = () => {
    if (signUpView === 'quiz') {
        // Now passing the correct props to the flexible SkillAssessmentForm component
        return <SkillAssessmentForm questions={signupQuestions} onComplete={handleQuizComplete} />;
    }
    if (signUpView === 'quiz_results') {
        return renderQuizResults();
    }

    const progress = (currentStep / 2) * 100;
    return (
        <>
            <div className="flex items-center gap-3 mb-4">
                <UserPlus className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-headline font-semibold">Create Account</h2>
            </div>
            <Progress value={progress} className="mb-4 h-2" />
            
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                >
                    {currentStep === 1 && renderPanelOne()}
                    {currentStep === 2 && renderPanelTwo()}
                </motion.div>
            </AnimatePresence>
            
            <div className="mt-4 space-y-2">
                {currentStep === 2 && (
                    <Button className="w-full" onClick={submitSignUp} disabled={loading || !selectedCategory}>
                        {loading ? 'Creating Account…' : 'Finish Sign Up'}
                    </Button>
                )}
                <Button variant="link" className="w-full text-xs" onClick={() => setLoginView('login')}>
                    Already have an account? Login
                </Button>
            </div>
        </>
    );
  };

  if (!showLogin) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogin(false)} />
      <motion.div
        key={loginView + signUpView}
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative z-10 w-[90%] max-w-md rounded-xl border bg-background p-6 shadow-xl"
      >
        {loginView === 'login' ? renderLogin() : renderSignUp()}
      </motion.div>
    </motion.div>
  );
}