import { NextRequest, NextResponse } from 'next/server';
import { getFromCache, setToCache } from '@/app/api/_utils/cache';

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const GNEWS_BASE_URL = 'https://gnews.io/api/v4';

interface Article {
    title: string;
    author?: string | null;
    [key: string]: unknown;
}

interface NewsData {
    articles: Article[];
    totalArticles: number;
    [key: string]: unknown;
}

export async function GET(
    request: NextRequest,
    { params }: { params: { author: string } }
) {
    if (!GNEWS_API_KEY) {
        return NextResponse.json({ message: 'API key is missing.' }, { status: 500 });
    }

    const decodedAuthor = decodeURIComponent(params.author);
    if (!decodedAuthor) {
        return NextResponse.json({ message: 'Author parameter is required.' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '10'; // Default to 10 articles from GNews

    const cacheKey = `news_author_${decodedAuthor.toLowerCase().replace(/\s+/g, '_')}_limit${limit}`;
    const cachedData = getFromCache<NewsData>(cacheKey);

    if (cachedData) {
        console.log(`Author search: serving from cache for "${decodedAuthor}"`);
        return NextResponse.json(cachedData);
    }

    const apiUrl = `${GNEWS_BASE_URL}/search?q=${encodeURIComponent(decodedAuthor)}&token=${GNEWS_API_KEY}&max=${limit}&expand=content`;

    try {
        const newsResponse = await fetch(apiUrl);
        if (!newsResponse.ok) {
            const errorData = await newsResponse.json();
            console.error('GNews API Error (author search):', errorData);
            return NextResponse.json(
                { message: 'Error fetching news by author from provider.', details: errorData.errors || errorData },
                { status: newsResponse.status }
            );
        }

        let newsData: NewsData = await newsResponse.json();

        // GNews doesn't have a strict author filter. We search the name and then refine if possible.
        if (newsData.articles?.length > 0) {
            const filteredArticles = newsData.articles.filter(
                (article) => article.author && article.author.toLowerCase().includes(decodedAuthor.toLowerCase())
            );

            if (filteredArticles.length > 0) {
                newsData = { ...newsData, articles: filteredArticles, totalArticles: filteredArticles.length };
            }
            // If no articles strictly match the author field, we still return the keyword-based search results.
        }

        setToCache(cacheKey, newsData, 600);
        return NextResponse.json(newsData);

    } catch (error) {
        console.error('Internal Server Error (author search):', error);
        return NextResponse.json({ message: 'Internal server error.', details: (error as Error).message }, { status: 500 });
    }
}