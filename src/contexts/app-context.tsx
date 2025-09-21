// src/contexts/app-context.tsx

'use client';
import { authService, resumeService, SignUpData, chatHistoryService, ChatSession, Message, userDbService, evaluationService } from '@/lib/services';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
// --- MODIFICATION START ---
// Add useCallback to memoize our new function
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
// --- MODIFICATION END ---
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

type User = {
  uid: string;
  name: string;
  email: string;
  avatar?: string | null;
  mobile?: string;
  education?: string;
  fieldOfInterest?: string;
};

type UserEvaluations = {
  skillAssessments: any[];
  resumeReviews: any[];
  mockInterviews: any[];
};

type Theme = 'light' | 'dark' | 'system';
type LoginView = 'login' | 'signup';

interface AppContextType {
  // State
  activeRoute: string;
  authed: boolean;
  user: User | null;
  resumeText: string;
  showLogin: boolean;
  isMobileMenuOpen: boolean;
  theme: Theme;
  loginView: LoginView;
  showEditProfile: boolean;
  chatHistory: ChatSession[];
  isLoadingAuth: boolean;
  evaluations: UserEvaluations | null;

  // Setters
  setActiveRoute: Dispatch<SetStateAction<string>>;
  setResumeText: (text: string) => void;
  setShowLogin: Dispatch<SetStateAction<boolean>>;
  setIsMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
  setLoginView: Dispatch<SetStateAction<LoginView>>;
  setShowEditProfile: Dispatch<SetStateAction<boolean>>;

  // Actions
  handleNavigate: (key: string) => void;
  handleLogin: (email: string, pass: string) => Promise<void>;
  handleSignUp: (data: SignUpData) => Promise<void>;
  handleLogout: () => void;
  toggleTheme: () => void;
  handleProfileUpdate: (data: Partial<SignUpData>) => Promise<void>;
  // --- MODIFICATION START ---
  // Add the new refresh function to the context type
  refreshEvaluations: () => Promise<void>;
  // --- MODIFICATION END ---

  // Chat Actions
  saveCurrentChat: (messages: Message[], currentSessionId: string | null) => Promise<string | null>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeRoute, setActiveRoute] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [resumeTextState, setResumeTextState] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [loginView, setLoginView] = useState<LoginView>('login');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [evaluations, setEvaluations] = useState<UserEvaluations | null>(null);
  const { toast } = useToast();

  const loadUserEvaluations = useCallback(async (uid: string) => {
    if (!uid) return;
    const evals = await evaluationService.getEvaluations(uid);
    setEvaluations(evals);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await userDbService.getUser(firebaseUser.uid);
        if (userProfile) {
          setUser({
            uid: firebaseUser.uid,
            name: userProfile.name,
            email: userProfile.email,
            avatar: userProfile.avatar,
            mobile: userProfile.mobile,
            education: userProfile.education,
            fieldOfInterest: userProfile.fieldOfInterest,
          });
          const history = await chatHistoryService.getHistory(firebaseUser.uid);
          setChatHistory(history);
          await loadUserEvaluations(firebaseUser.uid);
        } else {
            setUser({
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || 'User',
                email: firebaseUser.email || '',
                avatar: firebaseUser.photoURL,
            });
        }
      } else {
        setUser(null);
        setChatHistory([]);
        setEvaluations(null);
      }
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [loadUserEvaluations]);
  
  // ... (keep other useEffect hooks)
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

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleNavigate = (key: string) => {
    setActiveRoute(key);
    window.location.hash = key;
    setIsMobileMenuOpen(false);
  };

  const handleLogin = async (email: string, pass: string) => {
    await authService.login(email, pass);
    setShowLogin(false);
    toast({ title: 'Login Successful', description: `Welcome back!` });
  };

  const handleSignUp = async (data: SignUpData) => {
    await authService.signUp(data);
    setLoginView('login');
    toast({ title: 'Account Created Successfully!', description: 'Please log in to continue.' });
  };
  
  const handleProfileUpdate = async (data: Partial<SignUpData>) => {
    if (!user) return;
    const updatedProfile = await authService.updateProfile(user.uid, data);
    setUser({
        uid: user.uid,
        name: updatedProfile!.name,
        email: updatedProfile!.email,
        avatar: updatedProfile!.avatar,
        mobile: updatedProfile!.mobile,
        education: updatedProfile!.education,
        fieldOfInterest: updatedProfile!.fieldOfInterest,
    });
    setShowEditProfile(false);
    toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.' });
  }

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    handleNavigate('home');
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
  };
  
  const setResumeText = (text: string) => {
    setResumeTextState(text);
    resumeService.saveText(text);
  };

  const saveCurrentChat = async (messages: Message[], currentSessionId: string | null) => {
    if (!user) return null;
    const { sessionId } = await chatHistoryService.saveChatSession(user.uid, messages, currentSessionId);
    const history = await chatHistoryService.getHistory(user.uid);
    setChatHistory(history);
    return sessionId || null;
  };
  
  // --- MODIFICATION START ---
  // Define the refresh function and memoize it with useCallback.
  const refreshEvaluations = useCallback(async () => {
    if (user) {
      await loadUserEvaluations(user.uid);
    }
  }, [user, loadUserEvaluations]);
  // --- MODIFICATION END ---

  const value = {
    activeRoute,
    authed: !!user,
    user,
    resumeText: resumeTextState,
    showLogin,
    isMobileMenuOpen,
    theme,
    loginView,
    showEditProfile,
    chatHistory,
    isLoadingAuth,
    evaluations,
    setActiveRoute,
    setResumeText,
    setShowLogin,
    setIsMobileMenuOpen,
    setLoginView,
    setShowEditProfile,
    handleNavigate,
    handleLogin,
    handleSignUp,
    handleLogout,
    toggleTheme,
    handleProfileUpdate,
    saveCurrentChat,
    // --- MODIFICATION START ---
    // Expose the new function through the context's value.
    refreshEvaluations,
    // --- MODIFICATION END ---
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