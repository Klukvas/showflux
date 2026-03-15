import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Showing Scheduling — ShowFlux" },
  description:
    "Property showing scheduler for real estate teams. Coordinate showings, detect conflicts automatically, and keep your entire brokerage in sync.",
  openGraph: {
    title: "Showing Scheduling — ShowFlux",
    description:
      "Real estate showing management made simple. Schedule, coordinate, and track property showings with automatic conflict detection.",
  },
};

const benefits = [
  {
    heading: "Schedule Showings in Seconds",
    description:
      "Book property showings with a few clicks. Pick the listing, choose a time, and assign an agent. ShowFlux handles the rest — confirmations, reminders, and calendar updates all happen automatically.",
  },
  {
    heading: "Automatic Conflict Detection",
    description:
      "Never double-book a property or an agent again. ShowFlux checks for scheduling conflicts in real time and warns you before they happen, so your team stays organized without the headaches.",
  },
  {
    heading: "Full Team Visibility",
    description:
      "See every showing across your brokerage in one view. Filter by agent, property, or date range. Brokers get the oversight they need while agents stay focused on their own schedules.",
  },
  {
    heading: "Showing Feedback Built In",
    description:
      "Capture buyer feedback right after each showing. Agents log notes and impressions directly in ShowFlux, giving listing agents and brokers immediate visibility into buyer interest.",
  },
];

export default function ShowingsFeaturePage() {
  return (
    <div>
      <section className="px-6 pb-16 pt-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Property Showing Scheduler for Real Estate Teams
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Coordinate property showings across your entire brokerage. Automatic
            conflict detection, team calendars, and showing feedback — all in
            one place.
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
            Simplify your showing schedule today. Free to try, no credit card
            required.
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
