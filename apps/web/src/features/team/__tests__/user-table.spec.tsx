import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserTable } from "../components/user-table";
import type { User } from "@/types/user";

jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node: React.ReactNode) => node,
}));

const mockToast = jest.fn();
jest.mock("@/components/ui/toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

const users: User[] = [
  {
    id: "1",
    workspaceId: "w1",
    email: "broker@test.com",
    role: "broker",
    fullName: "Jane Broker",
    avatarUrl: null,
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    workspaceId: "w1",
    email: "agent@test.com",
    role: "agent",
    fullName: "John Agent",
    avatarUrl: null,
    isActive: false,
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
];

describe("UserTable", () => {
  const onToggleActive = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders user names and emails", () => {
    render(
      <UserTable
        data={users}
        isLoading={false}
        onToggleActive={onToggleActive}
      />,
    );
    expect(screen.getByText("Jane Broker")).toBeInTheDocument();
    expect(screen.getByText("broker@test.com")).toBeInTheDocument();
    expect(screen.getByText("John Agent")).toBeInTheDocument();
  });

  it("renders role badges", () => {
    render(
      <UserTable
        data={users}
        isLoading={false}
        onToggleActive={onToggleActive}
      />,
    );
    expect(screen.getByText("broker")).toBeInTheDocument();
    expect(screen.getByText("agent")).toBeInTheDocument();
  });

  it("renders active/inactive status badges", () => {
    render(
      <UserTable
        data={users}
        isLoading={false}
        onToggleActive={onToggleActive}
      />,
    );
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("shows Deactivate for active users and Reactivate for inactive", () => {
    render(
      <UserTable
        data={users}
        isLoading={false}
        onToggleActive={onToggleActive}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Deactivate" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reactivate" }),
    ).toBeInTheDocument();
  });

  it("opens confirm dialog when toggle button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <UserTable
        data={users}
        isLoading={false}
        onToggleActive={onToggleActive}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    expect(
      screen.getByText(/Are you sure you want to deactivate Jane Broker/),
    ).toBeInTheDocument();
  });

  it("shows empty state when no data", () => {
    render(
      <UserTable data={[]} isLoading={false} onToggleActive={onToggleActive} />,
    );
    expect(screen.getByText("No team members")).toBeInTheDocument();
  });

  it("shows loading skeleton", () => {
    const { container } = render(
      <UserTable data={null} isLoading onToggleActive={onToggleActive} />,
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
  });

  it("calls onToggleActive and shows success toast on confirm", async () => {
    const user = userEvent.setup();
    onToggleActive.mockResolvedValue(undefined);
    render(
      <UserTable
        data={users}
        isLoading={false}
        onToggleActive={onToggleActive}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    // Click the confirm button in the dialog (also labeled "Deactivate")
    const confirmBtns = screen.getAllByRole("button", { name: "Deactivate" });
    await user.click(confirmBtns[confirmBtns.length - 1]);
    expect(onToggleActive).toHaveBeenCalledWith(users[0]);
    expect(mockToast).toHaveBeenCalledWith(
      "Jane Broker deactivated",
      "success",
    );
  });

  it("shows error toast when toggle fails", async () => {
    const user = userEvent.setup();
    onToggleActive.mockRejectedValue(new Error("Server error"));
    render(
      <UserTable
        data={users}
        isLoading={false}
        onToggleActive={onToggleActive}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    const confirmBtns = screen.getAllByRole("button", { name: "Deactivate" });
    await user.click(confirmBtns[confirmBtns.length - 1]);
    expect(mockToast).toHaveBeenCalledWith("Server error", "error");
  });

  it("shows generic error toast for non-Error throws", async () => {
    const user = userEvent.setup();
    onToggleActive.mockRejectedValue("unknown");
    render(
      <UserTable
        data={users}
        isLoading={false}
        onToggleActive={onToggleActive}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    const confirmBtns = screen.getAllByRole("button", { name: "Deactivate" });
    await user.click(confirmBtns[confirmBtns.length - 1]);
    expect(mockToast).toHaveBeenCalledWith("Action failed", "error");
  });

  it("shows reactivate confirm for inactive user", async () => {
    const user = userEvent.setup();
    render(
      <UserTable
        data={users}
        isLoading={false}
        onToggleActive={onToggleActive}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Reactivate" }));
    expect(
      screen.getByText(/Are you sure you want to reactivate John Agent/),
    ).toBeInTheDocument();
  });
});
