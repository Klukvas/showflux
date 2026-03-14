import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatAddress,
} from "../format";

describe("formatCurrency", () => {
  it("formats whole number", () => {
    expect(formatCurrency(1000)).toBe("$1,000");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0");
  });

  it("formats large number with commas", () => {
    expect(formatCurrency(1500000)).toBe("$1,500,000");
  });
});

describe("formatDate", () => {
  it("formats ISO date string", () => {
    const result = formatDate("2025-06-15T12:00:00.000Z");
    expect(result).toContain("Jun");
    expect(result).toContain("2025");
    expect(result).toContain("15");
  });
});

describe("formatDateTime", () => {
  it("formats ISO string with time", () => {
    const result = formatDateTime("2025-06-15T14:30:00.000Z");
    expect(result).toContain("Jun");
    expect(result).toContain("2025");
  });
});

describe("formatRelativeTime", () => {
  it('returns "just now" for less than 60 seconds ago', () => {
    const now = new Date();
    expect(formatRelativeTime(now.toISOString())).toBe("just now");
  });

  it("returns minutes ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours ago", () => {
    const threeHoursAgo = new Date(
      Date.now() - 3 * 60 * 60 * 1000,
    ).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe("3h ago");
  });

  it("returns days ago", () => {
    const twoDaysAgo = new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(formatRelativeTime(twoDaysAgo)).toBe("2d ago");
  });

  it("returns formatted date for 7+ days ago", () => {
    const twoWeeksAgo = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const result = formatRelativeTime(twoWeeksAgo);
    expect(result).not.toContain("ago");
    expect(result).toContain(String(new Date().getFullYear()));
  });
});

describe("formatAddress", () => {
  it("concatenates address parts", () => {
    expect(formatAddress("123 Main St", "Austin", "TX", "78701")).toBe(
      "123 Main St, Austin, TX 78701",
    );
  });
});
