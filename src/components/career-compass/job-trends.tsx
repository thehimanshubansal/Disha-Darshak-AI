'use client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '../ui/skeleton';
import { useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery'; // <-- 1. IMPORT YOUR NEW HOOK

// 2. PASTE BOTH OF YOUR EMBED URLS HERE
const LOOKER_STUDIO_DESKTOP_URL = "https://lookerstudio.google.com/embed/reporting/9a76ac24-6502-4ed3-9835-7a732d80c47f/page/cY9cF";
const LOOKER_STUDIO_MOBILE_URL = "https://lookerstudio.google.com/embed/reporting/9a76ac24-6502-4ed3-9835-7a732d80c47f/page/p_7hcejuzpxd";

export default function JobTrends() {
  const [isLoading, setIsLoading] = useState(true);
  
  // 3. USE THE HOOK TO CHECK FOR MOBILE SCREEN SIZE
  // We use 768px as the breakpoint, which is a standard for tablets (md in Tailwind CSS)
  const isMobile = useMediaQuery("(max-width: 768px)");

  // 4. CHOOSE THE CORRECT URL BASED ON THE SCREEN SIZE
  const embedUrl = isMobile ? LOOKER_STUDIO_MOBILE_URL : LOOKER_STUDIO_DESKTOP_URL;

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
        <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold font-headline">Live Job Trends</h1>
        </div>

        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="font-headline">Live Job Market Dashboard (India)</CardTitle>
                <CardDescription>
                    This interactive dashboard is powered by the Adzuna API and Google Looker Studio. 
                    The data is automatically refreshed daily.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="relative w-full h-[80vh] min-h-[700px] border rounded-lg overflow-hidden">
                    {isLoading && (
                        <Skeleton className="absolute inset-0 w-full h-full" />
                    )}
                    {/* 5. THE IFRAME'S SRC IS NOW DYNAMIC */}
                    <iframe
                        key={embedUrl} // Adding a key forces the iframe to re-render when the URL changes
                        src={embedUrl}
                        title="Job Trends Dashboard"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: 0,
                        }}
                        allowFullScreen
                        onLoad={() => setIsLoading(false)}
                    ></iframe>
                </div>
            </CardContent>
        </Card>
    </motion.div>
  );
}