import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileNav } from "../mobile-nav";

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
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

jest.mock("@/features/auth/hooks/use-auth", () => ({
  useAuth: () => ({ user: { role: "broker" } }),
}));

describe("MobileNav", () => {
  beforeEach(() => {
    document.body.style.overflow = "";
  });

  it("returns null when closed", () => {
    const { container } = render(<MobileNav isOpen={false} onClose={jest.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders sidebar when open", () => {
    render(<MobileNav isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText("ShowFlux")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("locks body scroll when open", () => {
    render(<MobileNav isOpen={true} onClose={jest.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body scroll when closed", () => {
    const { rerender } = render(<MobileNav isOpen={true} onClose={jest.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");
    rerender(<MobileNav isOpen={false} onClose={jest.fn()} />);
    expect(document.body.style.overflow).toBe("");
  });

  it("restores body scroll on unmount", () => {
    const { unmount } = render(<MobileNav isOpen={true} onClose={jest.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("calls onClose when backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const { container } = render(<MobileNav isOpen={true} onClose={onClose} />);
    const backdrop = container.querySelector(".bg-black\\/50")!;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
