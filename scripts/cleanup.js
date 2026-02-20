import { exec } from 'child_process';
const ports = [3001, 8001, 8000];
console.log('🧹 Cleaning up ports before start...');
ports.forEach(port => {
    // Windows-specific command to find PID by port
    exec(`netstat -ano | findstr :${port}`, (error, stdout, stderr) => {
        if (error || !stdout) {
            // No process found on this port, which is fine
            return;
        }
        const lines = stdout.trim().split('\n');
        lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1]; // PID is the last element
            if (pid && !isNaN(pid) && pid !== '0') {
                console.log(`Killing process ${pid} on port ${port}...`);
                exec(`taskkill /F /PID ${pid}`, (killError) => {
                    if (killError) {
                        console.error(`Failed to kill ${pid}: ${killError.message}`);
                    } else {
                        console.log(`✅ Process ${pid} terminated.`);
                    }
                });
            }
        });
    });
});