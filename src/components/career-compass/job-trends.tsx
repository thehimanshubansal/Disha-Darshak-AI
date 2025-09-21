'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart as RBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Briefcase, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { fetchJobTrends } from '@/ai/flows/fetch-job-trends';
import { Skeleton } from '../ui/skeleton';

// Define the data type for the chart
interface ChartDataItem {
  name: string;
  value: number;
}

const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
];

export default function JobTrends() {
  const [data, setData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getJobTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchJobTrends({ countryCode: 'in', resultsPerPage: 10 });
      if (result.histogram) {
        const formattedData = Object.entries(result.histogram).map(([label, count]) => ({
          name: label,
          value: count,
        }));
        setData(formattedData);
      }
    } catch (e: any) {
      console.error(e);
      setError("Failed to fetch job trends. Please ensure your Adzuna API keys are correctly configured in the .env file.");
      setData([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getJobTrends();
  }, []);

  const handleRefresh = () => {
    getJobTrends();
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' }}
  };

  const renderChart = () => {
    if (loading) {
        return <Skeleton className="h-96 w-full" />;
    }
    if (error) {
        return (
            <div className="h-96 flex flex-col items-center justify-center text-center text-destructive">
                <AlertTriangle className="h-12 w-12 mb-4" />
                <h3 className="font-semibold">An Error Occurred</h3>
                <p className="text-sm max-w-md">{error}</p>
            </div>
        );
    }
    return (
        <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
                <RBarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="hsl(var(--muted-foreground))"
                        width={150} // Increased width for longer labels
                        tickLine={false}
                        axisLine={false}
                        tick={{ textAnchor: 'end' }}
                        fontSize={12}
                    />
                    <Tooltip 
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Bar>
                </RBarChart>
            </ResponsiveContainer>
        </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
        <motion.div variants={itemVariants} className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold font-headline">Live Job Trends</h1>
            <Button variant="ghost" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
        </motion.div>

        <motion.div variants={itemVariants}>
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="font-headline">Top Job Categories (IN)</CardTitle>
                    <CardDescription>Live data from the Adzuna API showing the distribution of job roles.</CardDescription>
                </CardHeader>
                <CardContent>
                    {renderChart()}
                </CardContent>
            </Card>
        </motion.div>

        <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
            {loading ? [...Array(6)].map((_, i) => (
                <motion.div key={i} variants={itemVariants}>
                    <Skeleton className="h-40 w-full" />
                </motion.div>
            )) : data.slice(0, 6).map((item, index) => (
                <motion.div key={index} variants={itemVariants}>
                    <Card className="shadow-sm h-full">
                        <CardHeader>
                            <CardTitle className="font-headline flex items-center gap-3">
                                <Briefcase className="h-6 w-6 text-primary" />
                                {item.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">{item.value.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">current job listings</p>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}
        </motion.div>
    </motion.div>
  );
}