'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { History, PlusCircle, Search } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatHistoryPanelProps {
    activeSessionId: string | null;
    onSelectChat: (id: string | null) => void;
}

export default function ChatHistoryPanel({ activeSessionId, onSelectChat }: ChatHistoryPanelProps) {
  const { chatHistory } = useAppContext();

  return (
    <Card className="hidden lg:block">
        <CardHeader>
            <CardTitle className="font-headline flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Chat History
                </div>
                <Button size="sm" variant="ghost" onClick={() => onSelectChat(null)}>
                    <PlusCircle className="h-4 w-4 mr-2"/> New Chat
                </Button>
            </CardTitle>
            <div className="relative pt-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search history..." className="pl-8" />
            </div>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[400px]">
                {chatHistory.length > 0 ? (
                    <div className="space-y-2">
                        {chatHistory.map(session => (
                            <button 
                                key={session.id} 
                                onClick={() => onSelectChat(session.id)}
                                className={cn(
                                    "w-full text-left p-2 rounded-md transition-colors",
                                    activeSessionId === session.id 
                                        ? "bg-primary/10 text-primary" 
                                        : "hover:bg-muted"
                                )}
                            >
                                <p className="text-sm font-medium truncate">{session.title}</p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(session.timestamp).toLocaleDateString()}
                                </p>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg">
                        <p className="text-sm">No conversations yet.</p>
                    </div>
                )}
            </ScrollArea>
        </CardContent>
    </Card>
  );
}