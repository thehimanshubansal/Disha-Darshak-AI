
'use client';
import { useAppContext } from '@/contexts/app-context';

export default function AppRoot({ children }: { children: React.ReactNode }) {
  const { theme } = useAppContext();
  return <div className={theme}>{children}</div>;
}
  
