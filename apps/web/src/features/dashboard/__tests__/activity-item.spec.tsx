import { render, screen } from "@testing-library/react";
import { ActivityItem } from "../components/activity-item";
import type { Activity } from "@/types/activity";

describe("ActivityItem", () => {
  const baseActivity: Activity = {
    id: "1",
    workspaceId: "w1",
    userId: "u1",
    action: "listing_created",
    entityType: "listing",
    entityId: "l1",
    metadata: null,
    createdAt: new Date().toISOString(),
  };

  it("renders user name and action label", () => {
    const activity: Activity = {
      ...baseActivity,
      user: {
        id: "u1",
        workspaceId: "w1",
        email: "jane@test.com",
        role: "broker",
        fullName: "Jane Broker",
        avatarUrl: null,
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    };
    render(<ActivityItem activity={activity} />);
    expect(screen.getByText("Jane Broker")).toBeInTheDocument();
    expect(screen.getByText("created a listing")).toBeInTheDocument();
  });

  it("shows 'Someone' when user is missing", () => {
    render(<ActivityItem activity={baseActivity} />);
    expect(screen.getByText("Someone")).toBeInTheDocument();
  });

  it("renders user initial as avatar", () => {
    const activity: Activity = {
      ...baseActivity,
      user: {
        id: "u1",
        workspaceId: "w1",
        email: "jane@test.com",
        role: "broker",
        fullName: "Jane Broker",
        avatarUrl: null,
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    };
    render(<ActivityItem activity={activity} />);
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("renders relative time", () => {
    render(<ActivityItem activity={baseActivity} />);
    expect(screen.getByText("just now")).toBeInTheDocument();
  });

  it.each([
    ["listing_created", "created a listing"],
    ["listing_updated", "updated a listing"],
    ["showing_scheduled", "scheduled a showing"],
    ["offer_submitted", "submitted an offer"],
    ["offer_accepted", "accepted an offer"],
    ["invite_sent", "sent an invite"],
    ["member_deactivated", "deactivated a member"],
  ] as const)("maps %s to correct label", (action, label) => {
    render(<ActivityItem activity={{ ...baseActivity, action }} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
