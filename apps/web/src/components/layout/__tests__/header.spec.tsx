import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "../header";

const mockLogout = jest.fn();

jest.mock("@/features/auth/hooks/use-auth", () => ({
  useAuth: () => ({
    user: { id: "1", role: "broker", fullName: "Jane Broker" },
    logout: mockLogout,
  }),
}));

describe("Header", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders user name and role", () => {
    render(<Header onMenuToggle={jest.fn()} />);
    expect(screen.getByText("Jane Broker")).toBeInTheDocument();
    expect(screen.getByText("broker")).toBeInTheDocument();
  });

  it("renders logout button", () => {
    render(<Header onMenuToggle={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it("calls logout when clicked", async () => {
    const user = userEvent.setup();
    render(<Header onMenuToggle={jest.fn()} />);
    await user.click(screen.getByRole("button", { name: "Logout" }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("renders menu toggle button", () => {
    render(<Header onMenuToggle={jest.fn()} />);
    expect(screen.getByLabelText("Toggle menu")).toBeInTheDocument();
  });

  it("calls onMenuToggle when menu button is clicked", async () => {
    const user = userEvent.setup();
    const onMenuToggle = jest.fn();
    render(<Header onMenuToggle={onMenuToggle} />);
    await user.click(screen.getByLabelText("Toggle menu"));
    expect(onMenuToggle).toHaveBeenCalledTimes(1);
  });
});
