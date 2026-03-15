import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Team Collaboration — ShowFlux" },
  description:
    "Brokerage team management tools for real estate. Invite agents, assign roles, track activity, and keep your entire team aligned in one workspace.",
  openGraph: {
    title: "Team Collaboration — ShowFlux",
    description:
      "Real estate team tools built for brokerages. Manage agents, assign roles, and collaborate on listings, showings, and offers in real time.",
  },
};

const benefits = [
  {
    heading: "Workspace-Based Team Management",
    description:
      "Each brokerage gets its own workspace. Invite agents by email, assign broker or agent roles, and control who can access what. Your data stays organized and secure by default.",
  },
  {
    heading: "Role-Based Access Control",
    description:
      "Brokers see everything — full portfolio, team activity, and management dashboards. Agents see their own assignments and relevant listings. The right people have the right access, automatically.",
  },
  {
    heading: "Real-Time Activity Tracking",
    description:
      "See what your team is working on without asking. New listings, scheduled showings, submitted offers — all activity is visible in your workspace dashboard so brokers stay informed.",
  },
  {
    heading: "Built for Brokerages of Any Size",
    description:
      "Whether you have 3 agents or 300, ShowFlux scales with your team. Add new members in seconds, and they are ready to work immediately with access to the listings and tools they need.",
  },
];

export default function CollaborationFeaturePage() {
  return (
    <div>
      <section className="px-6 pb-16 pt-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Real Estate Team Collaboration Tools
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Invite agents, assign roles, and keep your entire brokerage aligned.
            ShowFlux gives teams the workspace they need to collaborate on
            listings, showings, and offers.
          </p>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl space-y-12">
          {benefits.map((benefit) => (
            <div key={benefit.heading}>
              <h2 className="text-2xl font-semibold text-gray-900">
                {benefit.heading}
              </h2>
              <p className="mt-3 text-base leading-7 text-gray-600">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-600 px-6 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Get Started with ShowFlux
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Bring your team together on one platform. Free to try, no credit
            card required.
          </p>
          <Link
            href="/?auth=register"
            className="mt-8 inline-block rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}
