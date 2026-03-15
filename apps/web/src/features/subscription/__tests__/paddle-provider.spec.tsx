import { render, screen } from "@testing-library/react";
import { PaddleProvider, usePaddle } from "../paddle-provider";

const mockInitializePaddle = jest.fn();

jest.mock("@paddle/paddle-js", () => ({
  initializePaddle: (...args: unknown[]) => mockInitializePaddle(...args),
}));

function PaddleConsumer() {
  const { paddle, isReady } = usePaddle();
  return (
    <div>
      <span data-testid="paddle-status">
        {paddle ? "initialized" : "null"}
      </span>
      <span data-testid="is-ready">{isReady ? "true" : "false"}</span>
    </div>
  );
}

describe("PaddleProvider", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    delete process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("provides paddle=null by default (no client token)", () => {
    render(
      <PaddleProvider>
        <PaddleConsumer />
      </PaddleProvider>,
    );

    expect(screen.getByTestId("paddle-status")).toHaveTextContent("null");
    expect(screen.getByTestId("is-ready")).toHaveTextContent("false");
    expect(mockInitializePaddle).not.toHaveBeenCalled();
  });

  it("initializes Paddle when client token env var is set", async () => {
    const mockPaddleInstance = { Checkout: { open: jest.fn() } };
    mockInitializePaddle.mockResolvedValueOnce(mockPaddleInstance);
    process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN = "test_client_token";
    process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT = "sandbox";

    render(
      <PaddleProvider>
        <PaddleConsumer />
      </PaddleProvider>,
    );

    expect(mockInitializePaddle).toHaveBeenCalledWith({
      token: "test_client_token",
      environment: "sandbox",
    });

    // Wait for the state to update after initialization
    await screen.findByText("initialized");
    expect(screen.getByTestId("is-ready")).toHaveTextContent("true");
  });

  it("children can access paddle context via usePaddle", () => {
    render(
      <PaddleProvider>
        <PaddleConsumer />
      </PaddleProvider>,
    );

    // Consumer renders without crashing and can read context values
    expect(screen.getByTestId("paddle-status")).toBeInTheDocument();
    expect(screen.getByTestId("is-ready")).toBeInTheDocument();
  });
});
