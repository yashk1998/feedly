// packages/common/types.ts
// Shared TypeScript types for rivsy RSS SaaS

export type Plan = 'free' | 'pro' | 'power';
export type TeamRole = 'owner' | 'editor' | 'viewer';
export type SocialNetwork = 'twitter' | 'linkedin' | 'reddit';
export type PaymentStatus = 'active' | 'canceled' | 'past_due' | 'trial';

export interface User {
  id: string;               // Clerk UUID
  email: string;
  name?: string;
  tz?: string;             // IANA time-zone
  createdAt: string;       // ISO dates
  updatedAt: string;
}

export interface Team {
  id: number;
  name: string;
  ownerUserId: string;
  plan: Plan;
  slackWebhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  teamId: number;
  userId: string;
  role: TeamRole;
}

export interface Feed {
  id: number;
  url: string;
  title?: string;
  siteUrl?: string;
  lastFetchedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: number;
  teamId?: number | null;
  userId?: string | null;
  feedId: number;
  category?: string | null;
  createdAt: string;
}

export interface Article {
  id: number;
  feedId: number;
  guid: string;
  title?: string;
  url?: string;
  publishedAt?: string;
  author?: string;
  summaryHtml?: string;
  contentHtml?: string;
  checksum: string;
  createdAt: string;
}

export interface ArticleRead {
  articleId: number;
  userId: string;
  readAt: string;
}

export interface AiCredits {
  userId: string;
  cycleStart: string;
  cycleEnd: string;
  used: number;
}

export interface SocialToken {
  userId: string;
  network: SocialNetwork;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface Payment {
  razorpaySubscriptionId: string;
  userId: string;
  plan: Exclude<Plan, 'free'>;
  status: PaymentStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
}

export interface AdminLog {
  id: number;
  action: string;
  details?: unknown;
  createdAt: string;
} 