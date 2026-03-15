import { SITE_URL } from "@/lib/constants";

const CONTENT = `# ShowFlux

> Real estate listing and showing management platform for brokerages and agents.

ShowFlux is a SaaS platform that helps real estate brokerages manage their business. It provides tools for property listing management, showing scheduling, offer tracking, and team collaboration.

## Key Pages

- [Home](${SITE_URL}/): Landing page with product overview
- [Features](${SITE_URL}/features): Overview of all platform features
- [Listing Management](${SITE_URL}/features/listings): Property listing management tools
- [Showing Scheduling](${SITE_URL}/features/showings): Property showing scheduler
- [Offer Tracking](${SITE_URL}/features/offers): Offer management and comparison
- [Team Collaboration](${SITE_URL}/features/collaboration): Brokerage team management
- [Blog](${SITE_URL}/blog): Articles about real estate technology and best practices

## Product Details

- **Target audience**: Real estate brokerages, brokers, and agents
- **Core features**: Listings, showings, offers, team collaboration, workspace management
- **Roles**: Broker (full access), Agent (scoped access)
- **Pricing**: Free trial available, no credit card required

## Full Documentation

- [llms-full.txt](${SITE_URL}/llms-full.txt): Detailed product information
`;

export function GET() {
  return new Response(CONTENT, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
