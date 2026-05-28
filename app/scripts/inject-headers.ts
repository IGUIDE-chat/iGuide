import fs from "fs";

function walk(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(function (file) {
    let p = dir + "/" + file;
    p = p.replaceAll('//', "/");
    const stat = fs.statSync(p);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(p));
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      results.push(p);
    }
  });
  return results;
}

const files = walk("./src");
let changed = 0;

for (const f of files) {
  const content = fs.readFileSync(f, "utf8");

  // Skip if already has header
  if (content.trim().startsWith("/**") && content.includes("@description_zh")) {
    continue;
  }

  let domain = "Global Shared";
  let descZh =
    "此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。";

  if (f.includes("/components/housing/")) {
    domain = "Housing (Dorms)";
    descZh =
      "此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。";
  } else if (f.includes("/components/chat/")) {
    domain = "Chat (AI)";
    descZh = "此文件属于 Chat 业务域。请保持业务内聚，不要随意挂载到全局域。";
  } else if (f.includes("/components/layout/")) {
    domain = "Layout";
    descZh = "此文件属于 Layout 层，仅负责布局、导航。严禁在此处堆积业务逻辑。";
  } else if (f.includes("/components/ui/")) {
    domain = "Global UI Sandbox";
    descZh =
      "纯净的业务无关 UI 基础组件（如 Button, Modal）。【绝对禁止】在此处引入任何业务代码（如 dormData, api调用, AuthContext）。";
  } else if (f.includes("/pages/")) {
    domain = "Page Route";
    descZh =
      "这是一个页面级路由编排器（Orchestrator）。只负责读取 URL 参数和组装 Feature Components。不要在这里写超过 300 行的 UI 逻辑。";
  }

  const header = `/**
 * @file ${f}
 * @description ${domain} Component / Module
 * @description_zh ${descZh}
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

`;

  fs.writeFileSync(f, header + content);
  changed++;
}

console.log("Added headers to", changed, "files.");
