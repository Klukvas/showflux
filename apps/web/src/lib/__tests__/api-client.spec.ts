import {
  api,
  setAccessToken,
  getAccessToken,
  ApiClientError,
} from "../api-client";

const mockFetch = jest.fn();
global.fetch = mockFetch;

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: "OK",
    json: () => Promise.resolve(body),
    headers: new Headers(),
    redirected: false,
    type: "basic",
    url: "",
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: jest.fn(),
    blob: jest.fn(),
    formData: jest.fn(),
    text: jest.fn(),
    bytes: jest.fn(),
  } as unknown as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
  setAccessToken(null);
});

describe("api.get", () => {
  it("sends GET request with correct URL and headers", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));
    const result = await api.get("/users");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/users"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
    expect(result).toEqual({ id: 1 });
  });
});

describe("api.post", () => {
  it("sends POST with JSON body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await api.post("/users", { name: "John" });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/users"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "John" }),
      }),
    );
  });
});

describe("api.patch", () => {
  it("sends PATCH with JSON body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await api.patch("/users/1", { name: "Jane" });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/1"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "Jane" }),
      }),
    );
  });
});

describe("api.del", () => {
  it("sends DELETE request", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(undefined, 204));
    await api.del("/users/1");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/1"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("setAccessToken", () => {
  it("attaches Authorization header when token is set", async () => {
    setAccessToken("my-token");
    mockFetch.mockResolvedValueOnce(jsonResponse({}));
    await api.get("/test");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer my-token" }),
      }),
    );
  });

  it("stores and retrieves token via getAccessToken", () => {
    setAccessToken("abc");
    expect(getAccessToken()).toBe("abc");
  });
});

describe("401 refresh flow", () => {
  it("retries with new token after 401", async () => {
    setAccessToken("expired");

    mockFetch
      .mockResolvedValueOnce(jsonResponse({}, 401)) // original 401
      .mockResolvedValueOnce(jsonResponse({ accessToken: "refreshed" })) // refresh call
      .mockResolvedValueOnce(jsonResponse({ data: "ok" })); // retry

    const result = await api.get("/protected");
    expect(result).toEqual({ data: "ok" });
    expect(getAccessToken()).toBe("refreshed");
  });

  it("shares single refresh promise for concurrent 401s", async () => {
    setAccessToken("expired");

    mockFetch
      .mockResolvedValueOnce(jsonResponse({}, 401)) // req1 -> 401
      .mockResolvedValueOnce(jsonResponse({}, 401)) // req2 -> 401
      .mockResolvedValueOnce(jsonResponse({ accessToken: "new" })) // single refresh
      .mockResolvedValueOnce(jsonResponse({ a: 1 })) // req1 retry
      .mockResolvedValueOnce(jsonResponse({ b: 2 })); // req2 retry

    const [r1, r2] = await Promise.all([api.get("/a"), api.get("/b")]);
    expect(r1).toEqual({ a: 1 });
    expect(r2).toEqual({ b: 2 });
    // refresh endpoint called only once
    const refreshCalls = mockFetch.mock.calls.filter(([url]: [string]) =>
      url.includes("/auth/refresh"),
    );
    expect(refreshCalls).toHaveLength(1);
  });
});

describe("error handling", () => {
  it("throws ApiClientError on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ statusCode: 400, message: "Bad request" }, 400),
    );
    try {
      await api.get("/fail");
      throw new Error("should not reach");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
      expect((err as ApiClientError).statusCode).toBe(400);
      expect((err as ApiClientError).message).toBe("Bad request");
    }
  });

  it("returns undefined for 204 No Content", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(undefined, 204));
    const result = await api.del("/resource");
    expect(result).toBeUndefined();
  });
});
