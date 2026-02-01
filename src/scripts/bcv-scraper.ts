import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import cron from "node-cron";
import https from "https";
import { fileURLToPath } from "url";

// 1. Configuración de rutas para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, "../../public/rates.json");

interface RateData {
  date: string;
  value: number;
  lastUpdated: string;
}

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

async function sendAlert(error: string) {
  console.error(`🔴 [ALERTA] Falló el scraper BCV: ${error}`);
}

async function scrapeBCV() {
  console.log("🔄 Ejecutando scraper del BCV...");

  try {
    const { data } = await axiosInstance.get("https://www.bcv.org.ve");
    const $ = cheerio.load(data);

    // --- CORRECCIÓN DEL SELECTOR AQUÍ ---
    // Basado en tu HTML: <div id="dolar"> ... <div class="centrado"><strong> 370,25 </strong>
    const usdText = $("#dolar .col-sm-6.centrado strong").text().trim();

    // Debug: Ver qué texto capturó (útil si falla de nuevo)
    console.log(`🔎 Texto encontrado: "${usdText}"`);

    if (!usdText)
      throw new Error("Selector del dólar no encontrado en el HTML");

    // Limpieza: El BCV usa coma decimal, JS usa punto.
    const rateValue = parseFloat(usdText.replace(",", "."));

    if (isNaN(rateValue))
      throw new Error(`El valor extraído no es un número válido: ${usdText}`);

    // Fecha del sistema
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getFullYear()}`;

    const newEntry: RateData = {
      date: formattedDate,
      value: rateValue,
      lastUpdated: now.toISOString(),
    };

    // Manejo de archivo
    let history: RateData[] = [];
    if (fs.existsSync(DATA_PATH)) {
      try {
        const fileContent = fs.readFileSync(DATA_PATH, "utf-8");
        history = JSON.parse(fileContent);
      } catch (e) {
        history = [];
      }
    }

    // Guardar/Actualizar
    const existsIndex = history.findIndex((r) => r.date === formattedDate);

    if (existsIndex >= 0) {
      if (history[existsIndex].value !== rateValue) {
        history[existsIndex] = newEntry;
        console.log(`✅ Tasa actualizada para hoy: ${rateValue}`);
      } else {
        console.log(`ℹ️ La tasa de hoy ya está registrada (${rateValue}).`);
      }
    } else {
      history.push(newEntry);
      console.log(
        `✅ Nuevo registro agregado: ${rateValue} para el ${formattedDate}`,
      );
    }

    // Crear carpeta si no existe
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(DATA_PATH, JSON.stringify(history, null, 2));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    await sendAlert(error.message);
  }
}


scrapeBCV();