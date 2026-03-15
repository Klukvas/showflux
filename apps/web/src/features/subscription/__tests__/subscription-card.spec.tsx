import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubscriptionCard } from "../components/subscription-card";
import type { SubscriptionInfo } from "@/types/subscription";

const mockCreateCheckout = jest.fn();
const mockCancelSubscription = jest.fn();
const mockRefetch = jest.fn();

let mockSubscription: SubscriptionInfo | null = null;
let mockIsLoading = false;

jest.mock("../hooks/use-subscription", () => ({
  useSubscription: () => ({
    subscription: mockSubscription,
    isLoading: mockIsLoading,
    createCheckout: mockCreateCheckout,
    cancelSubscription: mockCancelSubscription,
    refetch: mockRefetch,
  }),
}));

jest.mock("../paddle-provider", () => ({
  usePaddle: () => ({ paddle: null }),
}));

describe("SubscriptionCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscription = null;
    mockIsLoading = false;
  });

  it("shows loading skeleton when isLoading=true", () => {
    mockIsLoading = true;
    const { container } = render(<SubscriptionCard />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows loading skeleton when subscription is null", () => {
    mockSubscription = null;
    const { container } = render(<SubscriptionCard />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders plan name and status badge for trialing", () => {
    mockSubscription = {
      plan: "solo",
      status: "trialing",
      hasSubscription: false,
      currentPeriodEnd: null,
      trialEndsAt: "2026-04-15T00:00:00.000Z",
    };
    render(<SubscriptionCard />);
    expect(screen.getByText("solo")).toBeInTheDocument();
    expect(screen.getByText("Trial")).toBeInTheDocument();
  });

  it("renders Active badge when status is active", () => {
    mockSubscription = {
      plan: "team",
      status: "active",
      hasSubscription: true,
      currentPeriodEnd: "2026-04-15T00:00:00.000Z",
      trialEndsAt: null,
    };
    render(<SubscriptionCard />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders Past Due badge", () => {
    mockSubscription = {
      plan: "team",
      status: "past_due",
      hasSubscription: true,
      currentPeriodEnd: "2026-04-15T00:00:00.000Z",
      trialEndsAt: null,
    };
    render(<SubscriptionCard />);
    expect(screen.getByText("Past Due")).toBeInTheDocument();
  });

  it("renders Canceled badge", () => {
    mockSubscription = {
      plan: "solo",
      status: "canceled",
      hasSubscription: true,
      currentPeriodEnd: "2026-04-15T00:00:00.000Z",
      trialEndsAt: null,
    };
    render(<SubscriptionCard />);
    expect(screen.getByText("Canceled")).toBeInTheDocument();
  });

  it('shows "Subscribe" button when hasSubscription=false', () => {
    mockSubscription = {
      plan: "solo",
      status: "trialing",
      hasSubscription: false,
      currentPeriodEnd: null,
      trialEndsAt: null,
    };
    render(<SubscriptionCard />);
    expect(screen.getByText("Subscribe")).toBeInTheDocument();
  });

  it('shows "Change Plan" button when hasSubscription=true', () => {
    mockSubscription = {
      plan: "team",
      status: "active",
      hasSubscription: true,
      currentPeriodEnd: "2026-04-15T00:00:00.000Z",
      trialEndsAt: null,
    };
    render(<SubscriptionCard />);
    expect(screen.getByText("Change Plan")).toBeInTheDocument();
  });

  it('shows "Cancel Subscription" button when subscribed and not canceled', () => {
    mockSubscription = {
      plan: "team",
      status: "active",
      hasSubscription: true,
      currentPeriodEnd: "2026-04-15T00:00:00.000Z",
      trialEndsAt: null,
    };
    render(<SubscriptionCard />);
    expect(screen.getByText("Cancel Subscription")).toBeInTheDocument();
  });

  it('hides cancel button when status is "canceled"', () => {
    mockSubscription = {
      plan: "team",
      status: "canceled",
      hasSubscription: true,
      currentPeriodEnd: "2026-04-15T00:00:00.000Z",
      trialEndsAt: null,
    };
    render(<SubscriptionCard />);
    expect(screen.queryByText("Cancel Subscription")).not.toBeInTheDocument();
  });

  it("shows trial end date when trialEndsAt provided", () => {
    mockSubscription = {
      plan: "solo",
      status: "trialing",
      hasSubscription: false,
      currentPeriodEnd: null,
      trialEndsAt: "2026-04-15T00:00:00.000Z",
    };
    render(<SubscriptionCard />);
    expect(screen.getByText("Trial ends")).toBeInTheDocument();
    expect(screen.getByText("April 15, 2026")).toBeInTheDocument();
  });

  it("shows period end date when currentPeriodEnd provided", () => {
    mockSubscription = {
      plan: "team",
      status: "active",
      hasSubscription: true,
      currentPeriodEnd: "2026-05-01T00:00:00.000Z",
      trialEndsAt: null,
    };
    render(<SubscriptionCard />);
    expect(screen.getByText("Current period ends")).toBeInTheDocument();
    expect(screen.getByText("May 1, 2026")).toBeInTheDocument();
  });

  it("clicking Subscribe shows PricingCards", async () => {
    const user = userEvent.setup();
    mockSubscription = {
      plan: "solo",
      status: "trialing",
      hasSubscription: false,
      currentPeriodEnd: null,
      trialEndsAt: null,
    };
    render(<SubscriptionCard />);

    await user.click(screen.getByText("Subscribe"));

    // PricingCards should now be visible with plan names
    expect(screen.getByText("Solo")).toBeInTheDocument();
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Agency")).toBeInTheDocument();
  });
});
