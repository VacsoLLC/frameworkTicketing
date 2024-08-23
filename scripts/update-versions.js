// update-versions.js
const fs = require("fs").promises;
const path = require("path");
const semver = require("semver");
const { execSync } = require("child_process");

const rootDir = path.resolve(__dirname, "../..");

async function readPackageJson(filePath) {
  const data = await fs.readFile(filePath, "utf8");
  return JSON.parse(data);
}

async function writePackageJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function updateVersionAndPublish() {
  try {
    // Read current versions
    const backendPath = path.join(rootDir, "frameworkBackend", "package.json");
    const frontendPath = path.join(
      rootDir,
      "frameworkFrontend",
      "package.json"
    );
    const backendPkg = await readPackageJson(backendPath);
    const frontendPkg = await readPackageJson(frontendPath);

    // Find max version and increment
    const currentVersion = semver.maxSatisfying(
      [backendPkg.version, frontendPkg.version],
      "*"
    );
    const newVersion = semver.inc(currentVersion, "patch");

    console.log(`Updating to version ${newVersion}`);

    // Update versions
    backendPkg.version = newVersion;
    frontendPkg.version = newVersion;

    // Write updated package.json files
    await writePackageJson(backendPath, backendPkg);
    await writePackageJson(frontendPath, frontendPkg);

    // Update frameworkTicketing dependencies
    const ticketingFrontendPath = path.join(
      rootDir,
      "frameworkTicketing",
      "frontend",
      "package.json"
    );
    const ticketingBackendPath = path.join(
      rootDir,
      "frameworkTicketing",
      "backend",
      "package.json"
    );

    const ticketingFrontendPkg = await readPackageJson(ticketingFrontendPath);
    const ticketingBackendPkg = await readPackageJson(ticketingBackendPath);

    ticketingFrontendPkg.dependencies["@vacso/frameworkfrontend"] = newVersion;
    ticketingBackendPkg.dependencies["@vacso/frameworkbackend"] = newVersion;

    await writePackageJson(ticketingFrontendPath, ticketingFrontendPkg);
    await writePackageJson(ticketingBackendPath, ticketingBackendPkg);

    // Publish packages
    console.log("Publishing frameworkBackend...");
    execSync("npm publish", {
      cwd: path.dirname(backendPath),
      stdio: "inherit",
    });

    console.log("Publishing frameworkFrontend...");
    execSync("npm publish", {
      cwd: path.dirname(frontendPath),
      stdio: "inherit",
    });

    console.log("Version update and publish completed successfully.");
  } catch (error) {
    console.error("An error occurred:", error);
    process.exit(1);
  }
}

updateVersionAndPublish();
