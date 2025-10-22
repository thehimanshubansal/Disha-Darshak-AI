
'use client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function LoginStatus({ name, avatar }: { name: string; avatar?: string | null }) {
    return (
        <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
                <AvatarImage src={avatar || undefined} alt={name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-sm">
                <div className="font-semibold leading-tight">{name}</div>
                <div className="text-xs text-muted-foreground -mt-0.5">Logged in</div>
            </div>
        </div>
    );
}
