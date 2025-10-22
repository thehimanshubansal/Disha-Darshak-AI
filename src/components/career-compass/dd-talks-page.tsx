
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Newspaper, PlayCircle, Quote } from "lucide-react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const successStories = [
  {
    title: "Software Engineer (IT Services → Product Company Switch)",
    story: "I graduated from a tier-3 college in 2021 with a Computer Science degree. My first job was in a service-based company where I worked mostly on support projects. I wasn’t satisfied, so I spent weekends learning DSA and system design, while building side projects on GitHub. After 18 months, I cracked interviews at a mid-tier product company. My advice: even if you start small, keep learning—don’t let your first job define your ceiling.",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y29kaW5nfGVufDB8fDB8fHww",
    "data-ai-hint": "coding laptop"
  },
  {
    title: "Data Scientist (Non-CS Background → DS Role)",
    story: "I did my B.Tech in Mechanical Engineering from a tier-2 institute. During college, I developed interest in data analytics, so I learned Python, SQL, and ML basics from free resources and Kaggle competitions. I did an unpaid internship with a startup in my 3rd year where I worked on predictive models. That experience helped me land a junior data analyst role after graduation, and now I’m working as a Data Scientist. Non-CS students can switch fields, but consistency is key.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZGF0YSUyMGFuYWx5c2lzfGVufDB8fDB8fHww",
    "data-ai-hint": "data analysis"
  },
  {
    title: "Research / Higher Studies (Tier-3 → Foreign Masters)",
    story: "I was from a tier-3 college with very little research exposure. I wanted to pursue higher studies abroad, so I cold-emailed professors, worked on two small research projects with my college faculty, and published one paper at a local conference. Alongside, I prepared for GRE/IELTS. My profile wasn’t stellar, but my Statement of Purpose highlighted my curiosity and projects. I got admits from two European universities. Don’t underestimate yourself just because of your college tag.",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fHN0dWR5aW5nfGVufDB8fDB8fHww",
    "data-ai-hint": "studying group"
  },
  {
    title: "Entrepreneurship (Startup from Tier-2 College)",
    story: "In my final year at a tier-2 engineering college, I started a small ed-tech platform with a batchmate. We had no funding, just built an MVP using no-code tools. We pitched at a student startup competition and got incubation support from our college. Though our first startup failed after a year, I learned more from that than from any internship. Now I’m working on a new idea while doing a part-time job. Startup exposure is possible even without an IIT/IIM background.",
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c3RhcnR1cHxlbnwwfHwwfHx8MA%3D%3D",
    "data-ai-hint": "startup meeting"
  },
  {
    title: "Design / Creative Career (Non-traditional Path)",
    story: "I studied Electrical Engineering in a tier-3 college but always had a passion for UI/UX design. During college, I took freelance gigs on Fiverr and Behance. My portfolio mattered much more than my degree. After graduation, I joined a mid-level design agency, and now I work remotely for an international startup. My takeaway: in creative fields, your work speaks louder than your college name.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8ZGVzaWduZXJ8ZW58MHx8MHx8fDA%3D",
    "data-ai-hint": "designer portfolio"
  },
];

const podcasts = [
    {
      title: "The Future of AI in Software Development",
      guest: "with guest speaker Priya Sharma",
      duration: "45:18",
      image: "https://images.unsplash.com/photo-1590602847834-35b1b1014455?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHBvZGNhc3R8ZW58MHx8MHx8fDA%3D",
      "data-ai-hint": "podcast studio"
    },
    {
      title: "Building a Scalable Startup",
      guest: "with entrepreneur Rohan Mehta",
      duration: "52:30",
      image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8c3RhcnR1cCUyMG1lZXRpbmd8ZW58MHx8MHx8fDA%3D",
      "data-ai-hint": "startup meeting"
    },
    {
      title: "Mastering the Art of UI/UX Design",
      guest: "with design lead Anika Gupta",
      duration: "38:12",
      image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8ZGVzaWdufGVufDB8fDB8fHww",
      "data-ai-hint": "design"
    },
];

export default function DDTalksPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">Disha Talks</h1>
          <p className="text-muted-foreground">Expert insights on career growth, industry trends, and more.</p>
        </div>
      </div>
      
      <Tabs defaultValue="podcast" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="podcast">
            <Mic className="h-4 w-4 mr-2" />
            Podcast
          </TabsTrigger>
          <TabsTrigger value="article">
            <Newspaper className="h-4 w-4 mr-2" />
            Articles
          </TabsTrigger>
        </TabsList>
        <TabsContent value="podcast">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {podcasts.map((item, index) => (
                     <Card key={index} className="shadow-sm flex flex-col">
                        <CardContent className="p-0">
                            <div className="relative aspect-video rounded-t-xl overflow-hidden bg-muted flex items-center justify-center">
                                <Image 
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                    data-ai-hint={item['data-ai-hint']}
                                />
                                <div className="absolute inset-0 bg-black/40" />
                                <div className="relative text-center text-white p-4 flex flex-col items-center justify-center h-full">
                                    <h3 className="font-bold text-lg">{item.title}</h3>
                                    <p className="text-xs opacity-90 mt-1">{item.guest}</p>
                                    <Button variant="secondary" size="sm" className="mt-4 rounded-full">
                                        <PlayCircle className="mr-2 h-4 w-4"/> Play ({item.duration})
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </TabsContent>
        <TabsContent value="article">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {successStories.map((item, index) => (
                    <Card key={index} className="shadow-sm flex flex-col">
                        <CardHeader>
                            <div className="relative w-full h-40 rounded-lg overflow-hidden border">
                                <Image src={item.image} alt={item.title} fill className="object-cover" data-ai-hint={item['data-ai-hint']}/>
                            </div>
                            <CardTitle className="font-headline text-lg mt-4">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <blockquote className="text-sm text-muted-foreground border-l-2 border-primary pl-4 italic">
                                {item.story}
                            </blockquote>
                        </CardContent>
                    </Card>
                ))}
             </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
