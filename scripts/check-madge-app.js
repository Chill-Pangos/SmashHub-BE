const path = require("path");
const madge = require("madge");

const repoRoot = path.resolve(__dirname, "..");

madge(path.join(repoRoot, "src"), {
  fileExtensions: ["ts"],
  excludeRegExp: [/^models\//, /\.model\.ts$/],
}).then((result) => {
  const circular = result.circular();
  if (circular.length > 0) {
    console.error("Application circular dependencies:");
    circular.forEach((items, index) => {
      console.error(`${index + 1}) ${items.join(" > ")}`);
    });
    process.exit(1);
  }
  console.log("madge app ok");
}).catch((error) => {
  console.error(error);
  process.exit(1);
});

