// File: src/app/api/news/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
  // This code ONLY runs on the server
  const apiKey = process.env.GNEWS_API_KEY;

  if (!apiKey) {
    console.error("GNews API key is not configured on the server.");
    // Return a server error response
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  const query = encodeURIComponent('"career trends" OR "job market" OR "hiring" OR "employment"');
  const url = `https://gnews.io/api/v4/search?q=${query}&lang=en&country=in&max=15&token=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !data.articles) {
      console.error("GNews API request failed:", data);
      return NextResponse.json({ error: "Failed to fetch news." }, { status: 502 }); // Bad Gateway
    }

    const mappedData = data.articles.map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      imageUrl: article.image || 'https://picsum.photos/400/250',
      'data-ai-hint': article.title.split(' ')[0] || 'news',
    }));

    // Send the safe, public data to the client
    return NextResponse.json(mappedData);

  } catch (error) {
    console.error("Critical error fetching news from GNews API:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}