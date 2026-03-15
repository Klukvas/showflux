import { renderHook, act, waitFor } from "@testing-library/react";
import { useSubscription } from "../hooks/use-subscription";

const mockRefetch = jest.fn();
let mockFetchReturn: {
  data: unknown;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
} = {
  data: null,
  error: null,
  isLoading: false,
  refetch: mockRefetch,
};

jest.mock("@/hooks/use-fetch", () => ({
  useFetch: () => mockFetchReturn,
}));

const mockPost = jest.fn();
jest.mock("@/lib/api-client", () => ({
  api: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

describe("useSubscription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchReturn = {
      data: null,
      error: null,
      isLoading: false,
      refetch: mockRefetch,
    };
  });

  it("returns subscription data from useFetch", () => {
    const subscriptionData = {
      plan: "team",
      status: "active",
      hasSubscription: true,
      currentPeriodEnd: "2026-05-01",
      trialEndsAt: null,
    };
    mockFetchReturn = {
      data: subscriptionData,
      error: null,
      isLoading: false,
      refetch: mockRefetch,
    };

    const { result } = renderHook(() => useSubscription());

    expect(result.current.subscription).toEqual(subscriptionData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("createCheckout calls api.post with correct endpoint and plan", async () => {
    const checkoutResult = { transactionId: "txn_123" };
    mockPost.mockResolvedValueOnce(checkoutResult);

    const { result } = renderHook(() => useSubscription());

    let response: unknown;
    await act(async () => {
      response = await result.current.createCheckout("team");
    });

    expect(mockPost).toHaveBeenCalledWith("/subscription/checkout", {
      plan: "team",
    });
    expect(response).toEqual(checkoutResult);
  });

  it("cancelSubscription calls api.post and refetches", async () => {
    mockPost.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useSubscription());

    await act(async () => {
      await result.current.cancelSubscription();
    });

    expect(mockPost).toHaveBeenCalledWith("/subscription/cancel");
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("updatePlan calls api.post with correct endpoint and plan, then refetches", async () => {
    mockPost.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useSubscription());

    await act(async () => {
      await result.current.updatePlan("agency");
    });

    expect(mockPost).toHaveBeenCalledWith("/subscription/update-plan", {
      plan: "agency",
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("returns loading state from useFetch", () => {
    mockFetchReturn = {
      data: null,
      error: null,
      isLoading: true,
      refetch: mockRefetch,
    };

    const { result } = renderHook(() => useSubscription());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.subscription).toBeNull();
  });

  it("returns error state from useFetch", () => {
    mockFetchReturn = {
      data: null,
      error: "Network error",
      isLoading: false,
      refetch: mockRefetch,
    };

    const { result } = renderHook(() => useSubscription());

    expect(result.current.error).toBe("Network error");
  });
});
