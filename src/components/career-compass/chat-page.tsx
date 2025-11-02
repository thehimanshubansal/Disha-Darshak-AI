'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ChatbotWidget from "./chatbot-widget";
import { MessagesSquare } from "lucide-react";
import ChatHistoryPanel from "./chat-history-panel";
import { useState } from "react";

export default function ChatPage() {
  // The ChatPage no longer needs to know about the evaluation context.
  // The ChatbotWidget will handle it internally. This simplifies the logic here.
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const handleSelectChat = (id: string | null) => {
    setActiveSessionId(id);
  };
  
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
              Click the ✨ button to get personalized advice based on your profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChatbotWidget 
              className="border-none p-0 h-[500px]"
              activeSessionId={activeSessionId}
              onSessionChange={handleSelectChat}
              // The widget will now get its own context, so we don't pass props for it.
            />
          </CardContent>
        </Card>
        <ChatHistoryPanel 
          activeSessionId={activeSessionId}
          onSelectChat={handleSelectChat}
        />
      </div>
    </div>
  );
}