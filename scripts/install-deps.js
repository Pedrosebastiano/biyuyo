import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const pythonLibsDir = path.resolve('./python_libs');

// Asegurar que el directorio de librerías existe
if (!fs.existsSync(pythonLibsDir)) {
    fs.mkdirSync(pythonLibsDir, { recursive: true });
}

console.log("🐍 Checking Python and Pip versions...");
try {
    execSync('python3 --version', { stdio: 'inherit' });
    execSync('python3 -m pip --version', { stdio: 'inherit' });
} catch (e) {
    console.warn("⚠️ Could not verify Python/Pip version:", e.message);
}

console.log("🐍 Installing Python dependencies to ./python_libs at BUILD TIME...");
try {
    // Usamos python3 -m pip para asegurar que usamos el mismo intérprete que en el start
    execSync(`python3 -m pip install --no-cache-dir --upgrade --target ${pythonLibsDir} -r ML/requirements.txt --quiet --break-system-packages`, { stdio: 'inherit' });
    execSync(`python3 -m pip install --no-cache-dir --upgrade --target ${pythonLibsDir} -r ml_decision/requirements.txt --quiet --break-system-packages`, { stdio: 'inherit' });
    console.log("✅ Python dependencies installed in ./python_libs successfully.");
} catch (e) {
    console.error("❌ Failed to install Python deps during build:", e.message);
    process.exit(1);
}
