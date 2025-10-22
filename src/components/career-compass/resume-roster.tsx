
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function ResumeRoster() {
  return (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <Users className="h-5 w-5" />
                Resume Roster
            </CardTitle>
            <CardDescription>
                This feature is coming soon. It will allow you to manage and compare different versions of your resume.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center text-muted-foreground py-12">
                <p>Check back later for updates!</p>
            </div>
        </CardContent>
    </Card>
  );
}
