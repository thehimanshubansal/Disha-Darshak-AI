
'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppContext } from '@/contexts/app-context';
import Header from './header';
import Sidebar from './sidebar';
import MobileSidebar from './mobile-sidebar';
import LoginDialog from './login-dialog';
import GatePlaceholder from './gate-placeholder';
import HomeDashboard from './home-dashboard';
import JobTrends from './job-trends';
import ResumeRanker from './resume-ranker';
import MockInterview from './mock-interview';
import PathFinder from './path-finder';
import SettingsPage from './settings-page';
import EditProfileDialog from './edit-profile-dialog';
import TwinklingStars from './twinkling-stars';
import CommunityPage from './community-page';
import HistoryPage from './history-page';
import Footer from './footer';
import DDTalksPage from './dd-talks-page';
import ChatPage from './chat-page';
import ProfilePage from './profile-page'; // Import the ProfilePage component

export default function CareerCompassLayout() {
  const { activeRoute, authed, showLogin, showEditProfile, handleNavigate } = useAppContext();
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);

  const gated = (component: React.ReactNode) => (authed ? component : <GatePlaceholder />);

  const componentMap: { [key: string]: React.ReactNode } = {
    home: <HomeDashboard />,
    trends: gated(<JobTrends />),
    ranker: gated(<ResumeRanker />),
    mock: gated(<MockInterview />),
    path: gated(<PathFinder />),
    community: gated(<CommunityPage />),
    'dd-talks': gated(<DDTalksPage />),
    chat: gated(<ChatPage />),
    profile: gated(<ProfilePage />),
    settings: gated(<SettingsPage />),
    history: gated(<HistoryPage />),
  };
  
  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.2, ease: "easeIn" } },
  };

  return (
    <>
      <TwinklingStars />
      <div className="h-screen w-full text-foreground font-body relative flex flex-col">
        <Header
          desktopSidebarCollapsed={desktopSidebarCollapsed}
          onToggleDesktopSidebar={() => setDesktopSidebarCollapsed((c) => !c)}
        />

        <div className="flex h-[calc(100vh-69px)]">
          {authed && (
            <>
              <Sidebar collapsed={desktopSidebarCollapsed} />
              <MobileSidebar />
            </>
          )}

          <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeRoute}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {componentMap[activeRoute] || <HomeDashboard />}
              </motion.div>
            </AnimatePresence>
            {activeRoute === 'home' && <Footer />}
          </main>
        </div>

        <AnimatePresence>{showLogin && <LoginDialog />}</AnimatePresence>
        <AnimatePresence>{showEditProfile && <EditProfileDialog />}</AnimatePresence>
      </div>
    </>
  );
}
