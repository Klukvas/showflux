import { render, screen } from "@testing-library/react";
import { PlanUpgradeModal } from "../components/plan-upgrade-modal";

// Mock the hooks
jest.mock("../hooks/use-subscription", () => ({
  useSubscription: () => ({
    subscription: { plan: "solo", hasSubscription: false },
    createCheckout: jest.fn(),
  }),
}));

jest.mock("../paddle-provider", () => ({
  usePaddle: () => ({ paddle: null }),
}));

describe("PlanUpgradeModal", () => {
  it("renders nothing when closed", () => {
    render(
      <PlanUpgradeModal isOpen={false} onClose={jest.fn()} />,
    );
    expect(screen.queryByText("Upgrade Your Plan")).not.toBeInTheDocument();
  });

  it("renders the title when open", () => {
    render(
      <PlanUpgradeModal isOpen={true} onClose={jest.fn()} />,
    );
    expect(screen.getByText("Upgrade Your Plan")).toBeInTheDocument();
  });

  it("displays a custom message when provided", () => {
    render(
      <PlanUpgradeModal
        isOpen={true}
        onClose={jest.fn()}
        message="You've reached your listing limit."
      />,
    );
    expect(
      screen.getByText("You've reached your listing limit."),
    ).toBeInTheDocument();
  });

  it("shows all pricing plans", () => {
    render(
      <PlanUpgradeModal isOpen={true} onClose={jest.fn()} />,
    );
    expect(screen.getByText("Solo")).toBeInTheDocument();
    expect(screen.getByText("Team")).toBeInTheDocument();
    expect(screen.getByText("Agency")).toBeInTheDocument();
  });
});
