'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the input schema for our flow
const JobTrendsInputSchema = z.object({
  countryCode: z.string().default('gb').describe('The country code (e.g., gb, us, in).'),
  resultsPerPage: z.number().default(10).describe('Number of top categories to fetch.'),
});
export type JobTrendsInput = z.infer<typeof JobTrendsInputSchema>;

// Define the output schema based on Adzuna's histogram response
const JobTrendsOutputSchema = z.object({
    histogram: z.record(z.string(), z.number()).describe("A map of job categories to their counts."),
});
export type JobTrendsOutput = z.infer<typeof JobTrendsOutputSchema>;

// The actual flow that calls the Adzuna API
export const fetchJobTrends = ai.defineFlow(
  {
    name: 'fetchJobTrends',
    inputSchema: JobTrendsInputSchema,
    outputSchema: JobTrendsOutputSchema,
  },
  async (input) => {
    const appId = "915a9063";
    const apiKey = "80dab6bc9363cf3791ef4541812660bf";

    if (!appId || !apiKey) {
      throw new Error('Adzuna API credentials are not set in environment variables.');
    }

    try {
      // Step 1: Fetch the list of available job categories
      const categoriesUrl = `https://api.adzuna.com/v1/api/jobs/${input.countryCode}/categories?app_id=${appId}&app_key=${apiKey}&content-type=application/json`;
      const categoriesResponse = await fetch(categoriesUrl);
      if (!categoriesResponse.ok) {
        throw new Error(`Adzuna categories API request failed with status: ${categoriesResponse.status}`);
      }
      const categoriesData = await categoriesResponse.json();
      const categories = categoriesData.results || [];

      // Step 2: For each category, fetch the job count in parallel
      const categoryCountsPromises = categories.map(async (category: { tag: string; label: string }) => {
        const searchUrl = new URL(`https://api.adzuna.com/v1/api/jobs/${input.countryCode}/search/1`);
        searchUrl.searchParams.append('app_id', appId);
        searchUrl.searchParams.append('app_key', apiKey);
        searchUrl.searchParams.append('results_per_page', '0'); // We only need the count, not the jobs
        searchUrl.searchParams.append('category', category.tag);
        searchUrl.searchParams.append('content-type', 'application/json');
        
        const searchResponse = await fetch(searchUrl.toString());
        if (!searchResponse.ok) {
          console.warn(`Failed to fetch count for category: ${category.label}`);
          return { label: category.label, count: 0 }; // Return 0 if a single request fails
        }
        const searchData = await searchResponse.json();
        return { label: category.label, count: searchData.count || 0 };
      });

      const resolvedCategoryCounts = await Promise.all(categoryCountsPromises);

      // Step 3: Sort, slice, and format the data into the expected histogram object
      const sortedEntries = resolvedCategoryCounts
        .filter(c => c.count > 0) // Filter out categories with no jobs
        .sort((a, b) => b.count - a.count);
        
      const topEntries = sortedEntries.slice(0, input.resultsPerPage);
      const topHistogram = Object.fromEntries(topEntries.map(entry => [entry.label, entry.count]));

      return { histogram: topHistogram };

    } catch (error) {
      console.error('Error fetching job trends from Adzuna:', error);
      throw new Error('Failed to fetch job trends.');
    }
  }
);