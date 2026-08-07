import { execSync } from 'child_process';

const myPid = process.pid;
const myPpid = process.ppid;

console.log(`Current PID: ${myPid}, Parent PID: ${myPpid}`);

try {
  // Use PowerShell to kill all node processes except current node process and its parent
  const cmd = `powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne ${myPid} -and $_.Id -ne ${myPpid} } | Stop-Process -Force"`;
  console.log(`Executing: ${cmd}`);
  const out = execSync(cmd, { encoding: 'utf8' });
  console.log('Result:', out);
} catch (err) {
  console.error('Error:', err.message);
}
