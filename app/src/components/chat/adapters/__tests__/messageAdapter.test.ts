import { describe, it, expect } from "bun:test";
import {
  toThreadMessage,
  fromThreadMessage,
  isChatMessage,
  isThreadMessageLike,
} from "../messageAdapter";
import type { ChatMessage, ThinkingStep } from "../../../types";

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

      expect(result.id).toBe("msg-1");
      expect(result.role).toBe("user");
      expect(result.content[0].type).toBe("text");
      expect((result.content[0] as { type: "text"; text: string }).text).toBe(
        "Hello, world!"
      );
      expect(result.metadata?.custom).toEqual({
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

      expect(result.role).toBe("assistant");
    });
  });

  describe("fromThreadMessage", () => {
    it("should convert ThreadMessageLike back to ChatMessage", () => {
      const threadMessage = toThreadMessage(mockChatMessage);
      const result = fromThreadMessage(threadMessage);

      expect(result.id).toBe("msg-1");
      expect(result.role).toBe("user");
      expect(result.text).toBe("Hello, world!");
      expect(result.followUpQuestions).toEqual(["What's next?"]);
      expect(result.thinkingSteps).toEqual([mockThinkingStep]);
      expect(result.isThinking).toBe(false);
      expect(result.isStreaming).toBe(false);
    });

    it("should convert assistant ThreadMessageLike back to model role", () => {
      const threadMessage = toThreadMessage({
        ...mockChatMessage,
        role: "model",
      });
      const result = fromThreadMessage(threadMessage);

      expect(result.role).toBe("model");
    });
  });

  describe("isChatMessage", () => {
    it("should return true for valid ChatMessage", () => {
      expect(isChatMessage(mockChatMessage)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isChatMessage(null)).toBe(false);
    });

    it("should return false for object missing required fields", () => {
      expect(isChatMessage({ id: "1" })).toBe(false);
    });

    it("should return false for invalid role", () => {
      expect(isChatMessage({ id: "1", role: "invalid", text: "hi" })).toBe(
        false
      );
    });
  });

  describe("isThreadMessageLike", () => {
    it("should return true for valid ThreadMessageLike", () => {
      const threadMessage = toThreadMessage(mockChatMessage);
      expect(isThreadMessageLike(threadMessage)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isThreadMessageLike(null)).toBe(false);
    });

    it("should return false for object missing required fields", () => {
      expect(isThreadMessageLike({ id: "1" })).toBe(false);
    });

    it("should return false for invalid role", () => {
      expect(
        isThreadMessageLike({ id: "1", role: "invalid" })
      ).toBe(false);
    });
  });
});
