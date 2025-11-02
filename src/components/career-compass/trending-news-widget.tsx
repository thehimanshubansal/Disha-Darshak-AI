'use client';
import { Skeleton } from '@/components/ui/skeleton';


type NewsItem = {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  'data-ai-hint': string;
};


interface TrendingNewsWidgetProps {
  items: NewsItem[];
  loading: boolean;
}

export default function TrendingNewsWidget({ items, loading }: TrendingNewsWidgetProps) {

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-20 w-28 rounded-md" />
            <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>Could not load trending news at the moment.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((n, i) => (
        <li
          key={i}
          className="transition-colors hover:bg-muted/50 rounded-lg -m-3 p-3"
        >
          <a 
            href={n.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex gap-4 items-center group"
          >
            <div className="relative w-28 h-20 rounded-md overflow-hidden shrink-0">
                <img
                    src={n.imageUrl}
                    alt={n.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint={n['data-ai-hint']}
                    loading="lazy"
                />
            </div>
            <div className='flex-1'>
                <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{n.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 mb-2">{n.description}</p>
                <span className="text-xs font-semibold text-primary group-hover:underline">
                    Read More
                </span>
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}