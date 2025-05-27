
import { NextRequest, NextResponse } from 'next/server';
import { getFromCache, setToCache } from '@/app/api/_utils/cache';

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const GNEWS_BASE_URL = 'https://gnews.io/api/v4';

interface Article {
    title: string;
    [key: string]: unknown;
}

interface NewsData {
    articles: Article[];
    totalArticles?: number;
    [key: string]: unknown;
}

export async function GET(
    request: NextRequest,
    { params }: { params: { title: string } }
) {
    if (!GNEWS_API_KEY) {
        return NextResponse.json({ message: 'API key is missing.' }, { status: 500 });
    }

    const titleFromParams = params.title; // Already URL-decoded by Next.js

    console.log('[API /news/title] Received params.title:', titleFromParams);

    if (!titleFromParams || typeof titleFromParams !== 'string' || titleFromParams.trim() === '') {
        return NextResponse.json({ message: 'Title parameter is required and must be a non-empty string.' }, { status: 400 });
    }

    const cacheKey = `news_title_${titleFromParams.trim().toLowerCase().replace(/\s+/g, '_')}`;
    const cachedData = getFromCache<NewsData>(cacheKey);

    if (cachedData) {
        console.log(`[API /news/title] Serving from cache for title: "${titleFromParams.trim()}"`);
        return NextResponse.json(cachedData);
    }

    const titleToSearch = titleFromParams.trim();
    const apiUrl = `${GNEWS_BASE_URL}/search?q=${encodeURIComponent(titleToSearch)}&in=${encodeURIComponent('title')}&token=${GNEWS_API_KEY}&expand=content`;

    console.log(`[API /news/title] Title to search (trimmed): "${titleToSearch}"`);
    console.log(`[API /news/title] Constructed searchQuery (before URI encoding): "${titleToSearch}"`);
    console.log(`[API /news/title] Fetching from GNews. API URL: ${apiUrl}`);

    try {
        const newsResponse = await fetch(apiUrl);
        const responseBodyText = await newsResponse.text();

        if (!newsResponse.ok) {
            console.error(`[API /news/title] GNews API Error. Status: ${newsResponse.status}. Body: ${responseBodyText}`);
            let errorDetails = { message: 'Failed to fetch from GNews due to provider error.' };
            try {
                errorDetails = JSON.parse(responseBodyText);
            } catch (e) {
                console.error('[API /news/title] Could not parse GNews error response as JSON.', e);
            }
            return NextResponse.json(
                { message: 'Error fetching news by title from provider.', details: errorDetails },
                { status: newsResponse.status }
            );
        }

        const newsData: NewsData = JSON.parse(responseBodyText);
        let resultData = newsData;

        if (newsData.articles?.length > 0) {
            const exactMatch = newsData.articles.find(
                (article) => article.title.toLowerCase() === titleToSearch.toLowerCase()
            );
            if (exactMatch) {
                resultData = { ...newsData, articles: [exactMatch], totalArticles: 1 };
            }
        }

        setToCache(cacheKey, resultData, 600);
        return NextResponse.json(resultData);

    } catch (error) {
        console.error('[API /news/title] Internal Server Error:', error);
        return NextResponse.json({ message: 'Internal server error.', details: (error as Error).message }, { status: 500 });
    }
}