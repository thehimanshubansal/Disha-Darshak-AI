
'use client';
import { LogIn, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/contexts/app-context';

export default function GatePlaceholder() {
  const { setShowLogin } = useAppContext();
  return (
    <div className="rounded-xl border p-8 text-center bg-card flex flex-col items-center justify-center h-full min-h-[400px]">
      <ShieldAlert className="h-12 w-12 text-primary mb-4" />
      <h3 className="text-xl font-headline font-semibold">Login Required</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        Sign in to access Job Trends, TorchMyResume, Mock Interview, and Skill-set Finder.
      </p>
      <Button className="mt-6" onClick={() => setShowLogin(true)}>
        <LogIn className="h-4 w-4 mr-2" /> Login
      </Button>
    </div>
  );
}
