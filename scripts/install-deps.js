import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const pythonLibsDir = path.resolve('./python_libs');

// Asegurar que el directorio de librerías existe
if (!fs.existsSync(pythonLibsDir)) {
    fs.mkdirSync(pythonLibsDir, { recursive: true });
}

console.log("🐍 Installing Python dependencies to ./python_libs at BUILD TIME...");
try {
    // Instalamos en un directorio local para evitar problemas de PATH y permisos en Render
    // Usamos --no-cache-dir para ahorrar memoria y --upgrade para evitar conflictos con carpetas existentes
    execSync(`pip3 install --no-cache-dir --upgrade --target ${pythonLibsDir} -r ML/requirements.txt --quiet --break-system-packages`, { stdio: 'inherit' });
    execSync(`pip3 install --no-cache-dir --upgrade --target ${pythonLibsDir} -r ml_decision/requirements.txt --quiet --break-system-packages`, { stdio: 'inherit' });
    console.log("✅ Python dependencies installed in ./python_libs successfully.");
} catch (e) {
    console.error("❌ Failed to install Python deps during build:", e.message);
    process.exit(1); // Importante fallar el build si las deps no se instalan
}
