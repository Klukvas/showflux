import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Offer Tracking — ShowFlux" },
  description:
    "Real estate offer management and comparison tool. Track, compare, and manage offers with a clear pipeline view for every listing in your brokerage.",
  openGraph: {
    title: "Offer Tracking — ShowFlux",
    description:
      "Real estate offer tracking made simple. Compare competing bids, track deadlines, and manage the full offer pipeline from submission to acceptance.",
  },
};

const benefits = [
  {
    heading: "Clear Offer Pipeline",
    description:
      "See every offer for every listing in one organized view. Track offers from submission through review to acceptance or rejection. No more digging through emails to find the latest terms.",
  },
  {
    heading: "Side-by-Side Offer Comparison",
    description:
      "Compare competing offers on price, contingencies, closing timeline, and financing. ShowFlux makes it easy to present options to sellers with clear, organized data instead of scattered paperwork.",
  },
  {
    heading: "Never Miss a Deadline",
    description:
      "Track expiration dates, response deadlines, and contingency periods for every offer. ShowFlux keeps your team aware of time-sensitive actions so nothing falls through the cracks.",
  },
  {
    heading: "Audit Trail for Every Decision",
    description:
      "Every offer action is logged — submissions, counteroffers, withdrawals, and acceptances. Maintain a complete history for compliance and have a clear record of every transaction.",
  },
];

export default function OffersFeaturePage() {
  return (
    <div>
      <section className="px-6 pb-16 pt-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Real Estate Offer Management &amp; Comparison Tool
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Track, compare, and manage every offer across your brokerage.
            ShowFlux gives you a clear pipeline view so you never miss a
            deadline or lose track of competing bids.
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
            Take control of your offer process today. Free to try, no credit
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
