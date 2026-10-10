import { spawn } from 'node:child_process';

const commands = [
  { command: process.execPath, args: ['--watch', 'server/index.js'] },
  { command: process.platform === 'win32' ? 'npx.cmd' : 'npx', args: ['vite'] },
];

const children = commands.map(({ command, args }) => spawn(command, args, {
  stdio: 'inherit',
  env: process.env,
}));

function closeChildren(signal) {
  for (const child of children) child.kill(signal);
}

process.on('SIGINT', () => closeChildren('SIGINT'));
process.on('SIGTERM', () => closeChildren('SIGTERM'));

for (const child of children) {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      closeChildren('SIGTERM');
      process.exitCode = code;
    }
  });
}
