'use client';
import { authService, resumeService, SignUpData, chatHistoryService, ChatSession, Message, userDbService, UserProfileData, FirebaseUser, evaluationService } from '@/lib/services';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { ref, onValue, serverTimestamp } from 'firebase/database';
import { RoastResumeOutput } from '@/ai/flows/roast-resume';
import { RankResumeOutput } from '@/ai/flows/rank-resume';
import { InterviewEvaluation } from '@/ai/flows/mock-interview-flow';

export interface EvaluationContext {
  type: 'Mock Interview' | 'Resume Ranking' | 'Resume Roast' | 'Skill Assessment';
  inputs: Record<string, any>;
  result: any;
  resumeText?: string;
}

type User = UserProfileData;

type UserEvaluations = {
  skillAssessments: any[];
  resumeReviews: any[];
  mockInterviews: any[];
};

export interface ResumeRankerState {
  uploadedFile: File | null;
  pdfBase64: string;
  pdfPreviewUrl: string;
  jobRole: string;
  field: string;
  rankingResult: RankResumeOutput | null;
  roastResult: RoastResumeOutput | null;
}
export interface MockInterviewState {
  uploadedFile: File | null;
  pdfPreviewUrl: string;
  jobRole: string;
  field: string;
  difficulty: 'easy' | 'intermediate' | 'hard' | '';
  candidateName: string;
  resumeText: string;
  resumeAnalysis: any | null;
  evaluation: InterviewEvaluation | null;
}
export interface SkillAssessmentState {
  answers: { [key: string]: any };
  analysis: any | null;
  selectedRole: string | null;
  roadmap: any | null;
  isFinished: boolean;
  currentQuestionIndex: number;
}

type Theme = 'light' | 'dark' | 'system';
type LoginView = 'login' | 'signup' | 'completeGoogleProfile';

export type SignupFormState = {
    firstName?: string;
    lastName?: string;
    email?: string;
    mobile?: string;
    age?: string;
    gender?: string;
    country?: string;
    language?: string;
    fieldOfInterest?: string;
    avatar?: string | null;
    currentStep?: number;
    password?: string;
    confirmPassword?: string;
};

interface AppContextType {
  activeRoute: string;
  authed: boolean;
  user: User | null;
  resumeText: string;
  showLogin: boolean;
  showProfileCompletion: boolean;
  isMobileMenuOpen: boolean;
  isInterviewActive: boolean; // <-- ADDED
  theme: Theme;
  loginView: LoginView;
  signupFormState: SignupFormState; 
  chatHistory: ChatSession[];
  isLoadingAuth: boolean;
  isAuthLoading: boolean;
  isProfileChecked: boolean;
  evaluations: UserEvaluations;
  resumeRankerState: ResumeRankerState;
  setResumeRankerState: (newState: Partial<ResumeRankerState>) => void;
  mockInterviewState: MockInterviewState;
  setMockInterviewState: (newState: Partial<MockInterviewState>) => void;
  skillAssessmentState: SkillAssessmentState;
  setSkillAssessmentState: (newState: Partial<SkillAssessmentState>) => void;
  handleClearAssessmentState: () => void;
  handleClearResumeRankerState: () => void;
  handleClearMockInterviewState: () => void;
  setActiveRoute: Dispatch<SetStateAction<string>>;
  setResumeText: (text: string) => void;
  setShowLogin: Dispatch<SetStateAction<boolean>>;
  setIsMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
  setIsInterviewActive: Dispatch<SetStateAction<boolean>>; // <-- ADDED
  setLoginView: Dispatch<SetStateAction<LoginView>>;
  setSignupFormState: Dispatch<SetStateAction<SignupFormState>>; 
  clearSignupForm: () => void; 
  handleNavigate: (key: string) => void;
  handleLogin: (email: string, pass: string) => Promise<void>;
  handleSignUp: (data: SignUpData) => Promise<void>;
  handleSignInOrSignUpWithGoogle: () => Promise<void>;
  handleLoginWithGoogle: () => Promise<void>;
  handleLogout: () => void;
  handleCancelSignUp: () => Promise<void>;
  toggleTheme: () => void;
  handleDeleteAccount: () => Promise<void>;
  handleProfileUpdate: (data: Partial<User>) => Promise<void>;
  saveCurrentChat: (messages: Message[], currentSessionId: string | null) => Promise<string | null>;
  startChatWithEvaluationContext: (ctx: EvaluationContext) => void;
  refreshEvaluations: () => Promise<void>;
  generateUserProfileJsonForChat: () => string | null;
}

const AppContext = createContext<AppContextType | null>(null);

const initialResumeRankerState: ResumeRankerState = {
  uploadedFile: null,
  pdfBase64: '',
  pdfPreviewUrl: '',
  jobRole: '',
  field: '',
  rankingResult: null,
  roastResult: null,
};

const initialMockInterviewState: MockInterviewState = {
  uploadedFile: null,
  pdfPreviewUrl: '',
  jobRole: '',
  field: '',
  difficulty: '',
  candidateName: '',
  resumeText: '',
  resumeAnalysis: null,
  evaluation: null,
};

const initialSkillAssessmentState: SkillAssessmentState = {
    answers: {},
    analysis: null,
    selectedRole: null,
    roadmap: null,
    isFinished: false,
    currentQuestionIndex: 0,
};

const initialSignupFormState: SignupFormState = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    age: '',
    gender: '',
    country: '',
    language: '',
    fieldOfInterest: '',
    avatar: null,
    currentStep: 1,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeRoute, setActiveRoute] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isProfileChecked, setIsProfileChecked] = useState(false);
  const [resumeTextState, setResumeTextState] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInterviewActive, setIsInterviewActive] = useState(false); // <-- ADDED
  const [theme, setTheme] = useState<Theme>('dark');
  const [loginView, setLoginView] = useState<LoginView>('login');
  const [signupFormState, setSignupFormState] = useState<SignupFormState>(initialSignupFormState); 
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [evaluations, setEvaluations] = useState<UserEvaluations>({
    skillAssessments: [],
    resumeReviews: [],
    mockInterviews: [],
  });
  const { toast } = useToast();
  const [resumeRankerState, setResumeRankerStateInternal] = useState<ResumeRankerState>(initialResumeRankerState);
  const [mockInterviewState, setMockInterviewStateInternal] = useState<MockInterviewState>(initialMockInterviewState);
  
  const [skillAssessmentState, setSkillAssessmentStateInternal] = useState<SkillAssessmentState>(() => {
    if (typeof window === 'undefined') {
      return initialSkillAssessmentState;
    }
    try {
      const savedState = sessionStorage.getItem('skillAssessmentState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        if (parsedState.analysis && !Array.isArray(parsedState.analysis.roles)) {
          parsedState.analysis.roles = [];
        }
        return parsedState;
      }
      return initialSkillAssessmentState;
    } catch (error) {
      console.error('Failed to parse skill assessment state from session storage', error);
      return initialSkillAssessmentState;
    }
  });

  const clearSignupForm = () => setSignupFormState(initialSignupFormState); 

  useEffect(() => {
    try {
      sessionStorage.setItem('skillAssessmentState', JSON.stringify(skillAssessmentState));
    } catch (error) {
      console.error('Failed to save skill assessment state to session storage', error);
    }
  }, [skillAssessmentState]);

  const setResumeRankerState = (newState: Partial<ResumeRankerState>) =>
    setResumeRankerStateInternal(p => ({ ...p, ...newState }));
  const setMockInterviewState = (newState: Partial<MockInterviewState>) =>
    setMockInterviewStateInternal(p => ({ ...p, ...newState }));
  const setSkillAssessmentState = (newState: Partial<SkillAssessmentState>) =>
    setSkillAssessmentStateInternal(p => ({ ...p, ...newState }));
  
  const handleClearAssessmentState = () => setSkillAssessmentStateInternal(initialSkillAssessmentState);
  const handleClearResumeRankerState = () => setResumeRankerStateInternal(initialResumeRankerState);
  const handleClearMockInterviewState = () => { // <-- MODIFIED
    setMockInterviewStateInternal(prev => ({...initialMockInterviewState, candidateName: prev.candidateName}));
    setIsInterviewActive(false);
  };

  useEffect(() => {
    const url = resumeRankerState.pdfPreviewUrl;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [resumeRankerState.pdfPreviewUrl]);
  useEffect(() => {
    const url = mockInterviewState.pdfPreviewUrl;
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [mockInterviewState.pdfPreviewUrl]);

  const refreshEvaluations = useCallback(async () => {
    if (user?.uid) {
      try {
        const userEvals = await evaluationService.getEvaluations(user.uid);
        setEvaluations(userEvals);
      } catch (error) {
        console.error("Failed to refresh evaluations:", error);
      }
    }
  }, [user?.uid]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || '',
          email: firebaseUser.email || ''
        });
      } else {
        setUser(null);
        setChatHistory([]);
        setEvaluations({ skillAssessments: [], resumeReviews: [], mockInterviews: [] });
        setShowProfileCompletion(false);
        setIsProfileChecked(true);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (!isLoadingAuth && user && showLogin) {
      if (loginView !== 'completeGoogleProfile') {
          setShowLogin(false);
          toast({ title: 'Login Successful!' });
      }
      if (isAuthLoading) {
        setIsAuthLoading(false);
      }
    }
  }, [user, isLoadingAuth, showLogin, isAuthLoading, loginView, toast]);

  // --- MODIFICATION START ---
  // This hook is now corrected to prevent the race condition on logout.
  useEffect(() => {
    if (!user?.uid) {
      // If there is no user, we do not need to check a profile.
      // The onAuthStateChanged effect has already correctly set `isProfileChecked` to `true`.
      // We simply return here to prevent this hook from incorrectly setting it back to `false`.
      return;
    }

    // When a user first logs in, we mark the check as "in-progress".
    setIsProfileChecked(false); 
    const userRef = ref(db, `users/${user.uid}`);
    
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData: UserProfileData = snapshot.val();
        setUser(prevUser => ({ ...prevUser!, ...userData }));
        
        if (!userData.profileCompleted) {
            setShowLogin(false);
            setShowProfileCompletion(true);
        } else {
            setShowProfileCompletion(false);
        }

        setMockInterviewStateInternal(prev => ({ ...prev, candidateName: userData.name || prev.candidateName }));

        const formatData = (obj: any) =>
          obj ? Object.values(obj).sort((a: any, b: any) => (b as any).createdAt - a.createdAt) : [];

        setEvaluations({
          skillAssessments: formatData(userData.skillAssessments),
          resumeReviews: formatData(userData.resumeEvaluations),
          mockInterviews: formatData(userData.mockInterviews),
        });

        const chatHistoryData = userData.chats
          ? Object.keys(userData.chats).map(id => ({ id, ...userData.chats[id] }))
          : [];
        setChatHistory(chatHistoryData.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setShowProfileCompletion(true);
      }
      // Once the database has been queried, we mark the check as "complete".
      setIsProfileChecked(true); 
    });
    return () => unsubscribe();
  }, [user?.uid]);
  // --- MODIFICATION END ---

  useEffect(() => {
    const onHash = () => {
      const key = window.location.hash.replace('#', '');
      if (key) setActiveRoute(key);
    };
    window.addEventListener('hashchange', onHash);
    onHash();
    setResumeTextState(resumeService.getText());
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(p => (p === 'dark' ? 'light' : 'dark'));
  const handleNavigate = (key: string) => {
    setActiveRoute(key);
    window.location.hash = key;
    setIsMobileMenuOpen(false);
  };
  const handleLogin = async (email: string, pass: string) => {
    setIsAuthLoading(true);
    try {
      await authService.login(email, pass);
    } catch (error: any) {
      setIsAuthLoading(false); 
      toast({ variant: 'destructive', title: 'Login Failed', description: 'Please check your email and password.' });
      throw error;
    }
  };
  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    handleNavigate('home');
    toast({ title: 'Logged Out' });
  };
  
  const handleCancelSignUp = async () => {
    await authService.cancelSignUpAndDeleteAuthUser();
    handleNavigate('home');
    toast({ title: 'Sign-up Canceled' });
  };

  const setResumeText = (text: string) => {
    setResumeTextState(text);
    resumeService.saveText(text);
  };

  const handleSignUp = async (data: SignUpData) => {
    setIsAuthLoading(true);
    try {
      await authService.signUp(data);
      clearSignupForm();
      toast({ title: 'Signup Successful!', description: 'Welcome aboard.' });
    } catch (error: any) {
      setIsAuthLoading(false);
      toast({
        variant: 'destructive',
        title: 'Sign-up Failed',
        description: (error as any).code === 'auth/email-already-in-use'
          ? 'This email is already registered.'
          : 'An error occurred.'
      });
      throw error;
    }
  };

  const handleSignInOrSignUpWithGoogle = async () => {
    setIsAuthLoading(true);
    try {
      const { isNewUser, user } = await authService.signInOrSignUpWithGoogle();
      if (isNewUser) {
        const nameParts = user.displayName?.split(' ') || [];
        setSignupFormState({
            ...initialSignupFormState,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: user.email || '',
            avatar: user.photoURL || null,
        });
      }
      setShowLogin(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Sign-in Failed', description: 'Could not sign in with Google.' });
    } finally {
        setIsAuthLoading(false);
    }
  };

  const handleLoginWithGoogle = async () => {
    setIsAuthLoading(true);
    try {
      await authService.loginWithGoogle();
    } catch (error: any) {
      setIsAuthLoading(false);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: (error as any).name === 'auth/user-not-found'
          ? 'No account found. Please sign up first.'
          : 'Could not sign in with Google. Please try again.'
      });
      throw error;
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      await authService.deleteAccount(user.uid);
      toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast({ variant: 'destructive', title: 'Deletion Failed', description: 'Could not delete your account. Please try again.' });
      throw error;
    }
  };

  const handleProfileUpdate = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const existingProfile = await userDbService.getUser(user.uid);
      const profileData: Partial<UserProfileData> = {
        ...data,
        email: user.email || undefined,
      };

      if (!existingProfile) {
        profileData.createdAt = serverTimestamp();
      }
      
      await authService.updateProfile(user.uid, profileData);
      toast({ title: 'Profile Saved Successfully!' });
      if(data.profileCompleted) {
          clearSignupForm();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not save your profile.'
      });
      throw error;
    }
  };

  const saveCurrentChat = async (messages: Message[], currentSessionId: string | null) => {
    if (!user) return null;
    const { sessionId } = await chatHistoryService.saveChatSession(user.uid, messages, currentSessionId);
    return sessionId || null;
  };

  const generateUserProfileJsonForChat = useCallback(() => {
    if (!user) return null;
    const profile: Record<string, any> = {
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      country: user.country,
      fieldOfInterest: user.fieldOfInterest,
      skills: user.skills,
      experience: user.experience,
      education: {
        college: user.college,
        degree: user.degree,
        gradYear: user.gradYear,
      },
      resumeSummary: resumeTextState,
    };
    return JSON.stringify(Object.fromEntries(Object.entries(profile).filter(([, v]) => v != null && v !== '')));
  }, [user, resumeTextState]);

  const startChatWithEvaluationContext = useCallback((ctx: EvaluationContext) => {
    if (!ctx || !ctx.type || !ctx.result) {
        console.error("Invalid evaluation context provided.");
        toast({
            variant: "destructive",
            title: "Could not start chat",
            description: "The evaluation data was missing or invalid."
        });
        return;
    }
    
    try {
        const serializableContext = JSON.stringify(ctx);
        sessionStorage.setItem('newChatWithContext', serializableContext);
        sessionStorage.removeItem('chatBotWidget_activeSessionId');
        sessionStorage.removeItem('chatBotWidget_input');
        handleNavigate('chat');
    } catch (error) {
        console.error("Failed to serialize evaluation context:", error);
        toast({
            variant: "destructive",
            title: "Error Starting Chat",
            description: "There was a problem preparing the evaluation data. Please try again."
        });
    }
  }, [handleNavigate, toast]);

  const value: AppContextType = {
    activeRoute,
    authed: !!user,
    user,
    resumeText: resumeTextState,
    showLogin,
    showProfileCompletion,
    isMobileMenuOpen,
    isInterviewActive, // <-- ADDED
    theme,
    loginView,
    signupFormState,
    chatHistory,
    isLoadingAuth,
    isAuthLoading,
    isProfileChecked,
    evaluations,
    resumeRankerState,
    setResumeRankerState,
    mockInterviewState,
    setMockInterviewState,
    skillAssessmentState,
    setSkillAssessmentState,
    handleClearAssessmentState,
    handleClearResumeRankerState,
    handleClearMockInterviewState,
    setActiveRoute,
    setResumeText,
    setShowLogin,
    setIsMobileMenuOpen,
    setIsInterviewActive, // <-- ADDED
    setLoginView,
    setSignupFormState,
    clearSignupForm,
    handleNavigate,
    handleLogin,
    handleSignUp,
    handleSignInOrSignUpWithGoogle,
    handleLoginWithGoogle,
    handleLogout,
    handleCancelSignUp,
    toggleTheme,
    handleProfileUpdate,
    handleDeleteAccount,
    saveCurrentChat,
    startChatWithEvaluationContext,
    refreshEvaluations,
    generateUserProfileJsonForChat,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}