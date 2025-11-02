import { LS_KEYS } from './constants';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseAuthProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  deleteUser, // <-- ADDED THIS IMPORT
} from 'firebase/auth';
import { ref, set, get, child, update, push, serverTimestamp, remove } from 'firebase/database';
import { RoastResumeOutput } from '@/ai/flows/roast-resume';
import { RankResumeOutput } from '@/ai/flows/rank-resume';
import { InterviewEvaluation } from '@/ai/flows/mock-interview-flow';

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export type UserProfileData = {
    uid: string;
    name: string;
    email: string;
    mobile?: string;
    dob?: string;
    gender?: string;
    age?: number;
    country?: string;
    language?: string;
    fieldOfInterest?: string;
    college?: string;
    degree?: string;
    gradYear?: number;
    skills?: string[];
    experience?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    avatar?: string | null;
    profileCompleted?: boolean;
    createdAt?: any;
    skillAssessments?: any;
    resumeEvaluations?: any;
    mockInterviews?: any;
    chats?: any;
}

export type SignUpData = {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    mobile: string;
    age: string;
    gender: string;
    country: string;
    language: string;
    fieldOfInterest: string;
    avatar?: string | null;
}

export type { FirebaseUser };

export const userDbService = {
  createUser: async (user: FirebaseUser) => {
    const userRef = ref(db, 'users/' + user.uid);
    await set(userRef, {
      uid: user.uid,
      email: user.email,
      name: user.displayName || user.email?.split('@')[0],
      avatar: user.photoURL,
      createdAt: serverTimestamp(),
      profileCompleted: false,
    });
  },

  getUser: async (uid: string): Promise<UserProfileData | null> => {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `users/${uid}`));
    return snapshot.exists() ? snapshot.val() : null;
  },

  updateUser: async (uid: string, data: Partial<UserProfileData>) => {
    const userRef = ref(db, 'users/' + uid);
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    await update(userRef, cleanData);
  }
};

export const authService = {
  login: async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },
  
  signUp: async (data: Partial<SignUpData>) => {
    if (!data.email || !data.password) {
      throw new Error("Email and password are required for signup.");
    }

    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;
    
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    const profileData: Partial<UserProfileData> = {
        uid: user.uid,
        email: user.email || undefined,
        name: fullName || user.email?.split('@')[0],
        mobile: data.mobile,
        age: data.age ? parseInt(data.age, 10) : undefined,
        gender: data.gender,
        country: data.country,
        language: data.language,
        fieldOfInterest: data.fieldOfInterest,
        avatar: data.avatar || null,
        createdAt: serverTimestamp(),
        profileCompleted: true,
    };

    await updateFirebaseAuthProfile(user, {
      displayName: profileData.name,
      photoURL: profileData.avatar || '',
    });

    await userDbService.updateUser(user.uid, profileData);

    return user;
  },
  
  signInOrSignUpWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userProfile = await userDbService.getUser(user.uid);
    const isNewUser = !userProfile;
    
    return { user, isNewUser };
  },

  loginWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userProfile = await userDbService.getUser(user.uid);
    
    if (!userProfile) {
      await signOut(auth);
      const error = new Error("No account found with this Google account. Please sign up first.");
      error.name = 'auth/user-not-found';
      throw error;
    }
    
    return { user, isNewUser: false };
  },
  
  updateProfile: async (uid: string, data: Partial<UserProfileData>) => {
    const user = auth.currentUser;
    if (!user || user.uid !== uid) throw new Error("User not authenticated.");
    
    const authUpdates: { displayName?: string, photoURL?: string | null } = {};
    if (data.name) {
      authUpdates.displayName = data.name;
    }
    if (data.avatar !== undefined) {
      authUpdates.photoURL = data.avatar; 
    }
    
    if (Object.keys(authUpdates).length > 0) {
      await updateFirebaseAuthProfile(user, authUpdates as { displayName?: string, photoURL?: string });
    }
    
    await userDbService.updateUser(uid, data);
    return await userDbService.getUser(uid);
  },

  deleteAccount: async (uid: string) => {
    const user = auth.currentUser;
    if (!user || user.uid !== uid) throw new Error("Authentication error.");

    const userDbRef = ref(db, `users/${uid}`);
    await remove(userDbRef);

    await deleteUser(user);
  },
  logout: async () => {
    await signOut(auth);
    if (typeof window !== 'undefined') {
        localStorage.removeItem(LS_KEYS.resume);
    }
  },

  // NEW FUNCTION TO CANCEL SIGN-UP AND DELETE THE AUTH USER
  cancelSignUpAndDeleteAuthUser: async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await deleteUser(user);
      } catch (error) {
        console.error("Error deleting temporary auth user:", error);
        // Still sign out to clear the session even if delete fails
        await signOut(auth);
      }
    }
  }
};

export const newsService = {
  fetchTrending: async () => {
    await sleep(400);
    return [
      { 
        title: 'Remote Work is Here to Stay: Why', 
        description: 'Exploring the lasting impact of remote work on the global job market and company culture.', 
        url: '#', imageUrl: 'https://picsum.photos/400/250', 'data-ai-hint': 'remote work',
      },
      { 
        title: 'AI In Healthcare: The Next Frontier', 
        description: 'How artificial intelligence is revolutionizing patient diagnostics, treatment plans, and drug discovery.', 
        url: '#', imageUrl: 'https://picsum.photos/400/251', 'data-ai-hint': 'ai healthcare',
      },
    ];
  },
};

export const resumeService = {
  saveText: (text: string) => {
    if (typeof window !== 'undefined') localStorage.setItem(LS_KEYS.resume, text || '');
  },
  getText: () => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(LS_KEYS.resume) || '';
  },
  hasResume: () => {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem(LS_KEYS.resume));
  },
};

export type Message = {
    role: 'user' | 'bot';
    text: string;
};
  
export type ChatSession = {
    id: string;
    title: string;
    timestamp: number;
    messages: Message[];
};

export const chatHistoryService = {
    saveChatSession: async (userId: string, messages: Message[], existingId: string | null) => {
        if (!userId || messages.length <= 1) return { sessionId: existingId };
        let sessionId = existingId;
        const generateTitle = (msgs: Message[]) => msgs.find(m => m.role === 'user')?.text.split(' ').slice(0, 5).join(' ') + '...' || 'New Chat';
        if (sessionId) {
            await update(ref(db, `users/${userId}/chats/${sessionId}`), { messages, timestamp: serverTimestamp() });
        } else {
            const newSessionRef = push(ref(db, `users/${userId}/chats`));
            sessionId = newSessionRef.key;
            if (!sessionId) throw new Error("Failed to create new chat session.");
            await set(newSessionRef, { title: generateTitle(messages), timestamp: serverTimestamp(), messages });
        }
        return { sessionId };
    }
};

export const evaluationService = {
  saveRankResult: async (userId: string, data: { jobRole: string; field: string; result: RankResumeOutput }) => {
    const newEvalRef = push(ref(db, `users/${userId}/resumeEvaluations`));
    await set(newEvalRef, { type: 'rank', ...data, createdAt: serverTimestamp() });
  },
  saveRoastResult: async (userId: string, data: { jobRole: string; field: string; result: RoastResumeOutput }) => {
    const newEvalRef = push(ref(db, `users/${userId}/resumeEvaluations`));
    await set(newEvalRef, { type: 'roast', ...data, createdAt: serverTimestamp() });
  },
  saveInterview: async (userId: string, data: { jobRole: string; field: string; difficulty: string; evaluation: InterviewEvaluation, history: any[] }) => {
    const newInterviewRef = push(ref(db, `users/${userId}/mockInterviews`));
    await set(newInterviewRef, { ...data, createdAt: serverTimestamp() });
  },
  saveSkillAssessment: async (userId: string, analysis: { scores: any; chosenRole: string; roadmap: any; }) => {
    const newAssessmentRef = push(ref(db, `users/${userId}/skillAssessments`));
    await set(newAssessmentRef, { ...analysis, createdAt: serverTimestamp() });
  },
  getEvaluations: async (userId: string) => {
    const snapshot = await get(ref(db, `users/${userId}`));
    if (!snapshot.exists()) return { skillAssessments: [], resumeReviews: [], mockInterviews: [] };
    const data = snapshot.val();
    const formatData = (obj: any) => obj ? Object.values(obj).sort((a: any, b: any) => (b as any).createdAt - a.createdAt) : [];
    return {
      skillAssessments: formatData(data.skillAssessments),
      resumeReviews: formatData(data.resumeEvaluations),
      mockInterviews: formatData(data.mockInterviews),
    };
  }
};