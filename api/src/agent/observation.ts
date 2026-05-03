export interface ObservationError {
	code: string;
	message: string;
}

export const Observation = Symbol("Observation");

export interface Observation {
	toolCallId: string;
	toolName: string;
	input: Record<string, unknown>;
	output: unknown;
	status: "success" | "error";
	summary: string;
	raw: string;
	truncated: boolean;
	error: ObservationError | null;
}

export function createObservation(observation: Observation): Observation {
	return observation;
}

export function observationToolCallId(observation: Observation): string {
	return observation.toolCallId;
}

export function observationToolName(observation: Observation): string {
	return observation.toolName;
}

export function observationInput(
	observation: Observation,
): Record<string, unknown> {
	return observation.input;
}

export function observationOutput(observation: Observation): unknown {
	return observation.output;
}

export function observationStatus(observation: Observation): Observation["status"] {
	return observation.status;
}

export function observationSummary(observation: Observation): string {
	return observation.summary;
}

export function observationRaw(observation: Observation): string {
	return observation.raw;
}

export function observationTruncated(observation: Observation): boolean {
	return observation.truncated;
}

export function observationError(
	observation: Observation,
): ObservationError | null {
	return observation.error;
}
