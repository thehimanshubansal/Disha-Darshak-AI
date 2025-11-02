'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SkillAssessmentForm from './skill-assessment-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { useAppContext } from '@/contexts/app-context';

export default function PathFinder() {
  const { skillAssessmentState, handleClearAssessmentState } = useAppContext();
  const [showStartScreen, setShowStartScreen] = useState(!skillAssessmentState.isFinished);

  const handleStart = () => {
    handleClearAssessmentState();
    setShowStartScreen(false);
  }

  const panelVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const StartScreen = () => (
    <motion.div
      key="start"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-2xl md:text-3xl font-bold font-headline text-center mb-2">AI Skill Set Finder</h1>
      <Card className="max-w-3xl mx-auto shadow-sm text-center mb-8">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm  mb-4">
            Chart your professional journey with AI-driven guidance.
            Our Skill Set Finder analyzes your unique strengths, interests, and aspirations to uncover personalized career paths tailored just for you.
          </p>
          <ul className="text-sm mb-6 list-disc list-inside space-y-1 text-left">
            <li><em>"Roles"</em> that align with your skills and passions</li>
            <li><em>"Career Path Suggestions"</em> that fit your goals and lifestyle</li>
            <li><em>"Actionable Next Steps"</em> to build the right expertise and stay future-ready</li>
          </ul>
          <p className="text-sm ">
            Whether you’re exploring your options, planning your next big move, or curious about new opportunities, Skill Set Finder is your <strong>personal career compass</strong>—helping you learn, grow, and achieve your ambitions with clarity and confidence.
          </p>
        </CardContent>
      </Card>

      <Card className="max-w-3xl mx-auto shadow-sm text-center">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Start Your Skill Assessment</CardTitle>
          <CardDescription>(Answer a few questions to receive personalized career path suggestions.)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            This quick assessment will help us understand your skills, interests, and career motivations. Your responses will be used to generate tailored recommendations to guide your professional journey.
          </p>
          <Button onClick={handleStart} size="lg">
            Start Assessment <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6"> 
      <AnimatePresence mode="wait">
        {showStartScreen ? (
          <StartScreen />
        ) : (
          <motion.div
            key="assessment"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <SkillAssessmentForm />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}