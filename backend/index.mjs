import Backend, {loadFromDir} from '@vacso/frameworkbackend';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';
import dotenv from 'dotenv';
import fs from 'fs/promises';

async function getPackageVersion(packagePath) {
  try {
    const packageJson = await fs.readFile(packagePath, 'utf-8');
    const {version} = JSON.parse(packageJson);
    return version;
  } catch (error) {
    console.error(`Error reading package.json from ${packagePath}:`, error);
    return 'unknown';
  }
}

async function printVersions() {
  const currentDirectory = dirname(fileURLToPath(import.meta.url));
  const frameworkTicketingVersion = await getPackageVersion(
    path.join(currentDirectory, 'package.json'),
  );
  const frameworkBackendVersion = await getPackageVersion(
    path.join(
      currentDirectory,
      'node_modules/@vacso/frameworkbackend/package.json',
    ),
  );
  const frameworkFrontendVersion = await getPackageVersion(
    path.join(
      currentDirectory,
      '../frontend/node_modules/@vacso/frameworkfrontend/package.json',
    ),
  );

  console.log('Package Versions:');
  console.log(`frameworkTicketing: ${frameworkTicketingVersion}`);
  console.log(`frameworkBackend: ${frameworkBackendVersion}`);
  console.log(`frameworkFrontend: ${frameworkFrontendVersion}`);
}

printVersions();

dotenv.config();

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(currentDirectory, 'src', 'db');

const configs = await loadFromDir('./config');

const config = {
  dbDirs: [dbDir],
  currentDirectory: path.dirname(fileURLToPath(import.meta.url)),
  ...configs,
};

const backend = new Backend(config);

await backend.start();

console.log('Started!');
