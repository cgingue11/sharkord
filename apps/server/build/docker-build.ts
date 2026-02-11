/**
 * Stripped-down build script for Docker — only targets linux-x64.
 * Reuses the same `compile` and `zipDirectory` helpers as the full build.
 */
import fs from 'fs/promises';
import path from 'path';
import { zipDirectory } from '../src/helpers/zip';
import { compile } from './helpers';

const serverCwd = path.resolve(import.meta.dir, '..');
const clientCwd = path.resolve(serverCwd, '..', 'client');
const viteDistPath = path.join(clientCwd, 'dist');
const buildPath = path.join(serverCwd, 'build');
const buildTempPath = path.join(buildPath, 'temp');
const drizzleMigrationsPath = path.join(serverCwd, 'src', 'db', 'migrations');
const outPath = path.join(buildPath, 'out');
const interfaceZipPath = path.join(buildTempPath, 'interface.zip');
const drizzleZipPath = path.join(buildTempPath, 'drizzle.zip');

await fs.rm(buildTempPath, { recursive: true, force: true });
await fs.rm(outPath, { recursive: true, force: true });
await fs.mkdir(buildTempPath, { recursive: true });
await fs.mkdir(outPath, { recursive: true });

console.log('Building client with Vite...');

const viteProc = Bun.spawn(['bun', 'run', 'build'], {
  cwd: clientCwd,
  stdout: 'inherit',
  stderr: 'inherit',
  stdin: 'inherit'
});
await viteProc.exited;

if (viteProc.exitCode !== 0) {
  console.error('Client build failed');
  process.exit(viteProc.exitCode);
}

console.log('Creating interface.zip...');
await zipDirectory(viteDistPath, interfaceZipPath);

console.log('Creating drizzle.zip...');
await zipDirectory(drizzleMigrationsPath, drizzleZipPath);

console.log('Compiling server for linux-x64...');
await compile({
  out: path.join(outPath, 'sharkord-linux-x64'),
  target: 'bun-linux-x64'
});

await fs.rm(buildTempPath, { recursive: true, force: true });
console.log('Docker build complete.');
