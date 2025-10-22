import { LS_KEYS } from './constants';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseAuthProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, set, get, child, update, push, serverTimestamp } from 'firebase/database';
import { RoastResumeOutput } from '@/ai/flows/roast-resume';
import { RankResumeOutput } from '@/ai/flows/rank-resume';
import { InterviewEvaluation } from '@/ai/flows/mock-interview-flow';

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// This is the single source of truth for all user profile fields, matching the profile page form.
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
}

// This type is specifically for the data collected during the multi-step signup.
export type SignUpData = {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    age: string;
    gender: string;
    country: string;
    language: string;
    fieldOfInterest: string;
    avatar?: string | null;
    password?: string;
}

// --- USER DB SERVICE (REALTIME DB) ---
export const userDbService = {
  createUser: async (user: FirebaseUser, data: SignUpData) => {
    const userRef = ref(db, 'users/' + user.uid);
    const ageAsNumber = parseInt(data.age, 10);
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');

    await set(userRef, {
      uid: user.uid,
      email: data.email,
      name: fullName,
      mobile: data.mobile,
      age: isNaN(ageAsNumber) ? null : ageAsNumber,
      gender: data.gender,
      country: data.country,
      language: data.language,
      fieldOfInterest: data.fieldOfInterest,
      avatar: data.avatar || null,
      createdAt: serverTimestamp(),
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
  signUp: async (data: SignUpData) => {
    if (!data.password) throw new Error("Password is required for signup.");
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;
    
    const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');
    
    await updateFirebaseAuthProfile(user, {
      displayName: fullName,
      photoURL: data.avatar || undefined,
    });
    
    await userDbService.createUser(user, data);
    return user;
  },
  
  updateProfile: async (uid: string, data: Partial<UserProfileData>) => {
    const user = auth.currentUser;
    if (!user || user.uid !== uid) throw new Error("User not authenticated.");
    
    const authUpdates: { displayName?: string, photoURL?: string } = {};
    if (data.name) authUpdates.displayName = data.name;
    if (data.avatar) authUpdates.photoURL = data.avatar;
    
    if (Object.keys(authUpdates).length > 0) {
      await updateFirebaseAuthProfile(user, authUpdates);
    }
    
    await userDbService.updateUser(uid, data);
    return await userDbService.getUser(uid);
  },
  logout: async () => {
    await signOut(auth);
    if (typeof window !== 'undefined') {
        localStorage.removeItem(LS_KEYS.resume);
    }
  },
};

// --- NEWS SERVICE ---
export const newsService = {
  fetchTrending: async () => {
    await sleep(400);
    return [
      { 
        title: 'Remote Work is Here to Stay: Why', 
        description: 'Exploring the lasting impact of remote work on the global job market and company culture.', 
        url: '#',
        imageUrl: 'https://picsum.photos/400/250',
        'data-ai-hint': 'remote work',
      },
      { 
        title: 'AI In Healthcare: The Next Frontier', 
        description: 'How artificial intelligence is revolutionizing patient diagnostics, treatment plans, and drug discovery.', 
        url: '#',
        imageUrl: 'https://picsum.photos/400/251',
        'data-ai-hint': 'ai healthcare',
      },
      { 
        title: 'The Future of Renewable Energy Jobs', 
        description: 'A look at the booming career opportunities in solar, wind, and other green energy sectors.', 
        url: '#',
        imageUrl: 'https://picsum.photos/400/252',
        'data-ai-hint': 'renewable energy',
      },
    ];
  },
};

// --- RESUME SERVICE (FIXED) ---
export const resumeService = {
  saveText: (text: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_KEYS.resume, text || '');
    }
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

// --- CHAT HISTORY SERVICE (REALTIME DB) ---
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
    getHistory: async (userId: string): Promise<ChatSession[]> => {
        if (!userId) return [];
        const chatsRef = ref(db, `users/${userId}/chats`);
        const snapshot = await get(chatsRef);
        if (!snapshot.exists()) return [];
        
        const history: ChatSession[] = [];
        const chats = snapshot.val();
        for (const id in chats) {
            history.push({ id, ...chats[id] });
        }
        return history.sort((a, b) => b.timestamp - a.timestamp);
    },
    generateTitle: (messages: Message[]): string => {
        const firstUserMessage = messages.find(m => m.role === 'user');
        if (!firstUserMessage) return 'New Chat';
        return firstUserMessage.text.split(' ').slice(0, 5).join(' ') + '...';
    },
    saveChatSession: async (userId: string, messages: Message[], existingId: string | null) => {
        if (!userId || messages.length <= 1) return { sessionId: existingId };
        let sessionId = existingId;
        if (sessionId) {
            const sessionRef = ref(db, `users/${userId}/chats/${sessionId}`);
            await update(sessionRef, {
                messages,
                timestamp: serverTimestamp(),
            });
        } else {
            const chatsRef = ref(db, `users/${userId}/chats`);
            const newSessionRef = push(chatsRef);
            sessionId = newSessionRef.key;
            if (!sessionId) throw new Error("Failed to create new chat session.");
            
            const title = chatHistoryService.generateTitle(messages);
            await set(newSessionRef, {
                title,
                timestamp: serverTimestamp(),
                messages,
            });
        }
        return { sessionId };
    }
};

// --- EVALUATION SERVICE (REALTIME DB) ---
export const evaluationService = {
  saveRankResult: async (userId: string, data: { jobRole: string; field: string; result: RankResumeOutput }) => {
    if (!userId) throw new Error("User not authenticated.");
    const evalsRef = ref(db, `users/${userId}/resumeEvaluations`);
    const newEvalRef = push(evalsRef);
    await set(newEvalRef, {
      type: 'rank',
      ...data,
      createdAt: serverTimestamp(),
    });
  },
  saveRoastResult: async (userId: string, data: { jobRole: string; field: string; result: RoastResumeOutput }) => {
    if (!userId) throw new Error("User not authenticated.");
    const evalsRef = ref(db, `users/${userId}/resumeEvaluations`);
    const newEvalRef = push(evalsRef);
    await set(newEvalRef, {
      type: 'roast',
      ...data,
      createdAt: serverTimestamp(),
    });
  },
  saveInterview: async (userId: string, data: { jobRole: string; field: string; difficulty: string; evaluation: InterviewEvaluation, history: any[] }) => {
    if (!userId) throw new Error("User not authenticated.");
    const interviewsRef = ref(db, `users/${userId}/mockInterviews`);
    const newInterviewRef = push(interviewsRef);
    await set(newInterviewRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
  },
  saveSkillAssessment: async (userId: string, analysis: { scores: any; chosenRole: string; roadmap: any; }) => {
    if (!userId) throw new Error("User not authenticated.");
    const assessmentsRef = ref(db, `users/${userId}/skillAssessments`);
    const newAssessmentRef = push(assessmentsRef);
    await set(newAssessmentRef, {
      ...analysis,
      createdAt: serverTimestamp(),
    });
  },
  getEvaluations: async (userId: string) => {
    if (!userId) return { skillAssessments: [], resumeReviews: [], mockInterviews: [] };
    
    const dbRef = ref(db, `users/${userId}`);
    const snapshot = await get(dbRef);
    if (!snapshot.exists()) return { skillAssessments: [], resumeReviews: [], mockInterviews: [] };

    const data = snapshot.val();
    
    const formatData = (obj: any) => obj ? Object.values(obj).sort((a: any, b: any) => b.createdAt - a.createdAt) : [];

    return {
      skillAssessments: formatData(data.skillAssessments),
      resumeReviews: formatData(data.resumeEvaluations),
      mockInterviews: formatData(data.mockInterviews),
    };
  }
};