'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ChatbotWidget from "./chatbot-widget";
import { MessagesSquare } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import { resumeService } from "@/lib/services";
import ChatHistoryPanel from "./chat-history-panel";

export default function ChatPage() {
    const { authed } = useAppContext();
    const hasResume = resumeService.hasResume();
    
    // This state now controls which chat is active.
    // null means it's a new chat.
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

    return (
        <div className="space-y-6">
             <h1 className="text-2xl md:text-3xl font-bold font-headline text-center">Career Chat</h1>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 font-headline">
                            <MessagesSquare className="h-5 w-5" />
                            AI Career Advisor
                        </CardTitle>
                        <CardDescription>
                            Ask me anything about career paths, resume improvements, or interview tips. 
                            {authed && hasResume && " I'll use your saved resume to give you personalized advice."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChatbotWidget 
                            resumeAware={authed && hasResume} 
                            className="border-none p-0 h-[500px]"
                            activeSessionId={activeSessionId}
                            onSessionChange={setActiveSessionId}
                        />
                    </CardContent>
                </Card>
                <ChatHistoryPanel 
                    activeSessionId={activeSessionId}
                    onSelectChat={setActiveSessionId}
                />
             </div>
        </div>
    )
}