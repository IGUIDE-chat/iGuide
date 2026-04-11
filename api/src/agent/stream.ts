const textEncoder = new TextEncoder();

type SSEWriter = WritableStreamDefaultWriter<string>;

function encodeSSEEvent(type: string, payload: unknown): string {
	return `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
}

async function writeEvent(
	writer: SSEWriter,
	type: string,
	payload: unknown,
): Promise<void> {
	await writer.write(encodeSSEEvent(type, payload));
}

export function createSSEStream(): {
	stream: ReadableStream<Uint8Array>;
	writer: SSEWriter;
} {
	const transform = new TransformStream<string, Uint8Array>({
		transform(chunk, controller) {
			controller.enqueue(textEncoder.encode(chunk));
		},
	});

	return {
		stream: transform.readable,
		writer: transform.writable.getWriter(),
	};
}

export async function sendToolStart(
	writer: SSEWriter,
	toolName: string,
	args: Record<string, unknown>,
): Promise<void> {
	await writeEvent(writer, "tool_start", {
		name: toolName,
		args,
	});
}

export async function sendToolResult(
	writer: SSEWriter,
	toolName: string,
	status: "success" | "error",
	summary: string,
): Promise<void> {
	await writeEvent(writer, "tool_result", {
		name: toolName,
		status,
		summary,
	});
}

export async function sendContent(
	writer: SSEWriter,
	delta: string,
	metadata?: Record<string, unknown>,
): Promise<void> {
	await writeEvent(writer, "content", {
		choices: [
			{
				delta: {
					content: delta,
					...(metadata ? { metadata } : {}),
				},
				index: 0,
			},
		],
	});
}

export async function sendFallback(
	writer: SSEWriter,
	reason: string,
): Promise<void> {
	await writeEvent(writer, "fallback", {
		type: "fallback",
		reason,
	});
}

export async function sendDone(
	writer: SSEWriter,
	usage: Record<string, unknown>,
): Promise<void> {
	await writeEvent(writer, "done", {
		usage,
	});
}
