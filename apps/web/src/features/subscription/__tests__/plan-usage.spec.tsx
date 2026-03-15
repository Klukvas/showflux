import { render, screen } from "@testing-library/react";
import { PlanUsage } from "../components/plan-usage";

describe("PlanUsage", () => {
  const defaultProps = {
    listings: { current: 5, limit: 10 as number | "unlimited" },
    users: { current: 1, limit: 1 as number | "unlimited" },
    showings: { current: 30, limit: 50 as number | "unlimited" },
  };

  it("renders all usage bars", () => {
    render(<PlanUsage {...defaultProps} />);
    expect(screen.getByText("Listings")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Showings (this month)")).toBeInTheDocument();
  });

  it("displays current / limit counts", () => {
    render(<PlanUsage {...defaultProps} />);
    expect(screen.getByText("5 / 10")).toBeInTheDocument();
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
    expect(screen.getByText("30 / 50")).toBeInTheDocument();
  });

  it("shows Unlimited for unlimited limits", () => {
    render(
      <PlanUsage
        listings={{ current: 5, limit: "unlimited" }}
        users={{ current: 3, limit: "unlimited" }}
        showings={{ current: 100, limit: "unlimited" }}
      />,
    );
    expect(screen.getAllByText(/Unlimited/)).toHaveLength(3);
  });

  it("renders the heading", () => {
    render(<PlanUsage {...defaultProps} />);
    expect(screen.getByText("Plan Usage")).toBeInTheDocument();
  });
});
