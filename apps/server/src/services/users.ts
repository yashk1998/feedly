import { clerkClient } from '@clerk/express';
import type { User } from '@prisma/client';
import { prisma } from '../index';
import { logger } from '../index';

export async function syncClerkUser(userId: string): Promise<User> {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (existingUser) {
    return existingUser;
  }

  try {
    const clerkUser = await clerkClient.users.getUser(userId);

    const emailAddress = clerkUser.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || '';

    return await prisma.user.create({
      data: {
        id: userId,
        email: emailAddress,
        name: clerkUser.fullName || clerkUser.username || emailAddress,
        tz: (clerkUser.publicMetadata?.timezone as string) || null
      }
    });
  } catch (error) {
    logger.error('Failed to sync Clerk user', { userId, error });
    throw error;
  }
}
