
'use client';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuickTileProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  imageUrl: string;
  onClick: () => void;
  'data-ai-hint': string;
  layout?: 'image-left' | 'image-right';
}

export default function QuickTile({ 
  title, 
  description, 
  icon, 
  imageUrl, 
  onClick, 
  'data-ai-hint': dataAiHint,
  layout = 'image-right' // Default to image-right
}: QuickTileProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -5, boxShadow: "0 10px 25px -5px hsla(var(--primary) / 0.1), 0 8px 10px -6px hsla(var(--primary) / 0.1)" }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full h-full rounded-2xl border bg-card text-left shadow-sm transition-shadow overflow-hidden group",
        "flex flex-col md:flex-row items-stretch",
        layout === 'image-left' && "md:flex-row-reverse"
      )}
    >
      <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3 text-primary shrink-0">{icon}</div>
          <div className="font-headline font-semibold text-xl">{title}</div>
        </div>
        <p className="text-base text-muted-foreground mt-4 flex-grow">{description}</p>
      </div>

      <div className="md:w-1/2 relative min-h-[200px] md:min-h-0">
        <Image 
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          data-ai-hint={dataAiHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent md:bg-none" />
      </div>
    </motion.button>
  );
}
