const COZE_BOT_ID = import.meta.env.VITE_COZE_BOT_ID

export interface StreamResponse {
  text: string
  followUpQuestions?: string[]
  thinkingStep?: {
    type: "reasoning" | "searching" | "tool_call" | "processing"
    label: string
    detail?: string
  }
}

export const streamChatResponse = async function* (
  history: { role: "user" | "model"; text: string }[],
  newMessage: string,
  lang: string = "en",
  conversationId?: string,
  userId?: string,
): AsyncGenerator<StreamResponse> {
  if (import.meta.env.DEV && !COZE_BOT_ID) {
    yield {
      text: "Error: Coze configuration missing in .env.local (Dev Mode).",
    }
    return
  }

  let cozeUserId = userId
  if (!cozeUserId) {
    const STORAGE_KEY = "illini_guest_device_id"
    let guestId = localStorage.getItem(STORAGE_KEY)
    if (!guestId) {
      guestId = "guest_" + Math.random().toString(36).substring(2, 15)
      localStorage.setItem(STORAGE_KEY, guestId)
    }
    cozeUserId = guestId
  }

  console.log("[Coze] Using UserID:", cozeUserId)

  try {
    const finalUserMessage = newMessage

    const messages = [{ role: "user", content: finalUserMessage, content_type: "text" }]

    let response

    if (import.meta.env.DEV) {
      console.log("[Dev] Using proxy Coze API call via Vite proxy")
      response = await fetch("/api/coze/v3/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bot_id: COZE_BOT_ID,
          user_id: cozeUserId,
          stream: true,
          auto_save_history: true,
          additional_messages: messages,
          custom_variables: {
            language: lang === "zh" ? "Chinese" : "English",
            response_detail_level: "comprehensive",
          },
          ...(conversationId && { conversation_id: conversationId }),
        }),
      })
    } else {
      response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: finalUserMessage,
          history: history,
          conversationId: conversationId,
          userId: cozeUserId,
          lang,
        }),
      })
    }

    if (!response.ok) {
      const errText = await response.text()
      console.error("Coze API Error:", response.status, errText)
      throw new Error(`Coze API returned ${response.status}: ${errText}`)
    }

    const responseContentType = response.headers.get("content-type") || ""
    if (responseContentType.includes("text/html")) {
      const htmlText = await response.text()
      throw new Error(`Unexpected HTML response from chat endpoint: ${htmlText.substring(0, 200)}`)
    }

    if (!response.body) throw new Error("No response body")

    const reader = response.body.getReader()
    const decoder = new TextDecoder("utf-8")
    let buffer = ""
    let currentEvent = ""
    const followUpQuestions: string[] = []
    let sawAnswerDelta = false

    const handleLine = (trimmedLine: string) => {
      const outputs: StreamResponse[] = []
      let abort = false

      if (!trimmedLine) {
        return { outputs, abort }
      }

      if (trimmedLine.startsWith("event:")) {
        currentEvent = trimmedLine.substring(6).trim()
        return { outputs, abort }
      }

      if (trimmedLine.startsWith("{")) {
        try {
          const jsonBody = JSON.parse(trimmedLine)
          if (jsonBody.code && jsonBody.code !== 0) {
            console.error("Coze API Error (JSON):", jsonBody)
            outputs.push({
              text: `\n(API Error: ${jsonBody.msg || "Unknown error"} - Code: ${jsonBody.code})`,
            })
            abort = true
            return { outputs, abort }
          }
          console.log("[Coze] Received raw JSON:", jsonBody)
        } catch {}
        return { outputs, abort }
      }

      if (!trimmedLine.startsWith("data:")) {
        return { outputs, abort }
      }

      try {
        const jsonStr = trimmedLine.substring(5).trim()
        if (!jsonStr || jsonStr === '"[DONE]"' || jsonStr === "[DONE]") {
          console.log("[Coze] Received [DONE] signal")
          return { outputs, abort }
        }

        const data = JSON.parse(jsonStr)
        console.log("[Coze] Event:", currentEvent, "Type:", data.type)

        if (currentEvent === "conversation.message.delta" && data.type === "answer") {
          if (data.content) {
            sawAnswerDelta = true
            outputs.push({ text: data.content })
          }
        } else if (currentEvent === "conversation.message.delta" && data.type === "verbose") {
          if (data.content) {
            outputs.push({
              text: "",
              thinkingStep: {
                type: "reasoning",
                label: lang === "zh" ? "正在思考..." : "Thinking...",
                detail: data.content,
              },
            })
          }
        } else if (currentEvent === "conversation.message.delta" && data.type === "function_call") {
          if (data.content) {
            try {
              const callInfo = JSON.parse(data.content)
              outputs.push({
                text: "",
                thinkingStep: {
                  type: "tool_call",
                  label:
                    lang === "zh"
                      ? `调用工具: ${callInfo.name || "插件"}`
                      : `Calling tool: ${callInfo.name || "plugin"}`,
                  detail: callInfo.arguments
                    ? JSON.stringify(callInfo.arguments).substring(0, 120)
                    : undefined,
                },
              })
            } catch {
              outputs.push({
                text: "",
                thinkingStep: {
                  type: "tool_call",
                  label: lang === "zh" ? "调用工具..." : "Calling tool...",
                  detail: data.content.substring(0, 120),
                },
              })
            }
          }
        } else if (currentEvent === "conversation.message.delta" && data.type === "tool_output") {
          outputs.push({
            text: "",
            thinkingStep: {
              type: "searching",
              label: lang === "zh" ? "获取结果..." : "Fetching results...",
              detail: data.content ? data.content.substring(0, 120) : undefined,
            },
          })
        } else if (currentEvent === "conversation.message.delta" && data.type === "tool_response") {
          outputs.push({
            text: "",
            thinkingStep: {
              type: "searching",
              label: lang === "zh" ? "处理工具结果..." : "Processing results...",
            },
          })
        } else if (currentEvent === "conversation.message.completed" && data.type === "answer") {
          const completedText = typeof data.content === "string" ? data.content : ""
          console.log("[Coze] Message completed, content length:", completedText.length || 0)
          // Some environments do not emit delta chunks; use completed content as fallback.
          if (!sawAnswerDelta && completedText) {
            outputs.push({ text: completedText })
          }
        } else if (currentEvent === "conversation.message.completed" && data.type === "follow_up") {
          if (data.content) {
            followUpQuestions.push(data.content)
            console.log("[Coze] Follow-up question collected:", data.content)
          }
        } else if (currentEvent === "conversation.chat.completed") {
          console.log("[Coze] Chat completed successfully")
          if (followUpQuestions.length > 0) {
            console.log("[Coze] Yielding", followUpQuestions.length, "follow-up questions")
            outputs.push({ text: "", followUpQuestions })
          }
        } else if (currentEvent === "conversation.chat.failed") {
          console.error("[Coze] Chat failed:", data)
          outputs.push({
            text: `\n[Error: Chat failed - ${data.msg || JSON.stringify(data)}]`,
          })
        } else if (!currentEvent && data.type === "answer" && data.content) {
          // Fallback: if event name is missing, still accept answer payload.
          sawAnswerDelta = true
          outputs.push({ text: data.content })
        }
      } catch (e) {
        console.warn("[Coze] Failed to parse data line:", trimmedLine, e)
      }

      return { outputs, abort }
    }

    console.log("[Coze] Starting to read stream...")

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        buffer += decoder.decode()
        if (buffer.trim()) {
          for (const tailLine of buffer.split("\n")) {
            const { outputs, abort } = handleLine(tailLine.trim())
            for (const output of outputs) {
              yield output
            }
            if (abort) {
              return
            }
          }
        }
        console.log("[Coze] Stream completed")
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")

      buffer = lines.pop() || ""

      for (const line of lines) {
        const { outputs, abort } = handleLine(line.trim())
        for (const output of outputs) {
          yield output
        }
        if (abort) {
          return
        }
      }
    }
  } catch (error: any) {
    console.error("Stream Error:", error)
    yield {
      text: `\n(Connection Error: ${error.message || "Failed to reach Coze API"}. Please check your internet or CORS settings.)`,
    }
  }
}
