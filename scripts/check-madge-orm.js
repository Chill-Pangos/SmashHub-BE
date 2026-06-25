const path = require("path");
const madge = require("madge");

const repoRoot = path.resolve(__dirname, "..");
const MAX_KNOWN_ORM_CYCLES = 27;

madge(path.join(repoRoot, "src"), {
  fileExtensions: ["ts"],
}).then((result) => {
  const circular = result.circular();
  if (circular.length > MAX_KNOWN_ORM_CYCLES) {
    console.error(
      `ORM circular dependencies increased: ${circular.length}/${MAX_KNOWN_ORM_CYCLES}`,
    );
    circular.forEach((items, index) => {
      console.error(`${index + 1}) ${items.join(" > ")}`);
    });
    process.exit(1);
  }

  console.log(`madge orm accepted: ${circular.length}/${MAX_KNOWN_ORM_CYCLES}`);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});

