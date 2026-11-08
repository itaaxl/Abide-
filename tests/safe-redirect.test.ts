import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/safe-redirect";

describe("safeNext", () => {
  it("allows approved relative destinations", () => {
    expect(safeNext("/")).toBe("/");
    expect(safeNext("/library")).toBe("/library");
    expect(safeNext("/bible/eng-web/JHN/3?v=16#v16")).toBe("/bible/eng-web/JHN/3?v=16#v16");
    expect(safeNext("/auth/reset")).toBe("/auth/reset");
  });
  it("rejects open redirects and unknown paths", () => {
    expect(safeNext("https://evil.example")).toBe("/");
    expect(safeNext("//evil.example/path")).toBe("/");
    expect(safeNext("/\\evil.example")).toBe("/");
    expect(safeNext("javascript:alert(1)")).toBe("/");
    expect(safeNext("/api/secret")).toBe("/");
    expect(safeNext("/libraryx")).toBe("/");
    expect(safeNext(undefined)).toBe("/");
    expect(safeNext("/%2F%2Fevil.example")).toBe("/");
  });
});
