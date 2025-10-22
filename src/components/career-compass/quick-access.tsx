
'use client';

import { Bot, FileText, MessagesSquare, Workflow } from "lucide-react";
import { Card } from "../ui/card";
import { useAppContext } from "@/contexts/app-context";
import { motion } from "framer-motion";

const tools = [
    { name: 'Chat', icon: MessagesSquare, route: 'chat' },
    { name: 'TorchMyResume', icon: FileText, route: 'ranker' },
    { name: 'Mock Interview', icon: Bot, route: 'mock' },
    { name: 'Skill-set Finder', icon: Workflow, route: 'path' }
];

const containerVariants = {
    show: {
      transition: {
        staggerChildren: 0.1
      }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
};

export default function QuickAccess() {
    const { handleNavigate } = useAppContext();

    return (
        <Card className="shadow-sm">
            <motion.div 
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                {tools.map(tool => {
                    const Icon = tool.icon;
                    return (
                        <motion.button
                            key={tool.name}
                            onClick={() => handleNavigate(tool.route)}
                            className="flex flex-col items-center gap-2 text-center text-muted-foreground hover:text-primary transition-colors group"
                            variants={itemVariants}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center border-2 border-transparent group-hover:border-primary group-hover:bg-primary/10 transition-all">
                                <Icon className="h-8 w-8 text-primary/80 group-hover:text-primary transition-colors" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{tool.name}</span>
                        </motion.button>
                    )
                })}
            </motion.div>
        </Card>
    );
}
