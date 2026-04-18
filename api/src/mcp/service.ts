import type {
	MCPConnection,
	MCPDiscoveredTool,
	MCPToolOverride,
} from "./types.ts";
import type { MCPDiscoveryResult, MCPTestResult } from "./adapter.ts";
import { createMCPStore, type MCPStore } from "./store.ts";

type CreateConnectionInput = Pick<
	MCPConnection,
	"display_name" | "endpoint_url" | "transport"
> &
	Partial<Pick<MCPConnection, "description">>;

type UpdateConnectionInput = Partial<
	Pick<MCPConnection, "display_name" | "description" | "is_enabled">
>;

const CONNECTION_PREFIX = "conn:";
const TOOL_PREFIX = "tool:";
const OVERRIDE_PREFIX = "override:";

function asEnvRecord(env?: unknown): Record<string, unknown> | undefined {
	return env && typeof env === "object"
		? (env as Record<string, unknown>)
		: undefined;
}

function connectionKey(id: string): string {
	return `${CONNECTION_PREFIX}${id}`;
}

function toolKey(connectionId: string, toolName: string): string {
	return `${TOOL_PREFIX}${connectionId}:${toolName}`;
}

function toolPrefix(connectionId: string): string {
	return `${TOOL_PREFIX}${connectionId}:`;
}

function overrideKey(
	connectionId: string,
	ownerId: string,
	toolName: string,
): string {
	return `${OVERRIDE_PREFIX}${connectionId}:${ownerId}:${toolName}`;
}

function overridePrefix(connectionId: string, ownerId?: string): string {
	return ownerId
		? `${OVERRIDE_PREFIX}${connectionId}:${ownerId}:`
		: `${OVERRIDE_PREFIX}${connectionId}:`;
}

function isPlatformConnectionVisible(
	connection: MCPConnection,
	viewerId: string,
): boolean {
	switch (connection.visibility) {
		case "global":
			return true;
		case "owner_only":
			return connection.owner_id === viewerId;
		case "institution":
			return connection.institution_id === viewerId;
	}
}

function createConnectionGroups(ids: string[]): Record<string, MCPDiscoveredTool[]> {
	return Object.fromEntries(ids.map((id) => [id, []]));
}

function createOverrideGroups(ids: string[]): Record<string, MCPToolOverride[]> {
	return Object.fromEntries(ids.map((id) => [id, []]));
}

export class MCPConnectionService {
	private readonly store: MCPStore;

	constructor(env?: unknown) {
		this.store = createMCPStore({ env: asEnvRecord(env) });
	}

	async listForViewer(viewerId: string): Promise<{
		platform: MCPConnection[];
		user: MCPConnection[];
	}> {
		const records = await this.store.list<MCPConnection>(CONNECTION_PREFIX);
		const platform: MCPConnection[] = [];
		const user: MCPConnection[] = [];

		for (const { value: connection } of records) {
			if (connection.owner_type === "platform") {
				if (isPlatformConnectionVisible(connection, viewerId)) {
					platform.push(connection);
				}
				continue;
			}

			if (connection.owner_type === "user" && connection.owner_id === viewerId) {
				user.push(connection);
			}
		}

		return { platform, user };
	}

	async createUserConnection(
		viewerId: string,
		input: CreateConnectionInput,
	): Promise<MCPConnection> {
		const timestamp = new Date().toISOString();
		const connection: MCPConnection = {
			id: crypto.randomUUID(),
			owner_id: viewerId,
			owner_type: "user",
			visibility: "owner_only",
			display_name: input.display_name,
			endpoint_url: input.endpoint_url,
			transport: input.transport,
			...(input.description !== undefined
				? { description: input.description }
				: {}),
			is_enabled: true,
			last_test_status: null,
			created_at: timestamp,
			updated_at: timestamp,
		};

		await this.store.put(connectionKey(connection.id), connection);
		return connection;
	}

	async getByIdForViewer(
		id: string,
		viewerId: string,
	): Promise<MCPConnection | null> {
		const connection = await this.store.get<MCPConnection>(connectionKey(id));
		if (!connection) {
			return null;
		}

		if (connection.owner_type === "user") {
			return connection.owner_id === viewerId ? connection : null;
		}

		return isPlatformConnectionVisible(connection, viewerId) ? connection : null;
	}

	async updateUserConnection(
		id: string,
		viewerId: string,
		patch: UpdateConnectionInput,
	): Promise<MCPConnection | null> {
		const existing = await this.getByIdForViewer(id, viewerId);
		if (!existing || existing.owner_type !== "user") {
			return null;
		}

		const updated: MCPConnection = {
			...existing,
			...patch,
			updated_at: new Date().toISOString(),
		};

		await this.store.put(connectionKey(id), updated);
		return updated;
	}

	async deleteUserConnection(
		id: string,
		viewerId: string,
	): Promise<boolean> {
		const existing = await this.getByIdForViewer(id, viewerId);
		if (!existing || existing.owner_type !== "user") {
			return false;
		}

		await this.store.delete(connectionKey(id));
		return true;
	}

	async recordTestResult(
		id: string,
		viewerId: string,
		result: MCPTestResult,
	): Promise<void> {
		const existing = await this.getByIdForViewer(id, viewerId);
		if (!existing || existing.owner_type !== "user") {
			return;
		}

		const updated: MCPConnection = {
			...existing,
			last_test_at: new Date().toISOString(),
			last_test_status: result.success ? "ok" : "failed",
			last_test_error: result.error_message ?? undefined,
			updated_at: new Date().toISOString(),
		};

		await this.store.put(connectionKey(id), updated);
	}

	async recordDiscoveryResult(
		id: string,
		viewerId: string,
		result: MCPDiscoveryResult,
	): Promise<void> {
		const existing = await this.getByIdForViewer(id, viewerId);
		if (!existing || existing.owner_type !== "user") {
			return;
		}

		const updated: MCPConnection = {
			...existing,
			last_discovery_at: new Date().toISOString(),
			last_discovery_tool_count: result.tools.length,
			updated_at: new Date().toISOString(),
		};

		await this.store.put(connectionKey(id), updated);
	}
}

export class MCPDiscoveredToolService {
	private readonly store: MCPStore;

	constructor(env?: unknown) {
		this.store = createMCPStore({ env: asEnvRecord(env) });
	}

	async listByConnectionIds(
		connectionIds: string[],
	): Promise<Record<string, MCPDiscoveredTool[]>> {
		const groups = createConnectionGroups(connectionIds);

		await Promise.all(
			[...new Set(connectionIds)].map(async (connectionId) => {
				const records = await this.store.list<MCPDiscoveredTool>(
					toolPrefix(connectionId),
				);
				groups[connectionId] = records.map((record) => record.value);
			}),
		);

		return groups;
	}

	async replaceDiscoveredTools(
		connectionId: string,
		tools: MCPDiscoveryResult["tools"],
	): Promise<void> {
		const existing = await this.store.list<MCPDiscoveredTool>(toolPrefix(connectionId));
		await Promise.all(existing.map((record) => this.store.delete(record.key)));

		const discoveredAt = new Date().toISOString();
		await Promise.all(
			tools.map((tool) => {
				const key = toolKey(connectionId, tool.name);
				const record: MCPDiscoveredTool = {
					id: key,
					connection_id: connectionId,
					name: tool.name,
					...(tool.description ? { description: tool.description } : {}),
					input_schema: tool.parameters,
					discovered_at: discoveredAt,
				};

				return this.store.put(key, record);
			}),
		);
	}
}

export class MCPToolOverrideService {
	private readonly store: MCPStore;

	constructor(env?: unknown) {
		this.store = createMCPStore({ env: asEnvRecord(env) });
	}

	async listOverridesByConnectionIds(
		connectionIds: string[],
		viewerId: string,
	): Promise<Record<string, MCPToolOverride[]>> {
		const groups = createOverrideGroups(connectionIds);

		await Promise.all(
			[...new Set(connectionIds)].map(async (connectionId) => {
				const records = await this.store.list<MCPToolOverride>(
					overridePrefix(connectionId, viewerId),
				);
				groups[connectionId] = records.map((record) => record.value);
			}),
		);

		return groups;
	}

	async disableTool(
		connectionId: string,
		toolName: string,
		viewerId: string,
	): Promise<MCPToolOverride> {
		const key = overrideKey(connectionId, viewerId, toolName);
		const existing = await this.store.get<MCPToolOverride>(key);
		const override: MCPToolOverride = {
			id: existing?.id ?? key,
			connection_id: connectionId,
			tool_name: toolName,
			owner_id: viewerId,
			is_disabled: true,
			created_at: existing?.created_at ?? new Date().toISOString(),
		};

		await this.store.put(key, override);
		return override;
	}

	async enableTool(
		connectionId: string,
		toolName: string,
		viewerId: string,
	): Promise<MCPToolOverride | null> {
		const key = overrideKey(connectionId, viewerId, toolName);
		const existing = await this.store.get<MCPToolOverride>(key);
		if (!existing) {
			return null;
		}

		await this.store.delete(key);
		return existing;
	}
}
