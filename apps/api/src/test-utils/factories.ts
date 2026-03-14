import { randomUUID } from 'node:crypto';
import { User } from '../entities/user.entity';
import { Workspace } from '../entities/workspace.entity';
import { Listing } from '../entities/listing.entity';
import { Showing } from '../entities/showing.entity';
import { Offer } from '../entities/offer.entity';
import { Invite } from '../entities/invite.entity';
import { Activity } from '../entities/activity.entity';
import { PasswordReset } from '../entities/password-reset.entity';
import { Role } from '../common/enums/role.enum';
import { Plan } from '../common/enums/plan.enum';
import { ListingStatus } from '../common/enums/listing-status.enum';
import { ShowingStatus } from '../common/enums/showing-status.enum';
import { OfferStatus } from '../common/enums/offer-status.enum';
import { InviteStatus } from '../common/enums/invite-status.enum';
import { ActivityAction } from '../common/enums/activity-action.enum';

export function buildWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: randomUUID(),
    name: 'Test Workspace',
    plan: Plan.SOLO,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    users: [],
    ...overrides,
  } as Workspace;
}

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: randomUUID(),
    workspaceId: randomUUID(),
    email: `user-${randomUUID().slice(0, 8)}@test.com`,
    passwordHash: '$2b$12$hashedpassword',
    role: Role.BROKER,
    fullName: 'Test User',
    avatarUrl: null,
    isActive: true,
    tokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    workspace: undefined as unknown as Workspace,
    ...overrides,
  } as User;
}

export function buildListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: randomUUID(),
    workspaceId: randomUUID(),
    address: '123 Test St',
    city: 'TestCity',
    state: 'TX',
    zip: '75001',
    mlsNumber: null,
    price: 350000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1500,
    status: ListingStatus.ACTIVE,
    listingAgentId: randomUUID(),
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    workspace: undefined as unknown as Workspace,
    listingAgent: undefined as unknown as User,
    ...overrides,
  } as Listing;
}

export function buildShowing(overrides: Partial<Showing> = {}): Showing {
  return {
    id: randomUUID(),
    workspaceId: randomUUID(),
    listingId: randomUUID(),
    agentId: randomUUID(),
    scheduledAt: new Date(Date.now() + 86_400_000),
    duration: 30,
    status: ShowingStatus.SCHEDULED,
    feedback: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    workspace: undefined as unknown as Workspace,
    listing: undefined as unknown as Listing,
    agent: undefined as unknown as User,
    ...overrides,
  } as Showing;
}

export function buildOffer(overrides: Partial<Offer> = {}): Offer {
  return {
    id: randomUUID(),
    workspaceId: randomUUID(),
    listingId: randomUUID(),
    agentId: randomUUID(),
    buyerName: 'Test Buyer',
    offerAmount: 300000,
    status: OfferStatus.SUBMITTED,
    submittedAt: new Date(),
    expirationDate: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    workspace: undefined as unknown as Workspace,
    listing: undefined as unknown as Listing,
    agent: undefined as unknown as User,
    ...overrides,
  } as Offer;
}

export function buildInvite(overrides: Partial<Invite> = {}): Invite {
  return {
    id: randomUUID(),
    workspaceId: randomUUID(),
    invitedBy: randomUUID(),
    email: `invite-${randomUUID().slice(0, 8)}@test.com`,
    token: randomUUID(),
    status: InviteStatus.PENDING,
    expiresAt: new Date(Date.now() + 7 * 86_400_000),
    createdAt: new Date(),
    updatedAt: new Date(),
    workspace: undefined as unknown as Workspace,
    inviter: undefined as unknown as User,
    ...overrides,
  } as Invite;
}

export function buildActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: randomUUID(),
    workspaceId: randomUUID(),
    userId: randomUUID(),
    action: ActivityAction.LISTING_CREATED,
    entityType: 'listing',
    entityId: randomUUID(),
    metadata: null,
    createdAt: new Date(),
    workspace: undefined as unknown as Workspace,
    user: undefined as unknown as User,
    ...overrides,
  } as Activity;
}

export function buildPasswordReset(
  overrides: Partial<PasswordReset> = {},
): PasswordReset {
  return {
    id: randomUUID(),
    userId: randomUUID(),
    token: randomUUID(),
    expiresAt: new Date(Date.now() + 3_600_000),
    usedAt: null,
    createdAt: new Date(),
    user: undefined as unknown as User,
    ...overrides,
  } as PasswordReset;
}
