import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "../toast";

function TestConsumer() {
  const { toast } = useToast();
  return (
    <div>
      <button onClick={() => toast("Success message", "success")}>
        Success
      </button>
      <button onClick={() => toast("Error message", "error")}>Error</button>
      <button onClick={() => toast("Info message")}>Info</button>
    </div>
  );
}

describe("ToastProvider + useToast", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("adds and displays a toast", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );
    await user.click(screen.getByText("Success"));
    expect(screen.getByText("Success message")).toBeInTheDocument();
  });

  it("auto-removes toast after 5 seconds", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );
    await user.click(screen.getByText("Info"));
    expect(screen.getByText("Info message")).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.queryByText("Info message")).not.toBeInTheDocument();
  });

  it("removes toast manually via close button", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );
    await user.click(screen.getByText("Error"));
    expect(screen.getByText("Error message")).toBeInTheDocument();
    await user.click(screen.getByText("\u00d7"));
    expect(screen.queryByText("Error message")).not.toBeInTheDocument();
  });

  it("applies success color", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );
    await user.click(screen.getByText("Success"));
    const toastEl = screen
      .getByText("Success message")
      .closest(".bg-green-600");
    expect(toastEl).toBeInTheDocument();
  });

  it("applies error color", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );
    await user.click(screen.getByText("Error"));
    const toastEl = screen.getByText("Error message").closest(".bg-red-600");
    expect(toastEl).toBeInTheDocument();
  });

  it("applies info color by default", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>,
    );
    await user.click(screen.getByText("Info"));
    const toastEl = screen.getByText("Info message").closest(".bg-blue-600");
    expect(toastEl).toBeInTheDocument();
  });

  it("throws when used outside provider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      "useToast must be used within ToastProvider",
    );
    spy.mockRestore();
  });
});
