'use client';
import { authService, resumeService, SignUpData, chatHistoryService, ChatSession, Message, userDbService, evaluationService, UserProfileData } from '@/lib/services';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

// --- THIS IS THE CORRECTED 'User' TYPE ---
// It now includes all the fields from your profile form.
type User = UserProfileData;

type UserEvaluations = {
  skillAssessments: any[];
  resumeReviews: any[];
  mockInterviews: any[];
};

type Theme = 'light' | 'dark' | 'system';
type LoginView = 'login' | 'signup';

interface AppContextType {
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
  setActiveRoute: Dispatch<SetStateAction<string>>;
  setResumeText: (text: string) => void;
  setShowLogin: Dispatch<SetStateAction<boolean>>;
  setIsMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
  setLoginView: Dispatch<SetStateAction<LoginView>>;
  setShowEditProfile: Dispatch<SetStateAction<boolean>>;
  handleNavigate: (key: string) => void;
  handleLogin: (email: string, pass: string) => Promise<void>;
  handleSignUp: (data: SignUpData) => Promise<void>;
  handleLogout: () => void;
  toggleTheme: () => void;
  handleProfileUpdate: (data: Partial<User>) => Promise<void>;
  saveCurrentChat: (messages: Message[], currentSessionId: string | null) => Promise<string | null>;
  refreshEvaluations: () => Promise<void>;
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
    const unsubscribeFromAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        if (!user || user.uid !== firebaseUser.uid) {
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
    return () => unsubscribeFromAuth();
  }, [user]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }
    const userRef = ref(db, `users/${user.uid}`);
    const unsubscribeFromDb = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        const { resumeEvaluations, mockInterviews, skillAssessments, chats, ...userProfile } = userData;
        setUser(prevUser => ({ ...prevUser!, ...userProfile }));
        const formatData = (obj: any) => obj ? Object.values(obj).sort((a: any, b: any) => (b as any).createdAt - (a as any).createdAt) : [];
        setEvaluations({
          skillAssessments: formatData(skillAssessments),
          resumeReviews: formatData(resumeEvaluations),
          mockInterviews: formatData(mockInterviews),
        });
        const chatHistoryData = chats ? Object.keys(chats).map(id => ({ id, ...chats[id] })) : [];
        setChatHistory(chatHistoryData.sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setEvaluations(null);
        setChatHistory([]);
      }
    });
    return () => {
      unsubscribeFromDb();
    };
  }, [user?.uid]);

  useEffect(() => {
    const onHash = () => { const key = window.location.hash.replace('#', ''); if (key) setActiveRoute(key); };
    window.addEventListener('hashchange', onHash); onHash();
    setResumeTextState(resumeService.getText());
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) { setTheme(storedTheme); } else { const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; setTheme(prefersDark ? 'dark' : 'light'); }
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => { document.documentElement.classList.remove('light', 'dark'); document.documentElement.classList.add(theme); localStorage.setItem('theme', theme); }, [theme]);

  const toggleTheme = () => { setTheme(prev => prev === 'dark' ? 'light' : 'dark'); };
  const handleNavigate = (key: string) => { setActiveRoute(key); window.location.hash = key; setIsMobileMenuOpen(false); };
  const handleLogin = async (email: string, pass: string) => { await authService.login(email, pass); setShowLogin(false); toast({ title: 'Login Successful' }); };
  
  const handleSignUp = async (data: SignUpData) => {
    try {
      await authService.signUp(data);
      setLoginView('login');
      toast({ 
        title: 'Account Created Successfully!',
        description: 'You can now log in with your new credentials.',
      });
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
          variant: 'destructive',
          title: 'Sign-up Failed',
          description: 'This email address is already registered. Please try logging in instead.',
        });
      } else {
        console.error("A non-specific sign-up error occurred:", error);
        toast({
          variant: 'destructive',
          title: 'An Error Occurred',
          description: 'Could not create your account. Please check your details and try again.',
        });
      }
      throw error;
    }
  };

  const handleProfileUpdate = async (data: Partial<User>) => { if (!user) return; const updatedProfile = await authService.updateProfile(user.uid, data); setUser(updatedProfile); setShowEditProfile(false); toast({ title: 'Profile Updated' }); };
  const handleLogout = async () => { await authService.logout(); setUser(null); handleNavigate('home'); toast({ title: 'Logged Out' }); };
  const setResumeText = (text: string) => { setResumeTextState(text); resumeService.saveText(text); };
  const saveCurrentChat = async (messages: Message[], currentSessionId: string | null) => { if (!user) return null; const { sessionId } = await chatHistoryService.saveChatSession(user.uid, messages, currentSessionId); return sessionId || null; };

  const value: AppContextType = {
    activeRoute, authed: !!user, user, resumeText: resumeTextState, showLogin, isMobileMenuOpen, theme, loginView, showEditProfile, chatHistory, isLoadingAuth, evaluations,
    setActiveRoute, setResumeText, setShowLogin, setIsMobileMenuOpen, setLoginView, setShowEditProfile,
    handleNavigate, handleLogin, handleSignUp, handleLogout, toggleTheme, handleProfileUpdate, saveCurrentChat,
    refreshEvaluations,
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