import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListingDetailCard } from "../components/listing-detail-card";
import type { Listing } from "@/types/listing";

const mockPush = jest.fn();
const mockToast = jest.fn();
const mockDel = jest.fn();
const mockUseAuth = jest.fn();

jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node: React.ReactNode) => node,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

jest.mock("@/features/auth/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/components/ui/toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

jest.mock("@/lib/api-client", () => ({
  api: { del: (...args: unknown[]) => mockDel(...args) },
}));

const listing: Listing = {
  id: "l1",
  workspaceId: "w1",
  address: "123 Main St",
  city: "Austin",
  state: "TX",
  zip: "78701",
  mlsNumber: "MLS123",
  price: 500000,
  bedrooms: 3,
  bathrooms: 2,
  sqft: 2000,
  status: "active",
  listingAgentId: "a1",
  listingAgent: {
    id: "a1",
    workspaceId: "w1",
    email: "agent@test.com",
    role: "agent",
    fullName: "Jane Agent",
    avatarUrl: null,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  notes: "Beautiful home",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z",
};

describe("ListingDetailCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: "1", role: "broker", fullName: "Test Broker" },
    });
  });

  it("renders listing details", () => {
    render(<ListingDetailCard listing={listing} />);
    expect(screen.getByText("123 Main St")).toBeInTheDocument();
    expect(screen.getByText("$500,000")).toBeInTheDocument();
    expect(screen.getByText("MLS123")).toBeInTheDocument();
    expect(screen.getByText("Jane Agent")).toBeInTheDocument();
    expect(screen.getByText("Beautiful home")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<ListingDetailCard listing={listing} />);
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("shows Edit and Back buttons", () => {
    render(<ListingDetailCard listing={listing} />);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("shows Delete button for broker", () => {
    render(<ListingDetailCard listing={listing} />);
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("hides Delete button for agent", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "2", role: "agent", fullName: "Test Agent" },
    });
    render(<ListingDetailCard listing={listing} />);
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("opens confirm dialog on Delete click", async () => {
    const user = userEvent.setup();
    render(<ListingDetailCard listing={listing} />);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(
      screen.getByText(/Are you sure you want to delete this listing/),
    ).toBeInTheDocument();
  });

  it("calls delete API on confirm", async () => {
    const user = userEvent.setup();
    mockDel.mockResolvedValue(undefined);
    render(<ListingDetailCard listing={listing} />);
    // Click Delete to open the confirm dialog
    await user.click(screen.getByRole("button", { name: "Delete" }));
    // Now there are 2 "Delete" buttons - the original and the confirm dialog one.
    // Click the confirm dialog's Delete button (which has confirmLabel="Delete")
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[deleteButtons.length - 1]);
    expect(mockDel).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith("Listing deleted", "success");
    expect(mockPush).toHaveBeenCalledWith("/listings");
  });

  it("shows error toast on delete failure", async () => {
    const user = userEvent.setup();
    mockDel.mockRejectedValue(new Error("Permission denied"));
    render(<ListingDetailCard listing={listing} />);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[deleteButtons.length - 1]);
    expect(mockToast).toHaveBeenCalledWith("Permission denied", "error");
  });

  it("shows generic error on non-Error delete failure", async () => {
    const user = userEvent.setup();
    mockDel.mockRejectedValue("unknown");
    render(<ListingDetailCard listing={listing} />);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[deleteButtons.length - 1]);
    expect(mockToast).toHaveBeenCalledWith("Failed to delete", "error");
  });

  it("navigates to edit page on Edit click", async () => {
    const user = userEvent.setup();
    render(<ListingDetailCard listing={listing} />);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(mockPush).toHaveBeenCalledWith("/listings/l1/edit");
  });

  it("navigates to listings on Back click", async () => {
    const user = userEvent.setup();
    render(<ListingDetailCard listing={listing} />);
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(mockPush).toHaveBeenCalledWith("/listings");
  });

  it("renders dash for missing optional fields", () => {
    const minListing: Listing = {
      ...listing,
      bedrooms: null,
      bathrooms: null,
      sqft: null,
      mlsNumber: null,
      listingAgent: undefined,
      notes: null,
    };
    render(<ListingDetailCard listing={minListing} />);
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });
});
