
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Rss } from "lucide-react";

const initialPosts = [
  {
    id: 1,
    author: { name: "Vikram Singh", handle: "vikramdev", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704a" },
    content: "Just published a new open-source library for simplifying state management in React. Would love for the community to check it out and contribute!",
    image: "https://images.unsplash.com/photo-1633356122102-3fe601e05590?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cmVhY3R8ZW58MHx8MHx8fDA%3D",
    "data-ai-hint": "react code",
    stats: { likes: 98, comments: 23, shares: 11 },
    timestamp: "8h ago",
    liked: false,
  },
  {
    id: 2,
    author: { name: "Sneha Reddy", handle: "snehacodes", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704b" },
    content: "Attending the national cybersecurity conference this week. The keynote on Zero Trust architecture was eye-opening. Anyone else here? Let's connect!",
    image: null,
    stats: { likes: 45, comments: 12, shares: 3 },
    timestamp: "1d ago",
    liked: false,
  }
];

export default function FollowingFeed() {
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
        {posts.length > 0 ? posts.map((post) => (
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
        )) : (
            <Card className="text-center py-12">
                <CardHeader>
                    <Rss className="h-10 w-10 mx-auto text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <h3 className="font-semibold">Your Feed is Quiet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Posts from people you follow will appear here.
                    </p>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
