#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = process.platform === 'win32';

function runScript(scriptName) {
  // Go up one level from scripts directory to get project root
  const projectRoot = path.resolve(__dirname, '..');
  const scriptPath = path.join(projectRoot, 'scripts', `${scriptName}.${isWindows ? 'bat' : 'sh'}`);

  if (isWindows) {
    // On Windows, use spawn with cmd
    const child = spawn('cmd', ['/c', scriptPath], {
      stdio: 'inherit',
      cwd: projectRoot
    });

    child.on('error', (error) => {
      console.error(`Error executing ${scriptPath}:`, error.message);
      process.exit(1);
    });

    child.on('exit', (code) => {
      process.exit(code);
    });
  } else {
    // On Unix-like systems, use execSync
    try {
      execSync(`chmod +x "${scriptPath}"`, { stdio: 'inherit', cwd: projectRoot });
      execSync(`"${scriptPath}"`, { stdio: 'inherit', cwd: projectRoot });
    } catch (error) {
      console.error(`Error executing ${scriptPath}:`, error.message);
      process.exit(1);
    }
  }
}

// Get the script name from command line arguments
const scriptName = process.argv[2];
if (!scriptName) {
  console.error('Usage: node scripts/run-script.js <script-name>');
  process.exit(1);
}

runScript(scriptName);