import Backend, { loadFromDir } from "frameworkbackend";
import path, { dirname } from "path";
import { fileURLToPath } from "url";



const currentDirectory = dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(currentDirectory, "src", "db");

const configs = await loadFromDir("./config");

const config = {
  dbDirs: [dbDir],
  ...configs,
};

const backend = new Backend(config);

await backend.start();

console.log("Started!");
