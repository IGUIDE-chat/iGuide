import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  toThreadMessage,
  fromThreadMessage,
  isChatMessage,
  isThreadMessageLike,
} from "../messageAdapter";
import type { ChatMessage, ThinkingStep } from "../../../../types";

describe("messageAdapter", () => {
  const mockThinkingStep: ThinkingStep = {
    id: "step-1",
    type: "reasoning",
    label: "Thinking",
    timestamp: Date.now(),
    done: false,
  };

  const mockChatMessage: ChatMessage = {
    id: "msg-1",
    role: "user",
    text: "Hello, world!",
    isStreaming: false,
    followUpQuestions: ["What's next?"],
    thinkingSteps: [mockThinkingStep],
    isThinking: false,
  };

  describe("toThreadMessage", () => {
    it("should convert user ChatMessage to ThreadMessageLike", () => {
      const result = toThreadMessage(mockChatMessage);

      assert.equal(result.id, "msg-1");
      assert.equal(result.role, "user");
      assert.notEqual(typeof result.content, "string");
      const firstPart = Array.isArray(result.content)
        ? result.content[0]
        : null;
      assert.equal(firstPart?.type, "text");
      assert.equal(
        (firstPart as { type: "text"; text: string }).text,
        "Hello, world!"
      );
      assert.deepEqual(result.metadata?.custom, {
        thinkingSteps: [mockThinkingStep],
        isThinking: false,
        followUpQuestions: ["What's next?"],
        isStreaming: false,
      });
    });

    it("should convert model ChatMessage to ThreadMessageLike with assistant role", () => {
      const modelMessage: ChatMessage = {
        ...mockChatMessage,
        role: "model",
      };

      const result = toThreadMessage(modelMessage);

      assert.equal(result.role, "assistant");
    });
  });

  describe("fromThreadMessage", () => {
    it("should convert ThreadMessageLike back to ChatMessage", () => {
      const threadMessage = toThreadMessage(mockChatMessage);
      const result = fromThreadMessage(threadMessage);

      assert.equal(result.id, "msg-1");
      assert.equal(result.role, "user");
      assert.equal(result.text, "Hello, world!");
      assert.deepEqual(result.followUpQuestions, ["What's next?"]);
      assert.deepEqual(result.thinkingSteps, [mockThinkingStep]);
      assert.equal(result.isThinking, false);
      assert.equal(result.isStreaming, false);
    });

    it("should convert assistant ThreadMessageLike back to model role", () => {
      const threadMessage = toThreadMessage({
        ...mockChatMessage,
        role: "model",
      });
      const result = fromThreadMessage(threadMessage);

      assert.equal(result.role, "model");
    });
  });

  describe("isChatMessage", () => {
    it("should return true for valid ChatMessage", () => {
      assert.equal(isChatMessage(mockChatMessage), true);
    });

    it("should return false for null", () => {
      assert.equal(isChatMessage(null), false);
    });

    it("should return false for object missing required fields", () => {
      assert.equal(isChatMessage({ id: "1" }), false);
    });

    it("should return false for invalid role", () => {
      assert.equal(
        isChatMessage({ id: "1", role: "invalid", text: "hi" }),
        false
      );
    });
  });

  describe("isThreadMessageLike", () => {
    it("should return true for valid ThreadMessageLike", () => {
      const threadMessage = toThreadMessage(mockChatMessage);
      assert.equal(isThreadMessageLike(threadMessage), true);
    });

    it("should return false for null", () => {
      assert.equal(isThreadMessageLike(null), false);
    });

    it("should return false for object missing required fields", () => {
      assert.equal(isThreadMessageLike({ id: "1" }), false);
    });

    it("should return false for invalid role", () => {
      assert.equal(isThreadMessageLike({ id: "1", role: "invalid" }), false);
    });
  });
});
