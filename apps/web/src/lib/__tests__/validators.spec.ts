import {
  required,
  email,
  minLength,
  maxLength,
  strongPassword,
  matchesField,
  positiveNumber,
  compose,
} from "../validators";
import { PASSWORD_REQUIREMENTS } from "../constants";

describe("required", () => {
  const validate = required("Name");

  it("returns error for empty string", () => {
    expect(validate("")).toBe("Name is required");
  });

  it("returns error for whitespace-only string", () => {
    expect(validate("   ")).toBe("Name is required");
  });

  it("returns null for valid input", () => {
    expect(validate("John")).toBeNull();
  });
});

describe("email", () => {
  it("returns error for empty string", () => {
    expect(email("")).toBe("Email is required");
  });

  it("returns error for whitespace-only string", () => {
    expect(email("   ")).toBe("Email is required");
  });

  it("returns error for invalid format (no @)", () => {
    expect(email("invalid")).toBe("Invalid email address");
  });

  it("returns error for invalid format (no domain)", () => {
    expect(email("user@")).toBe("Invalid email address");
  });

  it("returns null for valid email", () => {
    expect(email("user@example.com")).toBeNull();
  });
});

describe("minLength", () => {
  const validate = minLength("Password", 8);

  it("returns error when too short", () => {
    expect(validate("abc")).toBe("Password must be at least 8 characters");
  });

  it("returns null at exact boundary", () => {
    expect(validate("12345678")).toBeNull();
  });

  it("returns null when longer", () => {
    expect(validate("123456789")).toBeNull();
  });
});

describe("maxLength", () => {
  const validate = maxLength("Title", 5);

  it("returns error when too long", () => {
    expect(validate("123456")).toBe("Title must be at most 5 characters");
  });

  it("returns null at exact boundary", () => {
    expect(validate("12345")).toBeNull();
  });

  it("returns null when shorter", () => {
    expect(validate("abc")).toBeNull();
  });
});

describe("strongPassword", () => {
  it("returns error for empty string", () => {
    expect(strongPassword("")).toBe("Password is required");
  });

  it("returns error for missing uppercase", () => {
    expect(strongPassword("abcd1234!")).toBe(PASSWORD_REQUIREMENTS);
  });

  it("returns error for missing lowercase", () => {
    expect(strongPassword("ABCD1234!")).toBe(PASSWORD_REQUIREMENTS);
  });

  it("returns error for missing digit", () => {
    expect(strongPassword("Abcdefgh!")).toBe(PASSWORD_REQUIREMENTS);
  });

  it("returns error for missing special character", () => {
    expect(strongPassword("Abcdefg1")).toBe(PASSWORD_REQUIREMENTS);
  });

  it("returns error for too short", () => {
    expect(strongPassword("Ab1!")).toBe(PASSWORD_REQUIREMENTS);
  });

  it("returns null for valid password", () => {
    expect(strongPassword("Abcdefg1!")).toBeNull();
  });
});

describe("matchesField", () => {
  const validate = matchesField("password", "Passwords");

  it("returns null when fields match", () => {
    expect(validate("secret", { password: "secret" })).toBeNull();
  });

  it("returns error when fields do not match", () => {
    expect(validate("other", { password: "secret" })).toBe(
      "Passwords must match",
    );
  });
});

describe("positiveNumber", () => {
  const validate = positiveNumber("Price");

  it("returns error for NaN", () => {
    expect(validate("abc")).toBe("Price must be a positive number");
  });

  it("returns error for zero", () => {
    expect(validate("0")).toBe("Price must be a positive number");
  });

  it("returns error for negative", () => {
    expect(validate("-5")).toBe("Price must be a positive number");
  });

  it("returns null for positive number", () => {
    expect(validate("10")).toBeNull();
  });
});

describe("compose", () => {
  it("short-circuits on first error", () => {
    const validate = compose(required("Name"), minLength("Name", 3));
    expect(validate("")).toBe("Name is required");
  });

  it("returns second error when first passes", () => {
    const validate = compose(required("Name"), minLength("Name", 5));
    expect(validate("ab")).toBe("Name must be at least 5 characters");
  });

  it("returns null when all validators pass", () => {
    const validate = compose(required("Name"), minLength("Name", 2));
    expect(validate("John")).toBeNull();
  });
});
