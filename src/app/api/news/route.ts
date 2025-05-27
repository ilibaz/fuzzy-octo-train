import { NextRequest, NextResponse } from 'next/server';
import { getFromCache, setToCache } from '@/app/api/_utils/cache';

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const GNEWS_BASE_URL = 'https://gnews.io/api/v4';

interface Article {
    title: string;
    description: string;
    content: string;
    url: string;
    image: string;
    publishedAt: string;
    source: {
        name: string;
        url: string;
    };
    author?: string | null;
    [key: string]: unknown;
}

interface NewsResponse {
    totalArticles: number;
    articles: Article[];
    [key: string]: unknown;
}

async function fetchAndCacheGNews(cacheKey: string, apiUrl: string): Promise<NewsResponse | { message: string; details?: unknown; status?: number }> {
    const cachedData = getFromCache<NewsResponse>(cacheKey);
    if (cachedData) {
        console.log(`[API /news] Serving from cache: ${cacheKey}`);
        return cachedData;
    }

    console.log(`[API /news] Fetching from GNews. API URL: ${apiUrl}`);
    try {
        const response = await fetch(apiUrl);
        const responseBodyText = await response.text(); // Read body once for logging/parsing

        if (!response.ok) {
            console.error(`[API /news] GNews API Error. Status: ${response.status}. Body: ${responseBodyText}`);
            let errorDetails = { message: 'Failed to fetch from GNews due to provider error.' };
            try {
                errorDetails = JSON.parse(responseBodyText); // Try to parse GNews error
            } catch (e) {
                console.error('[API /news] Could not parse GNews error response as JSON.', e);
            }
            return {
                message: errorDetails.message || (errorDetails as { errors?: { message: string }[] }).errors?.[0]?.message
                    || 'Failed to fetch from GNews.', details: errorDetails, status: response.status
            };
        }

        const newsData = JSON.parse(responseBodyText) as NewsResponse;
        setToCache(cacheKey, newsData, 600); // Cache for 10 minutes (600 seconds)
        return newsData;

    } catch (error) {
        console.error(`[API /news] Internal Server Error while fetching GNews for ${cacheKey}:`, error);
        return { message: (error as Error).message || 'Internal Server Error while fetching GNews.', status: 500 };
    }
}

export async function GET(request: NextRequest) {
    if (!GNEWS_API_KEY) {
        return NextResponse.json({ message: 'GNews API key is not configured.' }, { status: 500 });
    }

    const { searchParams } = request.nextUrl; // Use request.nextUrl for App Router
    const nParam = searchParams.get('n');
    const limitParam = searchParams.get('limit') || '10'; // Default to 10 articles
    const qParam = searchParams.get('q');
    const langParam = searchParams.get('lang') || 'en';
    const countryParam = searchParams.get('country') || 'us';
    // Add other GNews parameters might want to support, e.g., 'topic', 'from', 'to'

    const maxArticles = parseInt(nParam || limitParam, 10);

    if (isNaN(maxArticles) || maxArticles <= 0 || maxArticles > 100) { // GNews max is often 100
        return NextResponse.json(
            { message: 'Parameter "n" or "limit" must be a positive number (typically <= 100).' },
            { status: 400 }
        );
    }

    let apiUrl: string;
    let cacheKey: string;

    if (qParam && typeof qParam === 'string' && qParam.trim() !== '') {
        // Search by keywords
        apiUrl = `${GNEWS_BASE_URL}/search?q=${encodeURIComponent(qParam.trim())}&max=${maxArticles}&lang=${langParam}&country=${countryParam}&token=${GNEWS_API_KEY}&expand=content`;
        cacheKey = `news_search_${qParam.trim()}_${maxArticles}_${langParam}_${countryParam}`;
    } else {
        // Fetch top headlines
        apiUrl = `${GNEWS_BASE_URL}/top-headlines?max=${maxArticles}&lang=${langParam}&country=${countryParam}&token=${GNEWS_API_KEY}&expand=content`;
        cacheKey = `news_top-headlines_${maxArticles}_${langParam}_${countryParam}`;
    }

    const result = await fetchAndCacheGNews(cacheKey, apiUrl);

    if ('message' in result && result.message) { // Check if it's our error object structure
        return NextResponse.json({ message: result.message, details: result.details }, { status: result.status as number || 500 });
    }

    return NextResponse.json(result);
}