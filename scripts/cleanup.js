import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ports = [3001, 8001, 8000];
const pythonLibsDir = path.resolve('./python_libs');

// Asegurar que el directorio de librerías existe
if (!fs.existsSync(pythonLibsDir)) {
    fs.mkdirSync(pythonLibsDir, { recursive: true });
}

// Instalar deps Python en runtime (Render destruye el entorno entre build y start)
console.log("🐍 Installing Python dependencies to ./python_libs...");
try {
    // Instalamos en un directorio local para evitar problemas de PATH y permisos en Render
    execSync(`pip3 install --no-cache-dir --target ${pythonLibsDir} -r ML/requirements.txt --quiet --break-system-packages`, { stdio: 'inherit' });
    execSync(`pip3 install --no-cache-dir --target ${pythonLibsDir} -r ml_decision/requirements.txt --quiet --break-system-packages`, { stdio: 'inherit' });
    console.log("✅ Python dependencies installed in ./python_libs");
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