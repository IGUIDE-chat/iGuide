import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export function load(url, context, nextLoad) {
	if (url.endsWith(".md")) {
		const path = fileURLToPath(url);
		const content = readFileSync(path, "utf-8");
		return {
			format: "module",
			shortCircuit: true,
			source: `export default ${JSON.stringify(content)};`,
		};
	}
	return nextLoad(url, context);
}
