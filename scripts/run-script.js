#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';

function runScript(scriptName) {
  const scriptPath = path.join(__dirname, 'scripts', `${scriptName}.${isWindows ? 'bat' : 'sh'}`);

  if (isWindows) {
    // On Windows, use spawn with cmd
    const child = spawn('cmd', ['/c', scriptPath], {
      stdio: 'inherit',
      cwd: process.cwd()
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
      execSync(`chmod +x "${scriptPath}"`, { stdio: 'inherit' });
      execSync(`"${scriptPath}"`, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Error executing ${scriptPath}:`, error.message);
      process.exit(1);
    }
  }
}

// Get the script name from command line arguments
const scriptName = process.argv[2];
if (!scriptName) {
  console.error('Usage: node run-script.js <script-name>');
  process.exit(1);
}

runScript(scriptName);