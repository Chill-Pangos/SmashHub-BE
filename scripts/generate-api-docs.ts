import fs from "fs";
import path from "path";
import swaggerSpec from "../src/config/swagger";

type OpenApiSpec = {
  info?: { title?: string; version?: string; description?: string };
  servers?: Array<{ url?: string; description?: string }>;
  tags?: Array<{ name?: string; description?: string }>;
  paths?: Record<string, Record<string, any>>;
  components?: {
    schemas?: Record<string, any>;
    responses?: Record<string, any>;
    parameters?: Record<string, any>;
  };
};

const spec = swaggerSpec as OpenApiSpec;
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "docs", "api");

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function formatMethod(method: string) {
  return method.toUpperCase();
}

function normalizeTagName(tagName: string) {
  return tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getBasePath() {
  const serverUrl = spec.servers?.[0]?.url ?? "/api";
  try {
    const parsed = new URL(serverUrl);
    return parsed.pathname.replace(/\/$/, "") || "/";
  } catch {
    const apiIndex = serverUrl.indexOf("/api");
    return apiIndex >= 0 ? serverUrl.slice(apiIndex) : serverUrl.replace(/\/$/, "");
  }
}

function refName(ref?: string) {
  if (!ref) return undefined;
  const parts = ref.split("/");
  return parts[parts.length - 1];
}

function resolveParameter(parameter: any) {
  if (parameter?.$ref) {
    const parameterName = refName(parameter.$ref);
    if (!parameterName) return parameter;
    return spec.components?.parameters?.[parameterName] ?? parameter;
  }
  return parameter;
}

function resolveResponse(response: any) {
  if (response?.$ref) {
    const responseName = refName(response.$ref);
    if (!responseName) return response;
    return spec.components?.responses?.[responseName] ?? response;
  }
  return response;
}

function resolveSchema(schema: any): any {
  if (!schema) return undefined;
  if (schema.$ref) {
    const schemaName = refName(schema.$ref);
    return schemaName ? spec.components?.schemas?.[schemaName] : schema;
  }
  return schema;
}

function schemaType(schema: any): string {
  const resolved = resolveSchema(schema);
  if (!resolved) return "unknown";
  if (Array.isArray(resolved.type)) return resolved.type.join(" | ");
  if (resolved.oneOf) return resolved.oneOf.map((item: any) => schemaType(item)).join(" | ");
  if (resolved.anyOf) return resolved.anyOf.map((item: any) => schemaType(item)).join(" | ");
  if (resolved.allOf) return resolved.allOf.map((item: any) => schemaType(item)).join(" & ");
  if (resolved.type) return resolved.type;
  if (resolved.$ref) return refName(resolved.$ref) ?? "object";
  return "object";
}

function exampleValueForSchema(schema: any): any {
  const resolved = resolveSchema(schema);
  if (!resolved) return null;

  if (resolved.example !== undefined) return resolved.example;
  if (resolved.default !== undefined) return resolved.default;
  if (resolved.enum?.length) return resolved.enum[0];

  const type = schemaType(resolved);
  if (type.includes("array")) {
    return [exampleValueForSchema(resolved.items)];
  }

  if (type === "integer" || type === "number") return 1;
  if (type === "boolean") return true;
  if (type === "string") {
    if (resolved.format === "date-time") return "2026-05-27T00:00:00Z";
    if (resolved.format === "date") return "2026-05-27";
    if (resolved.format === "password") return "Password123!";
    if (resolved.format === "email") return "user@example.com";
    return "string";
  }

  if (resolved.properties) {
    const sample: Record<string, any> = {};
    for (const [key, value] of Object.entries(resolved.properties)) {
      sample[key] = exampleValueForSchema(value);
    }
    return sample;
  }

  return null;
}

function renderJson(value: any) {
  return JSON.stringify(value, null, 2);
}

function renderSchemaSummary(schema: any, indent = 0): string {
  const resolved = resolveSchema(schema);
  if (!resolved) return `${" ".repeat(indent)}- `;

  const lines: string[] = [];
  const prefix = " ".repeat(indent);

  if (resolved.properties && isObject(resolved.properties)) {
    const required = new Set<string>(resolved.required ?? []);
    for (const [name, propSchema] of Object.entries(resolved.properties)) {
      const prop = resolveSchema(propSchema);
      const pieces: string[] = [];
      pieces.push(`${name}: ${schemaType(propSchema)}`);
      if (required.has(name)) pieces.push("required");
      if (prop?.description) pieces.push(prop.description);
      if (prop?.enum?.length) pieces.push(`choices: ${prop.enum.join(", ")}`);
      if (prop?.default !== undefined) pieces.push(`default: ${typeof prop.default === "string" ? JSON.stringify(prop.default) : prop.default}`);
      lines.push(`${prefix}- ${pieces.join(" | ")}`);
      if (prop?.properties || prop?.items) {
        lines.push(renderSchemaSummary(prop, indent + 2));
      }
    }
    return lines.filter(Boolean).join("\n");
  }

  if (resolved.items) {
    const itemSchema = resolveSchema(resolved.items);
    lines.push(`${prefix}- items: ${schemaType(resolved.items)}`);
    if (itemSchema?.properties || itemSchema?.items) {
      lines.push(renderSchemaSummary(itemSchema, indent + 2));
    }
    return lines.filter(Boolean).join("\n");
  }

  if (resolved.enum?.length) {
    return `${prefix}- choices: ${resolved.enum.join(", ")}`;
  }

  return `${prefix}- ${schemaType(schema)}`;
}

function renderParameters(operation: any) {
  const params = [...(operation.parameters ?? [])].map((parameter: any) => {
    const resolvedParameter = resolveParameter(parameter);
    return resolveSchema(resolvedParameter.schema)
      ? { ...resolvedParameter, schema: resolveSchema(resolvedParameter.schema) }
      : resolvedParameter;
  });
  if (!params.length) return "None";

  return params
    .map((param: any) => {
      const schema = param.schema ?? {};
      const pieces = [`${param.name} (${param.in})`, `type: ${schemaType(schema)}`];
      if (param.required) pieces.push("required");
      if (param.description) pieces.push(param.description);
      if (schema.enum?.length) pieces.push(`choices: ${schema.enum.join(", ")}`);
      if (schema.default !== undefined) pieces.push(`default: ${schema.default}`);
      return `- ${pieces.join(" | ")}`;
    })
    .join("\n");
}

function renderRequestBody(operation: any): string {
  const requestBody = operation.requestBody;
  if (!requestBody) return "None";

  const content = requestBody.content?.["application/json"] ?? Object.values(requestBody.content ?? {})[0];
  const schema = content?.schema;
  if (!schema) return "Defined but schema not available.";

  const lines: string[] = [];
  lines.push(`Required: ${requestBody.required ? "yes" : "no"}`);
  lines.push(`Type: ${schemaType(schema)}`);
  if (schema.description) lines.push(`Description: ${schema.description}`);
  if (schema.enum?.length) lines.push(`Possible selection: ${schema.enum.join(", ")}`);
  if (schema.properties) {
    lines.push("Fields:");
    lines.push(renderSchemaSummary(schema, 2));
  }
  const sample = exampleValueForSchema(schema);
  if (sample !== null && sample !== undefined) {
    lines.push("Example payload:");
    lines.push("```json");
    lines.push(renderJson(sample));
    lines.push("```");
  }
  return lines.join("\n");
}

function collectResponses(operation: any): Array<{ status: string; description?: string; content?: any }> {
  return Object.entries(operation.responses ?? {}).map(([status, response]: [string, any]) => {
    const resolvedResponse = resolveResponse(response);
    return {
      status,
      description: resolvedResponse.description,
      content: resolvedResponse.content,
    };
  });
}

function renderResponseBody(response: any): string {
  if (!response.content) return response.description ?? "";
  const content = response.content["application/json"] ?? Object.values(response.content)[0];
  const schema = content?.schema;
  const lines: string[] = [];
  if (response.description) lines.push(`Description: ${response.description}`);
  if (!schema) return lines.join("\n") || "No schema documented.";
  lines.push(`Type: ${schemaType(schema)}`);
  if (schema.enum?.length) lines.push(`Possible selection: ${schema.enum.join(", ")}`);
  if (schema.properties) {
    lines.push("Body:");
    lines.push(renderSchemaSummary(schema, 2));
  }
  const example = content?.example ?? exampleValueForSchema(schema);
  if (example !== undefined && example !== null) {
    lines.push("Example response:");
    lines.push("```json");
    lines.push(renderJson(example));
    lines.push("```");
  }
  return lines.join("\n");
}

function buildEndpointSection(pathName: string, method: string, operation: any): string {
  const fullEndpoint = `${getBasePath()}${pathName}`.replace(/\/+/g, "/");
  const tag = operation.tags?.[0] ?? "General";
  const lines: string[] = [];

  lines.push(`## ${formatMethod(method)} ${fullEndpoint}`);
  lines.push(`Tag: ${tag}`);
  lines.push(`Summary: ${operation.summary ?? ""}`.trim());
  if (operation.description) {
    lines.push("");
    lines.push(operation.description.trim());
  }
  if (operation.security?.length) {
    lines.push("");
    lines.push("Auth: bearerAuth");
  }
  lines.push("");
  lines.push("Request parameters:");
  lines.push(renderParameters(operation));
  lines.push("");
  lines.push("Request body:");
  lines.push(renderRequestBody(operation));
  lines.push("");
  lines.push("Responses:");
  for (const response of collectResponses(operation)) {
    lines.push(`### ${response.status}`);
    lines.push(renderResponseBody(response));
    lines.push("");
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function buildTagDoc(tagName: string, tagDescription: string | undefined, endpoints: Array<{ path: string; method: string; operation: any }>) {
  const lines: string[] = [];
  lines.push(`# ${tagName}`);
  if (tagDescription) {
    lines.push("");
    lines.push(tagDescription);
  }
  lines.push("");
  lines.push(`Total endpoints: ${endpoints.length}`);
  lines.push("");

  for (const endpoint of endpoints) {
    lines.push(buildEndpointSection(endpoint.path, endpoint.method, endpoint.operation));
    lines.push("\n---\n");
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function buildIndexDoc(tagGroups: Array<{ name: string; description?: string; fileName: string; count: number }>) {
  const lines: string[] = [];
  lines.push(`# ${spec.info?.title ?? "API Documentation"}`);
  lines.push("");
  if (spec.info?.description) lines.push(spec.info.description);
  lines.push("");
  lines.push(`Version: ${spec.info?.version ?? "unknown"}`);
  lines.push(`Base path: ${getBasePath()}`);
  lines.push("");
  lines.push("## Tags");
  lines.push("");
  for (const tag of tagGroups) {
    lines.push(`- [${tag.name}](${tag.fileName}) - ${tag.description ?? ""} (${tag.count} endpoints)`.trim());
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- Methods, endpoints, request bodies, and responses are extracted from Swagger annotations in `src/routes/*.ts`.");
  lines.push("- Field types, enums, and defaults are merged from Swagger component schemas in `src/config/swagger.ts` and `src/docs/swagger.annotations.ts`.");
  lines.push("- Example responses are generated from documented examples when present, otherwise derived from schema defaults and enum values.");
  return lines.join("\n") + "\n";
}

function main() {
  ensureDir(outputDir);

  const paths = spec.paths ?? {};
  const tagDefinitions = new Map<string, string | undefined>();
  for (const tag of spec.tags ?? []) {
    if (tag.name) tagDefinitions.set(tag.name, tag.description);
  }

  const endpointGroups = new Map<string, Array<{ path: string; method: string; operation: any }>>();

  for (const [pathName, pathItem] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (["parameters", "summary", "description"].includes(method)) continue;
      if (!isObject(operation)) continue;
      const tagName = operation.tags?.[0] ?? "General";
      const group = endpointGroups.get(tagName) ?? [];
      group.push({ path: pathName, method, operation });
      endpointGroups.set(tagName, group);
    }
  }

  const tagGroups = [...endpointGroups.entries()]
    .map(([name, endpoints]) => ({
      name,
      description: tagDefinitions.get(name),
      fileName: `${normalizeTagName(name)}.md`,
      count: endpoints.length,
      endpoints,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  fs.writeFileSync(path.join(outputDir, "index.md"), buildIndexDoc(tagGroups), "utf8");

  for (const tag of tagGroups) {
    fs.writeFileSync(
      path.join(outputDir, tag.fileName),
      buildTagDoc(tag.name, tag.description, tag.endpoints),
      "utf8"
    );
  }

  console.log(`Generated ${tagGroups.length} API docs files in ${outputDir}`);
}

main();