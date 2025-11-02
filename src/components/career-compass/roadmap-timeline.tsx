'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Rocket, Flag, Star, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface TimelineDetail {
    category: string;
    items: string[];
}

interface TimelineStep {
    duration: string;
    title: string;
    description: string;
    details: TimelineDetail[];
}

interface RoadmapTimelineProps {
    steps: TimelineStep[];
}

const icons = [Rocket, Star, Flag, Check];

// The inner card that is now collapsible
const TimelineCard = ({ step, index, isOpen, onToggle }: { step: TimelineStep; index: number; isOpen: boolean; onToggle: () => void; }) => {
    const Icon = icons[index % icons.length];
    return (
        <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
        >
            <div className={`relative ${index % 2 === 0 ? 'lg:mr-auto lg:pr-8' : 'lg:ml-auto lg:pl-8'}`}>
                <div className="absolute top-6 -translate-y-1/2 h-4 w-4 rounded-full bg-primary ring-4 ring-background z-10 hidden lg:block" style={index % 2 === 0 ? { right: '-8px' } : { left: '-8px' }}></div>
                
                <Collapsible open={isOpen} onOpenChange={onToggle}>
                    <CollapsibleTrigger className="w-full text-left p-6 group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 text-primary p-2 rounded-full">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-primary">{step.duration}</p>
                                    <h3 className="text-lg font-bold font-headline group-hover:text-primary transition-colors">{step.title}</h3>
                                </div>
                            </div>
                            <ChevronRight className={cn("h-6 w-6 text-muted-foreground transition-transform duration-300", isOpen && "rotate-90 text-primary")} />
                        </div>
                    </CollapsibleTrigger>
                    
                    <AnimatePresence initial={false}>
                        {isOpen && (
                            <CollapsibleContent asChild>
                                <motion.div
                                    initial="collapsed"
                                    animate="open"
                                    exit="collapsed"
                                    variants={{
                                        open: { opacity: 1, height: 'auto' },
                                        collapsed: { opacity: 0, height: 0 },
                                    }}
                                    transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                                    className="overflow-hidden"
                                >
                                    <div className="border-t px-6 pb-6 pt-4">
                                        <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
                                        {step.details.map((detail, i) => (
                                            <div key={i} className="mt-3">
                                                <h4 className="font-semibold text-sm mb-2">{detail.category}</h4>
                                                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                                    {detail.items.map((item, j) => <li key={j}>{item}</li>)}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </CollapsibleContent>
                        )}
                    </AnimatePresence>
                </Collapsible>
            </div>
        </motion.div>
    );
};

// The main timeline container
export default function RoadmapTimeline({ steps }: RoadmapTimelineProps) {
    // State to manage which accordions are open. Initialize with an empty array.
    const [openSteps, setOpenSteps] = useState<string[]>([]);

    const handleToggle = (duration: string) => {
        setOpenSteps(prev => 
            prev.includes(duration)
                ? prev.filter(d => d !== duration) // If already open, close it
                : [...prev, duration]                // If closed, open it
        );
    };

    return (
        <div className="relative w-full max-w-4xl mx-auto py-8">
            <div className="absolute top-0 bottom-0 left-4 w-1 lg:left-1/2 lg:-translate-x-1/2 bg-gradient-to-b from-primary via-accent to-primary/50 rounded-full" />
            <div className="space-y-12">
                {steps.map((step, index) => (
                    <div key={index} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'} w-full`}>
                        <TimelineCard 
                            step={step} 
                            index={index}
                            isOpen={openSteps.includes(step.duration)} // Check if this step's duration is in the openSteps array
                            onToggle={() => handleToggle(step.duration)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}