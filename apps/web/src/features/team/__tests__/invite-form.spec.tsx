import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InviteForm } from "../components/invite-form";

const mockToast = jest.fn();

jest.mock("@/components/ui/toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe("InviteForm", () => {
  const onCreateInvite = jest.fn();

  const mockWriteText = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
  });

  it("renders email field and submit button", () => {
    render(<InviteForm onCreateInvite={onCreateInvite} />);
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send Invite" }),
    ).toBeInTheDocument();
  });

  it("submits and shows invite link", async () => {
    const user = userEvent.setup();
    onCreateInvite.mockResolvedValue("abc123");
    render(<InviteForm onCreateInvite={onCreateInvite} />);
    await user.type(
      screen.getByLabelText("Email Address"),
      "agent@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Send Invite" }));
    expect(onCreateInvite).toHaveBeenCalledWith("agent@example.com");
    expect(mockToast).toHaveBeenCalledWith("Invite sent", "success");
    expect(screen.getByText(/invite\/abc123/)).toBeInTheDocument();
  });

  it("copies link to clipboard and shows toast", async () => {
    const user = userEvent.setup();
    onCreateInvite.mockResolvedValue("abc123");
    render(<InviteForm onCreateInvite={onCreateInvite} />);
    await user.type(
      screen.getByLabelText("Email Address"),
      "agent@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Send Invite" }));
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(mockToast).toHaveBeenCalledWith(
      "Link copied to clipboard",
      "success",
    );
  });

  it("does not show invite link initially", () => {
    render(<InviteForm onCreateInvite={onCreateInvite} />);
    expect(screen.queryByText(/invite\//)).not.toBeInTheDocument();
  });
});
