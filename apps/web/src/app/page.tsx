"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { AuthModal } from "@/features/auth/components/auth-modal";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PricingCards } from "@/features/subscription/components/pricing-cards";

type AuthTab = "login" | "register";

const features = [
  {
    title: "Listings",
    description:
      "Manage property listings with photos, details, and status tracking all in one place.",
    icon: (
      <svg
        className="h-8 w-8 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21"
        />
      </svg>
    ),
  },
  {
    title: "Showings",
    description:
      "Schedule and coordinate property showings with automatic conflict detection.",
    icon: (
      <svg
        className="h-8 w-8 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
        />
      </svg>
    ),
  },
  {
    title: "Offer Management",
    description:
      "Track, compare, and manage offers with a clear pipeline view for every listing.",
    icon: (
      <svg
        className="h-8 w-8 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    ),
  },
  {
    title: "Team Collaboration",
    description:
      "Invite agents to your workspace, assign roles, and track team activity in real time.",
    icon: (
      <svg
        className="h-8 w-8 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
        />
      </svg>
    ),
  },
] as const;

const steps = [
  {
    number: "1",
    title: "Create",
    description: "Set up your workspace and add property listings in minutes.",
  },
  {
    number: "2",
    title: "Manage",
    description:
      "Schedule showings, receive offers, and collaborate with your team.",
  },
  {
    number: "3",
    title: "Close",
    description: "Compare offers, track progress, and close deals faster.",
  },
] as const;

const stats = [
  { value: "500+", label: "Active Brokerages" },
  { value: "50k+", label: "Listings Managed" },
  { value: "98%", label: "Customer Satisfaction" },
] as const;

const testimonials = [
  {
    quote:
      "ShowFlux cut our deal closing time by 40%. The showing scheduler alone saves us hours every week.",
    name: "Sarah Chen",
    role: "Managing Broker",
    company: "Pacific Realty Group",
  },
  {
    quote:
      "Finally, a tool that both brokers and agents actually want to use. Onboarding our team took less than a day.",
    name: "Marcus Williams",
    role: "Team Lead",
    company: "Cornerstone Properties",
  },
  {
    quote:
      "The offer management pipeline gives us a clear view of every deal. We never miss a deadline anymore.",
    name: "Rachel Torres",
    role: "Senior Broker",
    company: "Summit Real Estate",
  },
] as const;

function HomeContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [authModal, setAuthModal] = useState<{ open: boolean; tab: AuthTab }>({
    open: false,
    tab: "login",
  });

  useEffect(() => {
    const authParam = searchParams.get("auth");
    if (authParam === "login" || authParam === "register") {
      setAuthModal({ open: true, tab: authParam });
    }
  }, [searchParams]);

  const openAuth = useCallback((tab: AuthTab) => {
    setAuthModal({ open: true, tab });
  }, []);

  const closeAuth = useCallback(() => {
    setAuthModal((prev) => ({ ...prev, open: false }));
    const url = new URL(window.location.href);
    url.searchParams.delete("auth");
    const newUrl =
      url.searchParams.size > 0
        ? `${url.pathname}?${url.searchParams.toString()}`
        : url.pathname;
    window.history.replaceState(null, "", newUrl);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-gray-900">ShowFlux</span>
          <div className="flex items-center gap-4">
            <Link
              href="/blog"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Blog
            </Link>
            <Link
              href="/features"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Features
            </Link>
            {user ? (
              <Button size="sm" onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openAuth("login")}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pb-20 pt-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Manage Your Real Estate Business in One Place
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Streamline listings, showings, and offers with your team. ShowFlux
            gives brokers and agents the tools to close deals faster.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            {user ? (
              <Button size="lg" onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button size="lg" onClick={() => openAuth("register")}>
                  Get Started Free
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Learn More
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Everything you need to run your brokerage
          </h2>
          <p className="mt-4 text-center text-lg text-gray-600">
            From listing to closing, ShowFlux covers every step.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.number} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                  {step.number}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{step.description}</p>
                {i < steps.length - 1 && (
                  <div
                    className="mt-4 hidden text-2xl text-gray-300 sm:block"
                    aria-hidden="true"
                  >
                    &rarr;
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 bg-white px-6 py-16">
        <div className="mx-auto grid max-w-4xl gap-8 text-center sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-4xl font-bold text-blue-600">{stat.value}</p>
              <p className="mt-2 text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Trusted by top brokerages
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-xl bg-white p-6 shadow-sm"
              >
                <p className="text-sm leading-6 text-gray-600">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start with a 14-day free trial. No credit card required.
            </p>
          </div>
          <div className="mt-12">
            <PricingCards onSelect={() => openAuth("register")} />
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="bg-blue-600 px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Ready to get started?
            </h2>
            <p className="mt-4 text-lg text-blue-100">
              Join brokerages that use ShowFlux to manage their business more
              efficiently.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-8"
              onClick={() => openAuth("register")}
            >
              Start Free Trial
            </Button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-sm text-gray-500">
          <span>
            &copy; {new Date().getFullYear()} ShowFlux. All rights reserved.
          </span>
          <div className="flex gap-6">
            <Link href="/features" className="hover:text-gray-700">
              Features
            </Link>
            <Link href="/blog" className="hover:text-gray-700">
              Blog
            </Link>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.open}
        onClose={closeAuth}
        initialTab={authModal.tab}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
