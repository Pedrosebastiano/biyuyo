import { exec, execSync } from 'child_process';
const ports = [3001, 8001, 8000];

// Instalar deps Python en runtime (Render destruye el entorno entre build y start)
console.log("🐍 Installing Python dependencies...");
try {
    execSync('pip3 install --no-cache-dir -r ML/requirements.txt --quiet --break-system-packages', { stdio: 'inherit' });
    execSync('pip3 install --no-cache-dir -r ml_decision/requirements.txt --quiet --break-system-packages', { stdio: 'inherit' });
    console.log("✅ Python dependencies installed");
} catch (e) {
    console.error("❌ Failed to install Python deps:", e.message);
}

console.log('🧹 Cleaning up ports before start...');
ports.forEach(port => {
    // Windows-specific command to find PID by port
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
        if (error || !stdout) {
            // No process found on this port, which is fine
            return;
        }
        const lines = stdout.trim().split('\n');

        // Deduplicate PIDs — netstat can list the same PID multiple times
        // (e.g. once for LISTENING and once for ESTABLISHED).
        const pids = new Set(
            lines
                .map(line => line.trim().split(/\s+/).pop())
                .filter(pid => pid && !isNaN(pid) && pid !== '0')
        );

        pids.forEach(pid => {
            console.log(`Killing process ${pid} on port ${port}...`);
            exec(`taskkill /F /PID ${pid}`, (killError) => {
                if (killError) {
                    // Ignore "process not found" — it was already gone
                    const msg = killError.message || '';
                    if (!msg.includes('not found') && !msg.includes('could not be terminated')) {
                        console.error(`Failed to kill ${pid}: ${msg}`);
                    }
                } else {
                    console.log(`✅ Process ${pid} terminated.`);
                }
            });
        });
    });
});