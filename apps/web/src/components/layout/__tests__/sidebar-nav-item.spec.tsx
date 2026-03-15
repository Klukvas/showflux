import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidebarNavItem } from "../sidebar-nav-item";

const mockUsePathname = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
    className?: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("SidebarNavItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders label and icon", () => {
    mockUsePathname.mockReturnValue("/other");
    render(
      <SidebarNavItem href="/dashboard" icon={<span>icon</span>} label="Dashboard" />,
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("icon")).toBeInTheDocument();
  });

  it("applies active styles when pathname matches exactly", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    const { container } = render(
      <SidebarNavItem href="/dashboard" icon={<span>icon</span>} label="Dashboard" />,
    );
    expect(container.querySelector("a")).toHaveClass("bg-blue-50", "text-blue-700");
  });

  it("applies active styles when pathname starts with href", () => {
    mockUsePathname.mockReturnValue("/dashboard/stats");
    const { container } = render(
      <SidebarNavItem href="/dashboard" icon={<span>icon</span>} label="Dashboard" />,
    );
    expect(container.querySelector("a")).toHaveClass("bg-blue-50");
  });

  it("applies inactive styles when pathname does not match", () => {
    mockUsePathname.mockReturnValue("/settings");
    const { container } = render(
      <SidebarNavItem href="/dashboard" icon={<span>icon</span>} label="Dashboard" />,
    );
    expect(container.querySelector("a")).toHaveClass("text-gray-700");
    expect(container.querySelector("a")).not.toHaveClass("bg-blue-50");
  });

  it("calls onClick when clicked", async () => {
    mockUsePathname.mockReturnValue("/other");
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <SidebarNavItem
        href="/dashboard"
        icon={<span>icon</span>}
        label="Dashboard"
        onClick={onClick}
      />,
    );
    await user.click(screen.getByText("Dashboard"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("links to correct href", () => {
    mockUsePathname.mockReturnValue("/other");
    render(
      <SidebarNavItem href="/listings" icon={<span>icon</span>} label="Listings" />,
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/listings");
  });
});
