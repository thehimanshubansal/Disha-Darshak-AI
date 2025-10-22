import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Settings</h1>
        <Card className="shadow-sm max-w-2xl">
        <CardHeader>
            <CardTitle className="font-headline">Developer Configuration</CardTitle>
            <CardDescription>
                This is a under construction.
            </CardDescription>
        </CardHeader>
        </Card>
    </div>
  );
}
