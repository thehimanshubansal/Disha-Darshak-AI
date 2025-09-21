'use client';
import CareerCompassLayout from "@/components/career-compass/career-compass-layout";
import PageLoader from "@/components/career-compass/page-loader";
import { useEffect, useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // Simulate a loading delay

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  return (
    <CareerCompassLayout />
  );
}
