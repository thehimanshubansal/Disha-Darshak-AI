
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Conversation History</h1>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Past Chats
                </CardTitle>
                <CardDescription>
                    This feature is coming soon. It will allow you to review your past conversations with the AI assistants.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center text-muted-foreground py-12">
                    <p>Check back later for updates!</p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
