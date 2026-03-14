import { renderHook, waitFor, act } from "@testing-library/react";
import { useFetch } from "../use-fetch";

const mockGet = jest.fn();
jest.mock("@/lib/api-client", () => ({
  api: { get: (...args: unknown[]) => mockGet(...args) },
}));

beforeEach(() => {
  mockGet.mockReset();
});

describe("useFetch", () => {
  it("starts in loading state when path is provided", () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useFetch("/users"));
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("sets data on success", async () => {
    mockGet.mockResolvedValue([{ id: 1 }]);
    const { result } = renderHook(() => useFetch("/users"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([{ id: 1 }]);
    expect(result.current.error).toBeNull();
  });

  it("sets error on failure", async () => {
    mockGet.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useFetch("/users"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Network error");
  });

  it("uses fallback message for non-Error rejection", async () => {
    mockGet.mockRejectedValue("plain string");
    const { result } = renderHook(() => useFetch("/users"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Failed to fetch data");
  });

  it("does not fetch when path is null", () => {
    const { result } = renderHook(() => useFetch(null));
    expect(result.current.isLoading).toBe(false);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("clears stale data when path changes", async () => {
    mockGet.mockResolvedValue({ first: true });
    const { result, rerender } = renderHook(
      ({ path }: { path: string }) => useFetch(path),
      { initialProps: { path: "/a" } },
    );

    await waitFor(() => expect(result.current.data).toEqual({ first: true }));

    mockGet.mockResolvedValue({ second: true });
    rerender({ path: "/b" });

    // data should be cleared while loading new path
    expect(result.current.data).toBeNull();
    await waitFor(() => expect(result.current.data).toEqual({ second: true }));
  });

  it("refetch re-fetches data", async () => {
    mockGet.mockResolvedValue({ v: 1 });
    const { result } = renderHook(() => useFetch("/data"));

    await waitFor(() => expect(result.current.data).toEqual({ v: 1 }));

    mockGet.mockResolvedValue({ v: 2 });
    await act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.data).toEqual({ v: 2 }));
  });

  it("ignores stale request when a newer request completes", async () => {
    let resolveFirst!: (v: unknown) => void;
    const firstPromise = new Promise((r) => {
      resolveFirst = r;
    });
    mockGet.mockReturnValueOnce(firstPromise);

    const { result, rerender } = renderHook(
      ({ path }: { path: string }) => useFetch(path),
      { initialProps: { path: "/slow" } },
    );

    // Start second request before first resolves
    mockGet.mockResolvedValueOnce({ fast: true });
    rerender({ path: "/fast" });

    await waitFor(() => expect(result.current.data).toEqual({ fast: true }));

    // Resolve stale first request — should be ignored
    resolveFirst({ stale: true });
    // Data should still be from the second request
    await waitFor(() => expect(result.current.data).toEqual({ fast: true }));
  });
});
