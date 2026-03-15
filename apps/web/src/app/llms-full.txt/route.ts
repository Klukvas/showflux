import { SITE_URL } from "@/lib/constants";

const CONTENT = `# ShowFlux — Complete Product Information

> Real estate listing and showing management platform for brokerages and agents.

## About ShowFlux

ShowFlux is a modern SaaS platform designed for real estate brokerages. It replaces spreadsheets, email chains, and fragmented tools with one centralized workspace where brokers and agents manage their entire business — from listing a property to closing a deal.

## Core Features

### Listing Management
Create, organize, and track property listings with photos, details, and status updates. ShowFlux provides a centralized platform for managing your entire portfolio. Features include:
- Centralized property data (specs, photos, documents, notes)
- Status tracking through the full lifecycle (draft, active, under contract, closed)
- Team-based workflows with agent assignment and permissions
- Fast search and filtering across all listings
- A modern alternative to legacy MLS systems

### Showing Scheduling
Schedule and coordinate property showings across your brokerage. Features include:
- One-click showing booking with agent assignment
- Automatic conflict detection to prevent double-bookings
- Full team calendar visibility (filter by agent, property, or date)
- Built-in showing feedback capture from agents

### Offer Tracking
Track, compare, and manage offers with a clear pipeline view. Features include:
- Organized offer pipeline from submission to acceptance
- Side-by-side offer comparison (price, contingencies, timeline, financing)
- Deadline and expiration date tracking
- Complete audit trail for compliance (submissions, counteroffers, withdrawals)

### Team Collaboration
Workspace-based team management for brokerages of any size. Features include:
- Workspace isolation — each brokerage gets its own workspace
- Email-based agent invitations
- Role-based access control (Broker: full access, Agent: scoped access)
- Real-time activity tracking across the workspace
- Dashboard with team activity overview

## Target Audience

- **Real estate brokerages** looking for a centralized management platform
- **Brokers** who need oversight of listings, showings, offers, and team activity
- **Agents** who want a streamlined workflow for their day-to-day tasks

## How It Works

1. **Create** — Set up your workspace and add property listings in minutes
2. **Manage** — Schedule showings, receive offers, and collaborate with your team
3. **Close** — Compare offers, track progress, and close deals faster

## Technical Details

- Web-based platform accessible from any browser
- Workspace-based multi-tenancy
- Two user roles: Broker and Agent
- Secure authentication with email/password

## Pricing

Free trial available. No credit card required to get started.

## Contact & Links

- Website: ${SITE_URL}
- Blog: ${SITE_URL}/blog
- Features: ${SITE_URL}/features
`;

export function GET() {
  return new Response(CONTENT, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
