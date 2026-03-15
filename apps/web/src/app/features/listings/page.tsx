import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Listing Management — ShowFlux" },
  description:
    "Real estate listing software for brokerages. Create, organize, and track property listings with photos, details, and status updates in one centralized platform.",
  openGraph: {
    title: "Listing Management — ShowFlux",
    description:
      "Real estate listing management software — a modern MLS alternative for brokerages. Centralize property data, photos, and status tracking.",
  },
};

const benefits = [
  {
    heading: "Centralized Property Data",
    description:
      "Keep all listing details in one place — property specs, photos, documents, and agent notes. No more scattered spreadsheets or email chains. Every team member sees the same up-to-date information.",
  },
  {
    heading: "Status Tracking at a Glance",
    description:
      "Track every listing through its lifecycle from draft to active to under contract to closed. Color-coded status indicators and filterable views let you see your entire portfolio instantly.",
  },
  {
    heading: "Built for Team Workflows",
    description:
      "Assign listings to agents, set permissions, and keep everyone aligned. When a listing's status changes, the whole team knows. No manual updates or missed communications.",
  },
  {
    heading: "A Modern MLS Alternative",
    description:
      "ShowFlux provides the property listing management tools your brokerage needs without the complexity of legacy MLS systems. Clean interface, fast search, and no learning curve.",
  },
];

export default function ListingsFeaturePage() {
  return (
    <div>
      <section className="px-6 pb-16 pt-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Real Estate Listing Management Software
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Create, organize, and track every property listing your brokerage
            manages — all from one centralized platform built for real estate
            teams.
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
            Start managing your listings more efficiently today. Free to try, no
            credit card required.
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
