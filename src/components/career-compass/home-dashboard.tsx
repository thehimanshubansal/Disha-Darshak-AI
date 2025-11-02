'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TrendingNewsWidget from "./trending-news-widget";
import QuickTile from "./quick-tile";
import { Bot, FileText, LineChart, Newspaper, RefreshCw, Workflow } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import JobTrendsChart from "./job-trends-chart";
import JustTheGist from "./just-the-gist";
import Typewriter from "./typewriter";
import QuickAccess from "./quick-access";

const MotionCard = motion(Card);

const staticChartData = [
  { name: 'Software Engineer', value: 200 },
  { name: 'Data Scientist', value: 240 },
  { name: 'Web Developer', value: 290 },
  { name: 'Product Manager', value: 320 },
  { name: 'Digital Marketer', value: 380 },
];

type NewsItem = {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  'data-ai-hint': string;
};

export default function HomeDashboard() {
  const { handleNavigate, authed, setShowLogin } = useAppContext();

  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [displayedNews, setDisplayedNews] = useState<NewsItem[]>([]);
  const [newsIndex, setNewsIndex] = useState(0);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  
  useEffect(() => {
    const fetchNews = async () => {
      setIsLoadingNews(true);
      try {
        const response = await fetch('/api/news'); // This is the crucial change
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        const data: NewsItem[] = await response.json();
        
        setAllNews(data);
        setDisplayedNews(data.slice(0, 3));
      } catch (error) {
        console.error("Failed to fetch news from internal API:", error);
        setAllNews([]);
        setDisplayedNews([]);
      } finally {
        setIsLoadingNews(false);
      }
    };
    fetchNews();
  }, []);


   const handleRefreshNews = () => {
    if (allNews.length === 0) return;
    
    // --- MODIFICATION: Logic to cycle through the news articles ---
    const nextIndex = newsIndex + 3;
    if (nextIndex >= allNews.length) {
      // If we've reached the end, loop back to the start
      setNewsIndex(0);
      setDisplayedNews(allNews.slice(0, 3));
    } else {
      setNewsIndex(nextIndex);
      setDisplayedNews(allNews.slice(nextIndex, nextIndex + 3));
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' }}
  };

  const quickTileItem = {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    viewport: { once: true, amount: 0.3 }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {!authed && (
        <motion.div 
          variants={itemVariants} 
          className="text-center py-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">
            Discover Your Perfect <Typewriter words={["Career", "Job", "Resume", "Interview", "Skill"]} />
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            Make smart decisions with our revolutionary AI enabled career guidance tools and expert career counsellors
          </p>
          <Button size="lg" onClick={() => authed ? handleNavigate('trends') : setShowLogin(true)}>Get Started</Button>
        </motion.div>
      )}

      {authed && (
        <motion.div variants={itemVariants}>
          <JustTheGist />
        </motion.div>
      )}
      
      {authed && (
        <motion.div variants={itemVariants}>
            <QuickAccess />
        </motion.div>
      )}

      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <MotionCard>
          <CardHeader>
            {/* --- MODIFICATION: Added refresh button and flex layout --- */}
            <div className="flex justify-between items-center">
              <CardTitle className="font-headline flex items-center gap-2"><Newspaper className="h-5 w-5" /> Trending News</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleRefreshNews} disabled={isLoadingNews}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* --- MODIFICATION: Pass news and loading state as props --- */}
            <TrendingNewsWidget items={displayedNews} loading={isLoadingNews} />
          </CardContent>
        </MotionCard>
        <motion.button 
          className="text-left"
          onClick={() => handleNavigate('trends')}
          whileHover={{ y: -5, boxShadow: "0 10px 25px -5px hsla(var(--primary) / 0.1), 0 8px 10px -6px hsla(var(--primary) / 0.1)" }}
          whileTap={{ scale: 0.98 }}
        >
          <MotionCard className="h-full">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><LineChart className="h-5 w-5" /> Job Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <JobTrendsChart data={staticChartData} />
              <p className="text-sm text-muted-foreground mt-4">
                Navigate the job market with confidence. Our Job Trends feature provides real-time insights into high-demand skills, salary benchmarks, and industry growth areas to help you stay ahead of the curve.
              </p>
            </CardContent>
          </MotionCard>
        </motion.button>
      </motion.div>

      <div className="space-y-8">
        
        <motion.div {...quickTileItem}>
          <QuickTile
            title="TorchMyResume"
            description="Optimize your resume for success. Get an instant, data-driven score on your resume and receive actionable, AI-powered suggestions to improve its quality, keyword alignment, and overall impact on recruiters."
            icon={<FileText className="h-6 w-6" />}
            imageUrl="https://images.unsplash.com/photo-1518893560155-b89cac6db0c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxkb2N1bWVudCUyMHJldmlld3xlbnwwfHx8fDE3NTYzMDExMzF8MA&ixlib=rb-4.1.0&q=80&w=1080"
            data-ai-hint="document review"
            layout="image-right"
            onClick={() => handleNavigate("ranker")}
          />
        </motion.div>
        <motion.div {...quickTileItem}>
          <QuickTile
            title="Mock Interview"
            description="Build interview confidence with our AI-powered Mock Interview platform. Practice common behavioral and technical questions, and receive instant, personalized feedback on your answers, delivery, and structure."
            icon={<Bot className="h-6 w-6" />}
            imageUrl="https://images.unsplash.com/photo-1641122164135-c58019a13863?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxjb252ZXJzYXRpb24lMjBhaXxlbnwwfHx8fDE3NTYzMDExMzF8MA&ixlib=rb-4.1.0&q=80&w=1080"
            data-ai-hint="conversation ai"
            layout="image-left"
            onClick={() => handleNavigate("mock")}
          />
        </motion.div>
        <motion.div {...quickTileItem}>
          <QuickTile
            title="Skill-set Finder"
            description="Chart your professional journey with AI-driven guidance. Our Path Finder analyzes your skills to discover personalized career paths, suggests next steps, and identifies the key skills you need to learn to achieve your goals."
            icon={<Workflow className="h-6 w-6" />}
            imageUrl="https://images.unsplash.com/photo-1509220676330-01891402eb14?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxjYXJlZXIlMjBwYXRofGVufDB8fHx8MTc1NjMwMTEzMHww&ixlib=rb-4.1.0&q=80&w=1080"
            data-ai-hint="career path"
            layout="image-right"
            onClick={() => handleNavigate("path")}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}