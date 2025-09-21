import { Home, LineChart, FileText, Bot, Workflow, Settings, Users, Mic, MessagesSquare, User } from 'lucide-react'; // Add User icon

export const LS_KEYS = {
  token: 'ccai_token',
  resume: 'ccai_resume_text',
  user: 'ccai_user_name',
  avatar: 'ccai_user_avatar',
  email: 'ccai_email',
  chatHistory: 'ccai_chat_history', // New key
};

const mainNav = {
  key: 'main',
  label: '',
  items: [{ key: 'home', label: 'Home', icon: Home, auth: false }],
};

const exploreNav = {
  key: 'explore',
  label: 'Explore',
  items: [
    { key: 'trends', label: 'Job Trends', icon: LineChart, auth: true },
    { key: 'community', label: 'Community', icon: Users, auth: true },
  ],
};

const ddTalksNav = {
  key: 'dd-talks',
  label: '',
  items: [
    { key: 'dd-talks', label: 'Disha Talks', icon: Mic, auth: true },
  ],
};

const toolsNav = {
  key: 'tools',
  label: 'Tools',
  items: [
    { key: 'ranker', label: 'TorchMyResume', icon: FileText, auth: true },
    { key: 'mock', label: 'Mock Interview', icon: Bot, auth: true },
    { key: 'path', label: 'Skill-set Finder', icon: Workflow, auth: true },
    { key: 'chat', label: 'Chat', icon: MessagesSquare, auth: true },
  ],
};

// Added a 'Profile' item to the account navigation group.
const accountNav = {
  key: 'account',
  label: 'Account',
  items: [
    { key: 'profile', label: 'Profile', icon: User, auth: true },
    { key: 'settings', label: 'Settings', icon: Settings, auth: true },
  ],
};

export const navGroups = [mainNav, exploreNav, ddTalksNav, toolsNav, accountNav];

export const navItems = [...mainNav.items, ...exploreNav.items, ...ddTalksNav.items, ...toolsNav.items, ...accountNav.items];