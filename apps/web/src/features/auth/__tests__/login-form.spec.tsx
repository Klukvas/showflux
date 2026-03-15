import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../components/login-form";

const mockLogin = jest.fn();
const mockPush = jest.fn();

jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node: React.ReactNode) => node,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  usePathname: () => "/login",
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

jest.mock("../hooks/use-auth", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders email and password fields", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders sign in button", () => {
    render(<LoginForm />);
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows validation errors on empty submit", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("calls login and redirects to dashboard on success", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);
    render(<LoginForm />);
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("calls onSuccess instead of router.push when provided", async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    mockLogin.mockResolvedValue(undefined);
    render(<LoginForm onSuccess={onSuccess} />);
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(onSuccess).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("displays server error on login failure", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error("Invalid credentials"));
    render(<LoginForm />);
    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  it("renders without Card wrapper when embedded", () => {
    const { container } = render(<LoginForm embedded />);
    expect(container.querySelector("form")).toBeInTheDocument();
    // The form itself has no Card wrapper — the first child is the form, not a Card div
    expect(container.firstElementChild?.tagName).toBe("FORM");
  });

  it("shows switch-to-register button when callback provided", () => {
    const onSwitch = jest.fn();
    render(<LoginForm onSwitchToRegister={onSwitch} />);
    expect(
      screen.getByRole("button", { name: "Register" }),
    ).toBeInTheDocument();
  });

  it("shows forgot password link", () => {
    render(<LoginForm />);
    expect(screen.getByText("Forgot password?")).toBeInTheDocument();
  });
});
