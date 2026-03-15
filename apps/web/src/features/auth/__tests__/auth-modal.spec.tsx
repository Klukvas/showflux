import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthModal } from "../components/auth-modal";

jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node: React.ReactNode) => node,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => "/",
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
  useAuth: () => ({ login: jest.fn(), register: jest.fn() }),
}));

jest.mock("@/lib/api-client", () => ({
  ApiClientError: class extends Error {
    statusCode: number;
    constructor(statusCode: number) {
      super("error");
      this.statusCode = statusCode;
    }
  },
}));

describe("AuthModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders login tab by default", () => {
    render(<AuthModal {...defaultProps} />);
    // "Sign In" appears in both the modal title and a tab
    expect(screen.getAllByText("Sign In").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("renders register tab when initialTab is register", () => {
    render(<AuthModal {...defaultProps} initialTab="register" />);
    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
  });

  it("switches between tabs", async () => {
    const user = userEvent.setup();
    render(<AuthModal {...defaultProps} />);

    // Initially on login tab
    expect(screen.queryByLabelText("Full Name")).not.toBeInTheDocument();

    // Switch to register
    const tabs = screen.getAllByRole("tab");
    const registerTab = tabs.find((tab) => tab.textContent === "Register")!;
    await user.click(registerTab);

    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
  });

  it("resets tab to initialTab when modal reopens", () => {
    const { rerender } = render(<AuthModal {...defaultProps} isOpen={false} />);
    rerender(<AuthModal {...defaultProps} isOpen={true} initialTab="login" />);
    expect(
      screen.getByRole("tab", { name: "Sign In", selected: true }),
    ).toBeInTheDocument();
  });

  it("has tablist with two tabs", () => {
    render(<AuthModal {...defaultProps} />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
  });

  it("has tabpanel", () => {
    render(<AuthModal {...defaultProps} />);
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });
});
