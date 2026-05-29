import { describe, expect, it } from "vite-plus/test";
import { extractMemoryTags } from "./memoryTagExtraction";

describe("extractMemoryTags", () => {
  it("extracts user_soul and returns cleaned text", () => {
    const result = extractMemoryTags("hello <user_soul>likes ramen</user_soul> bye");
    expect(result.userSoul).toBe("likes ramen");
    expect(result.cleaned).toBe("hello  bye".trim());
    expect(result.userMemory).toBeUndefined();
    expect(result.convMemory).toBeUndefined();
  });

  it("trims whitespace from cleaned text", () => {
    const result = extractMemoryTags("hello <user_soul>likes ramen</user_soul> bye");
    expect(result.cleaned).toBe("hello  bye".trim());
  });

  it("does not extract unclosed tag content and strips partial tag", () => {
    const result = extractMemoryTags("partial <user_soul>foo");
    expect(result.userSoul).toBeUndefined();
    expect(result.cleaned).toBe("partial");
  });

  it("extracts multiple tags", () => {
    const result = extractMemoryTags("<user_soul>A</user_soul> <user_memory>B</user_memory>");
    expect(result.userSoul).toBe("A");
    expect(result.userMemory).toBe("B");
    expect(result.convMemory).toBeUndefined();
    expect(result.cleaned).toBe("");
  });

  it("returns all undefined and original text when no tags present", () => {
    const result = extractMemoryTags("plain text");
    expect(result.userSoul).toBeUndefined();
    expect(result.userMemory).toBeUndefined();
    expect(result.convMemory).toBeUndefined();
    expect(result.cleaned).toBe("plain text");
  });

  it("extracts conv_memory", () => {
    const result = extractMemoryTags("text <conv_memory>summary here</conv_memory> end");
    expect(result.convMemory).toBe("summary here");
    expect(result.cleaned).toBe("text  end".trim());
  });

  it("extracts all three tags simultaneously", () => {
    const result = extractMemoryTags(
      "response <user_soul>soul</user_soul> <user_memory>mem</user_memory> <conv_memory>conv</conv_memory>",
    );
    expect(result.userSoul).toBe("soul");
    expect(result.userMemory).toBe("mem");
    expect(result.convMemory).toBe("conv");
    expect(result.cleaned).toBe("response");
  });

  it("trims whitespace inside tag content", () => {
    const result = extractMemoryTags("<user_soul>  spaced content  </user_soul>");
    expect(result.userSoul).toBe("spaced content");
  });

  it("strips unclosed user_memory partial tag", () => {
    const result = extractMemoryTags("before <user_memory>incomplete");
    expect(result.userMemory).toBeUndefined();
    expect(result.cleaned).toBe("before");
  });

  it("strips unclosed conv_memory partial tag", () => {
    const result = extractMemoryTags("text <conv_memory>partial");
    expect(result.convMemory).toBeUndefined();
    expect(result.cleaned).toBe("text");
  });

  it("handles empty string input", () => {
    const result = extractMemoryTags("");
    expect(result.userSoul).toBeUndefined();
    expect(result.userMemory).toBeUndefined();
    expect(result.convMemory).toBeUndefined();
    expect(result.cleaned).toBe("");
  });

  it("handles multiline tag content", () => {
    const result = extractMemoryTags("text <user_soul>line one\nline two</user_soul> end");
    expect(result.userSoul).toBe("line one\nline two");
    expect(result.cleaned).toBe("text  end".trim());
  });
});
