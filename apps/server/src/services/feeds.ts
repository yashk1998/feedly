import axios from 'axios';
import FeedParser from 'feedparser';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import crypto from 'crypto';
import { prisma } from '../index';
import { logger } from '../index';
import { redis } from '../index';

interface ParsedFeed {
  title: string;
  siteUrl: string;
  articles: ParsedArticle[];
}

interface ParsedArticle {
  guid: string;
  title: string;
  url: string;
  publishedAt: Date;
  author?: string;
  summary: string;
  content: string;
}

export class FeedService {
  
  /**
   * Get or create a feed in the database
   */
  async getOrCreateFeed(url: string) {
    let feed = await prisma.feed.findUnique({
      where: { url }
    });

    if (!feed) {
      // Validate and parse the feed first
      const feedData = await this.parseFeed(url);
      
      feed = await prisma.feed.create({
        data: {
          url,
          title: feedData.title,
          siteUrl: feedData.siteUrl,
          lastFetchedAt: new Date()
        }
      });

      // Store initial articles
      await this.storeArticles(Number(feed.id), feedData.articles);
    }

    return feed;
  }

  /**
   * Parse RSS/Atom feed from URL
   */
  async parseFeed(url: string): Promise<ParsedFeed> {
    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'rivsy RSS Reader/1.0'
        }
      });

      return new Promise((resolve, reject) => {
        const feedparser = new FeedParser({});
        const articles: ParsedArticle[] = [];
        let feedMeta: any = {};

        feedparser.on('error', reject);
        
        feedparser.on('meta', (meta: any) => {
          feedMeta = meta;
        });

        feedparser.on('readable', function(this: any) {
          let item;
          while (item = this.read()) {
            articles.push({
              guid: item.guid || item.link || crypto.randomUUID(),
              title: item.title || 'Untitled',
              url: item.link || '',
              publishedAt: item.date || new Date(),
              author: item.author,
              summary: item.summary || item.description || '',
              content: item.description || item.summary || ''
            });
          }
        });

        feedparser.on('end', () => {
          resolve({
            title: feedMeta.title || 'Unknown Feed',
            siteUrl: feedMeta.link || url,
            articles
          });
        });

        feedparser.write(response.data);
        feedparser.end();
      });

    } catch (error) {
      logger.error(`Failed to parse feed ${url}:`, error);
      
      // Fallback to web scraping with readability
      try {
        return await this.scrapeWebsite(url);
      } catch (scrapeError) {
        logger.error(`Failed to scrape website ${url}:`, scrapeError);
        throw new Error(`Unable to parse feed or scrape website: ${url}`);
      }
    }
  }

  /**
   * Scrape website content using readability
   */
  async scrapeWebsite(url: string): Promise<ParsedFeed> {
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'rivsy RSS Reader/1.0'
      }
    });

    const dom = new JSDOM(response.data, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('Unable to extract content from website');
    }

    return {
      title: article.title || 'Scraped Content',
      siteUrl: url,
      articles: [{
        guid: crypto.createHash('md5').update(url + Date.now()).digest('hex'),
        title: article.title || 'Untitled',
        url,
        publishedAt: new Date(),
        author: article.byline || undefined,
        summary: article.excerpt || '',
        content: article.content || ''
      }]
    };
  }

  /**
   * Store articles in database with deduplication
   */
  async storeArticles(feedId: number, articles: ParsedArticle[]): Promise<void> {
    for (const article of articles) {
      const checksum = crypto.createHash('sha256')
        .update(article.title + article.url + article.content)
        .digest('hex');

      // Check for global deduplication
      const existingArticle = await prisma.article.findFirst({
        where: { checksum }
      });

      if (existingArticle) {
        logger.debug(`Skipping duplicate article: ${article.title}`);
        continue;
      }

      try {
        await prisma.article.create({
          data: {
            feedId,
            guid: article.guid,
            title: article.title,
            url: article.url,
            publishedAt: article.publishedAt,
            author: article.author,
            summaryHtml: article.summary,
            contentHtml: article.content,
            checksum
          }
        });
      } catch (error) {
        // Handle duplicate guid for same feed
        if ((error as any).code === 'P2002') {
          logger.debug(`Skipping duplicate guid ${article.guid} for feed ${feedId}`);
          continue;
        }
        throw error;
      }
    }
  }

  /**
   * Refresh a feed and update articles
   */
  async refreshFeed(feedId: number): Promise<void> {
    const feed = await prisma.feed.findUnique({
      where: { id: feedId }
    });

    if (!feed) {
      throw new Error(`Feed ${feedId} not found`);
    }

    try {
      const feedData = await this.parseFeed(feed.url);
      
      // Update feed metadata
      await prisma.feed.update({
        where: { id: feedId },
        data: {
          title: feedData.title,
          siteUrl: feedData.siteUrl,
          lastFetchedAt: new Date()
        }
      });

      // Store new articles
      await this.storeArticles(feedId, feedData.articles);
      
      // Cache the refresh time
      await redis.setEx(`feed:${feedId}:refreshed`, 3600, Date.now().toString());
      
      logger.info(`Successfully refreshed feed ${feedId} (${feed.url})`);
    } catch (error) {
      logger.error(`Failed to refresh feed ${feedId}:`, error);
      throw error;
    }
  }

  /**
   * Get feeds that need refreshing based on plan
   */
  async getFeedsToRefresh(planType: 'free' | 'paid'): Promise<number[]> {
    const refreshInterval = planType === 'free' ? 360 : 60; // minutes
    const cutoffTime = new Date(Date.now() - refreshInterval * 60 * 1000);

    const feeds = await prisma.feed.findMany({
      where: {
        OR: [
          { lastFetchedAt: null },
          { lastFetchedAt: { lt: cutoffTime } }
        ],
        subscriptions: {
          some: {}
        }
      },
      select: { id: true }
    });

    return feeds.map(f => Number(f.id));
  }
}

export const feedService = new FeedService(); 