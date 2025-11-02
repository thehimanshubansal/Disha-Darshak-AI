'use client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogIn, LogOut, Menu, PanelLeftClose, PanelLeftOpen, User, UserPlus, Users } from 'lucide-react'; // Add User icon
import LoginStatus from './login-status';
import { useAppContext } from '@/contexts/app-context';
import ThemeToggle from './theme-toggle';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

interface HeaderProps {
  onToggleDesktopSidebar: () => void;
  desktopSidebarCollapsed: boolean;
}

export default function Header({ onToggleDesktopSidebar, desktopSidebarCollapsed }: HeaderProps) {
  const { authed, user, setShowLogin, setLoginView, handleLogout, setIsMobileMenuOpen, handleNavigate } = useAppContext();

  const openLogin = () => {
    setLoginView('login');
    setShowLogin(true);
  }

  const openSignUp = () => {
    setLoginView('signup');
    setShowLogin(true);
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-background/50 backdrop-blur-lg px-4 md:px-6 py-3 h-[69px]">
      <div className="flex items-center gap-3">
        {authed && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex"
              onClick={onToggleDesktopSidebar}
            >
              {desktopSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </Button>
          </>
        )}

        <button onClick={() => handleNavigate('home')} className="font-headline font-bold tracking-tight text-xl md:text-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
          <span className="text-foreground">Disha</span>
          <span className="text-primary">Darshak</span>
          <span className="text-foreground"> AI</span>
        </button>
        <Badge className="hidden lg:inline-flex" variant="secondary">
          Personalized Career Advisor
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        {authed && (
            <Button variant="ghost" size="icon" onClick={() => handleNavigate('community')}>
                <Users className="h-5 w-5" />
            </Button>
        )}

        {authed && user ? (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className='flex items-center gap-2 outline-none'>
                        <LoginStatus name={user.name} avatar={user.avatar} />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* Added a menu item to navigate to the profile page. */}
                    <DropdownMenuItem onClick={() => handleNavigate('profile')}>
                        <User className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ) : (
            <div className="flex items-center gap-1 sm:gap-2">
                <Button size="sm" variant="outline" onClick={openLogin} className="px-2 sm:px-3">
                <LogIn className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
                </Button>
                <Button size="sm" onClick={openSignUp} className="px-2 sm:px-3">
                <UserPlus className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Sign Up</span>
                </Button>
            </div>
        )}
      </div>
    </header>
  );
}