const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(repoRoot, "src");
const modulesRoot = path.join(srcRoot, "modules");
const moduleSharedFiles = new Set([
  path.join(modulesRoot, "index.ts"),
  path.join(modulesRoot, "module.registry.ts"),
  path.join(modulesRoot, "module.types.ts"),
]);
const flatCompatibilityDirs = new Set([
  path.join(srcRoot, "controllers"),
  path.join(srcRoot, "dto"),
  path.join(srcRoot, "models"),
  path.join(srcRoot, "routes"),
  path.join(srcRoot, "services"),
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.isFile() && fullPath.endsWith(".ts")) files.push(fullPath);
  }
  return files;
}

function moduleNameFor(filePath) {
  const relative = path.relative(modulesRoot, filePath);
  const [moduleName] = relative.split(path.sep);
  return moduleName && !moduleName.endsWith(".ts") ? moduleName : null;
}

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith(".")) return null;

  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    path.join(base, "index.ts"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return `${base}.ts`;
}

function isInside(child, parent) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function extractImports(source) {
  const specs = [];
  const importExportRe = /\b(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/g;
  const dynamicImportRe = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

  for (const re of [importExportRe, dynamicImportRe]) {
    let match;
    while ((match = re.exec(source)) !== null) {
      specs.push(match[1]);
    }
  }
  return specs;
}

const violations = [];

for (const flatDir of flatCompatibilityDirs) {
  if (fs.existsSync(flatDir)) {
    violations.push({
      filePath: flatDir,
      specifier: path.relative(repoRoot, flatDir),
      reason: "flat compatibility layer was removed; import module public APIs",
    });
  }
}

for (const filePath of walk(modulesRoot)) {
  if (moduleSharedFiles.has(filePath)) continue;

  const currentModule = moduleNameFor(filePath);
  if (!currentModule) continue;

  const source = fs.readFileSync(filePath, "utf8");
  for (const specifier of extractImports(source)) {
    const resolved = resolveImport(filePath, specifier);
    if (!resolved) continue;

    for (const flatDir of flatCompatibilityDirs) {
      if (isInside(resolved, flatDir)) {
        violations.push({
          filePath,
          specifier,
          reason: "module imports flat compatibility layer",
        });
      }
    }

    if (!isInside(resolved, modulesRoot)) continue;
    if (moduleSharedFiles.has(resolved)) continue;

    if (filePath.endsWith(".model.ts") && resolved.endsWith(".model.ts")) {
      violations.push({
        filePath,
        specifier,
        reason: "model imports another model; wire associations in src/modules/model.associations.ts",
      });
    }

    const targetModule = moduleNameFor(resolved);
    if (!targetModule || targetModule === currentModule) continue;

    const publicEntrypoints = new Set([
      "index.ts",
      "public.contracts.ts",
      "public.models.ts",
      "public.read.ts",
      "public.services.ts",
      "public.write.ts",
    ]);

    if (!publicEntrypoints.has(path.basename(resolved))) {
      violations.push({
        filePath,
        specifier,
        reason: `private cross-module import: ${currentModule} -> ${targetModule}`,
      });
    }
  }
}

for (const filePath of walk(srcRoot)) {
  if (isInside(filePath, modulesRoot)) continue;
  if ([...flatCompatibilityDirs].some((flatDir) => isInside(filePath, flatDir))) continue;

  const source = fs.readFileSync(filePath, "utf8");
  for (const specifier of extractImports(source)) {
    const resolved = resolveImport(filePath, specifier);
    if (!resolved) continue;

    for (const flatDir of flatCompatibilityDirs) {
      if (isInside(resolved, flatDir)) {
        violations.push({
          filePath,
          specifier,
          reason: "runtime imports flat compatibility layer",
        });
      }
    }

    if (isInside(resolved, modulesRoot) && path.basename(resolved) === "public.models.ts") {
      violations.push({
        filePath,
        specifier,
        reason: "runtime imports module public models; use public read/write/contracts/services",
      });
    }
  }
}

if (violations.length > 0) {
  console.error("Architecture boundary violations:");
  for (const violation of violations) {
    const file = path.relative(repoRoot, violation.filePath);
    console.error(`- ${file}: ${violation.specifier} (${violation.reason})`);
  }
  process.exit(1);
}

console.log("architecture ok");
