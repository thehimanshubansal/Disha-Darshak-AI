
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2 } from "lucide-react";

const initialPosts = [
  {
    id: 1,
    author: { name: "Anjali Sharma", handle: "anjalitech", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d" },
    content: "Just landed a Senior ML Engineer role at a FAANG company! ✨ Over the moon! The grind of the past 5 years has been intense but so worth it. Happy to share my interview prep strategies if anyone is interested. #machinelearning #careergoals",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8b2ZmaWNlJTIwdGVhbXxlbnwwfHwwfHx8MA%3D%3D",
    "data-ai-hint": "office team",
    stats: { likes: 125, comments: 42, shares: 18 },
    timestamp: "2h ago",
    liked: false,
  },
  {
    id: 2,
    author: { name: "Rohan Verma", handle: "rohanv", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704e" },
    content: "Debating between specializing in cybersecurity or cloud computing for my next career move. Both fields are booming in India right now. What are your thoughts? Pros and cons? 🤔 #cybersecurity #cloud #careeradvice",
    image: null,
    stats: { likes: 88, comments: 61, shares: 5 },
    timestamp: "5h ago",
    liked: false,
  },
  {
    id: 3,
    author: { name: "Priya Singh", handle: "priyadesigns", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704f" },
    content: "Excited to share my latest UI/UX portfolio piece! Reimagined the user flow for a popular e-commerce app. A lot of late nights and Figma magic went into this one. Feedback is welcome! 👇 #uiux #design #portfolio",
    image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8ZGVzaWdufGVufDB8fDB8fHww",
    "data-ai-hint": "design",
    stats: { likes: 234, comments: 78, shares: 32 },
    timestamp: "1d ago",
    liked: false,
  },
];

export default function ExplorePage() {
  const [posts, setPosts] = useState(initialPosts);

  const handleLike = (postId: number) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        const liked = !p.liked;
        const likes = liked ? p.stats.likes + 1 : p.stats.likes - 1;
        return { ...p, liked, stats: { ...p.stats, likes } };
      }
      return p;
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        {posts.map((post) => (
            <Card key={post.id} className="shadow-sm">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={post.author.avatar} />
                            <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-semibold">{post.author.name}</div>
                            <div className="text-sm text-muted-foreground">@{post.author.handle} &middot; {post.timestamp}</div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                    {post.image && (
                        <div className="mt-4 relative aspect-video rounded-lg overflow-hidden border">
                            <Image src={post.image} alt="Post image" fill className="object-cover" data-ai-hint={post['data-ai-hint']}/>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex items-center justify-between text-muted-foreground text-sm border-t pt-4">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => handleLike(post.id)}>
                        <Heart className={`h-4 w-4 ${post.liked ? 'text-red-500 fill-current' : ''}`} /> {post.stats.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" /> {post.stats.comments}
                    </Button>
                     <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <Share2 className="h-4 w-4" /> {post.stats.shares}
                    </Button>
                </CardFooter>
            </Card>
        ))}
    </div>
  );
}
