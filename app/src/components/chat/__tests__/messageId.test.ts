import { describe, it } from "node:test";
import assert from "node:assert/strict";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe("Message ID Generation", () => {
  it("should generate valid UUIDs with crypto.randomUUID()", () => {
    const id = crypto.randomUUID();
    assert.match(id, UUID_REGEX);
  });

  it("should generate unique UUIDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(crypto.randomUUID());
    }
    assert.equal(ids.size, 100);
  });

  it("should match UUID format: 8-4-4-4-12 hex pattern", () => {
    const id = crypto.randomUUID();
    const parts = id.split("-");
    assert.equal(parts.length, 5);
    assert.equal(parts[0].length, 8);
    assert.equal(parts[1].length, 4);
    assert.equal(parts[2].length, 4);
    assert.equal(parts[3].length, 4);
    assert.equal(parts[4].length, 12);
    assert.match(id, UUID_REGEX);
  });
});
