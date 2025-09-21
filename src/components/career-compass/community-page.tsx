
'use client';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Image as ImageIcon, Globe, FileText, Save, CheckCircle, PlusCircle, Compass, User, Rss } from "lucide-react";
import { useAppContext } from '@/contexts/app-context';
import ExplorePage from './explore-page';
import FollowingFeed from './following-feed';
import ProfilePage from './profile-page';
import { cn } from '@/lib/utils';

export default function CommunityPage() {
  const { user } = useAppContext();
  const [postContent, setPostContent] = useState('');
  const [activeView, setActiveView] = useState<'explore' | 'following' | 'create' | 'profile'>('explore');
  const MAX_CHARS = 280;

  const CreatePostView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="w-full">
                <div className="font-semibold">{user?.name || 'User'}</div>
                <div className="text-sm text-muted-foreground">Full Stack Developer</div>
                <Textarea
                  placeholder="Share your professional insights..."
                  className="mt-2 min-h-[120px] border-none focus-visible:ring-0 p-0"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  maxLength={MAX_CHARS}
                />
              </div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Button variant="ghost" size="sm"><ImageIcon className="h-4 w-4 mr-2"/>Photo</Button>
                <Button variant="ghost" size="sm"><Globe className="h-4 w-4 mr-2"/>Public</Button>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {MAX_CHARS - postContent.length}
                </span>
                <Button disabled={!postContent.trim()}>Post</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-base font-semibold px-1">
                <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" /> Posting Guidelines
                </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground px-1">
              Be professional and respectful. Share content that is relevant to career growth and industry insights. Avoid spam and self-promotion that does not add value to the community.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        <Card className="text-center">
            <CardHeader>
                <CardTitle className="font-headline text-lg">Post Preview</CardTitle>
            </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mt-1">
              Start typing to see how your post will look.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex justify-between items-center">
              <span>Draft Manager</span>
              <span className="text-xs font-normal text-green-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Auto-save
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-semibold mt-2">No draft saved</p>
              <p className="text-xs text-muted-foreground mt-1">Start typing to auto-save your draft</p>
              <Button variant="outline" size="sm" className="mt-4 w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft Manually
              </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  
  const componentMap = {
    explore: <ExplorePage />,
    following: <FollowingFeed />,
    create: <CreatePostView />,
    profile: <ProfilePage />,
  }

  const DesktopNav = () => (
    <div className="hidden md:flex items-center gap-2 border-b">
        <Button 
          variant="ghost" 
          onClick={() => setActiveView('explore')}
          className={cn("rounded-none border-b-2", activeView === 'explore' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}
        >
          <Compass className="h-4 w-4 mr-2"/>
          Explore
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => setActiveView('following')}
          className={cn("rounded-none border-b-2", activeView === 'following' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}
        >
          <Rss className="h-4 w-4 mr-2"/>
          Following
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => setActiveView('create')}
          className={cn("rounded-none border-b-2", activeView === 'create' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}
        >
          <PlusCircle className="h-4 w-4 mr-2"/>
          Create Post
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => setActiveView('profile')}
          className={cn("rounded-none border-b-2 ml-auto", activeView === 'profile' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')}
        >
          <User className="h-4 w-4 mr-2"/>
          Profile
        </Button>
      </div>
  );

  const MobileNav = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-10">
      <div className="flex justify-around items-center h-16">
        <Button variant="ghost" onClick={() => setActiveView('explore')} className={cn("flex flex-col h-auto p-2", activeView === 'explore' ? 'text-primary' : 'text-muted-foreground')}>
          <Compass className="h-5 w-5" />
          <span className="text-xs">Explore</span>
        </Button>
        <Button variant="ghost" onClick={() => setActiveView('following')} className={cn("flex flex-col h-auto p-2", activeView === 'following' ? 'text-primary' : 'text-muted-foreground')}>
          <Rss className="h-5 w-5" />
          <span className="text-xs">Following</span>
        </Button>
        <Button variant="ghost" onClick={() => setActiveView('create')} className={cn("flex flex-col h-auto p-2", activeView === 'create' ? 'text-primary' : 'text-muted-foreground')}>
          <PlusCircle className="h-5 w-5" />
          <span className="text-xs">Post</span>
        </Button>
        <Button variant="ghost" onClick={() => setActiveView('profile')} className={cn("flex flex-col h-auto p-2", activeView === 'profile' ? 'text-primary' : 'text-muted-foreground')}>
          <User className="h-5 w-5" />
          <span className="text-xs">Profile</span>
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 pb-16 md:pb-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Community</h1>
        <p className="text-muted-foreground">Connect with peers and share your professional journey.</p>
      </div>

      <DesktopNav />
      <MobileNav />

      {componentMap[activeView]}
    </div>
  );
}
