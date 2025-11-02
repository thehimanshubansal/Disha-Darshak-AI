'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppContext } from '@/contexts/app-context';
import Header from './header';
import Sidebar from './sidebar';
import MobileSidebar from './mobile-sidebar';
import LoginDialog from './login-dialog';
import ProfileCompletionDialog from './ProfileCompletionDialog';
import GatePlaceholder from './gate-placeholder';
import HomeDashboard from './home-dashboard';
import JobTrends from './job-trends';
import ResumeRanker from './resume-ranker';
import MockInterview from './mock-interview';
import PathFinder from './path-finder';
import SettingsPage from './settings-page';
import TwinklingStars from './twinkling-stars';
import CommunityPage from './community-page';
import Footer from './footer';
import DDTalksPage from './dd-talks-page';
import ChatPage from './chat-page';
import ProfilePage from './profile-page';
import { cn } from '@/lib/utils';

export default function CareerCompassLayout() {
  const { activeRoute, authed, showLogin, showProfileCompletion, isInterviewActive } = useAppContext();
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(true);  
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
        {!isInterviewActive && (
          <Header
            desktopSidebarCollapsed={desktopSidebarCollapsed}
            onToggleDesktopSidebar={() => setDesktopSidebarCollapsed((c) => !c)}
          />
        )}

        <div className={cn("flex", isInterviewActive ? "h-screen" : "h-[calc(100vh-69px)]")}>
          {!isInterviewActive && authed && (
            <>
              <Sidebar collapsed={desktopSidebarCollapsed} />
              <MobileSidebar />
            </>
          )}

          <main className={cn(
              "flex-1 relative", 
              !isInterviewActive && "p-4 md:p-6 space-y-6 overflow-y-auto"
            )}>
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
            {!isInterviewActive && activeRoute === 'home' && <Footer />}
          </main>
        </div>
      </div>

      <AnimatePresence>
        {showLogin && <LoginDialog />}
        {showProfileCompletion && <ProfileCompletionDialog />}
      </AnimatePresence>
    </>
  );
}