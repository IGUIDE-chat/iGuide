import { describe, it, expect } from "vitest";
import { extractFollowUps } from "./followUpExtraction";

describe("extractFollowUps", () => {
  it("extracts follow-up questions with bullet points", () => {
    const result = extractFollowUps(
      "answer\n\n💡 你可能还想了解：\n- Q1\n- Q2"
    );
    expect(result).toEqual(["Q1", "Q2"]);
  });

  it("returns null when no header is present", () => {
    const result = extractFollowUps("answer with no header");
    expect(result).toBeNull();
  });

  it("returns null for English text without header", () => {
    const result = extractFollowUps("Some answer");
    expect(result).toBeNull();
  });

  it("extracts questions with Chinese colon separator", () => {
    const result = extractFollowUps("text\n\n💡您可能还想了解:\n1. item");
    expect(result).toEqual(["item"]);
  });

  it("handles 您 variant character", () => {
    const result = extractFollowUps(
      "answer\n\n💡 您可能还想了解：\n- question 1\n- question 2"
    );
    expect(result).toEqual(["question 1", "question 2"]);
  });

  it("cleans leading markers from lines (numbers, dots, brackets, dashes)", () => {
    const result = extractFollowUps(
      "text\n\n💡 你可能还想了解：\n- item\n* item2\n1. item3\n[1] item4"
    );
    expect(result).toEqual(["item", "item2", "item3", "item4"]);
  });

  it("filters empty lines and lines with only whitespace", () => {
    const result = extractFollowUps(
      "text\n\n💡 你可能还想了解：\n- Q1\n  \n- Q2\n\n"
    );
    expect(result).toEqual(["Q1", "Q2"]);
  });

  it("filters lines longer than 150 characters", () => {
    const longLine = "a".repeat(160);
    const shortLine = "Q1";
    const result = extractFollowUps(
      `text\n\n💡 你可能还想了解：\n- ${longLine}\n- ${shortLine}`
    );
    expect(result).toEqual(["Q1"]);
  });

  it("returns null when header is found but all questions are empty", () => {
    const result = extractFollowUps("text\n\n💡 你可能还想了解：\n  \n  ");
    expect(result).toBeNull();
  });

  it("returns null for empty string", () => {
    const result = extractFollowUps("");
    expect(result).toBeNull();
  });

  it("handles newline before the bulb emoji", () => {
    const result = extractFollowUps(
      "some answer here\n\n💡 你可能还想了解：\n- How to apply?\n- Deadlines?"
    );
    expect(result).toEqual(["How to apply?", "Deadlines?"]);
  });

  it("trims whitespace from extracted questions", () => {
    const result = extractFollowUps(
      "text\n\n💡 你可能还想了解：\n-  question with space  "
    );
    expect(result).toEqual(["question with space"]);
  });
});
