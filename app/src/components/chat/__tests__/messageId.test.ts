import { describe, it, expect } from "bun:test";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("Message ID Generation", () => {
  it("should generate valid UUIDs with crypto.randomUUID()", () => {
    const id = crypto.randomUUID();
    expect(id).toMatch(UUID_REGEX);
  });

  it("should generate unique UUIDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(crypto.randomUUID());
    }
    expect(ids.size).toBe(100);
  });

  it("should match UUID format: 8-4-4-4-12 hex pattern", () => {
    const id = crypto.randomUUID();
    const parts = id.split("-");
    expect(parts).toHaveLength(5);
    expect(parts[0]).toHaveLength(8);
    expect(parts[1]).toHaveLength(4);
    expect(parts[2]).toHaveLength(4);
    expect(parts[3]).toHaveLength(4);
    expect(parts[4]).toHaveLength(12);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
