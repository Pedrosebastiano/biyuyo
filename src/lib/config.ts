export const APP_CONFIG = {
  // API URLs
  LOCAL_API: "http://localhost:3001",
  PRODUCTION_API: "https://biyuyo-pruebas.onrender.com",
  ML_LOCAL_API: "http://localhost:8001",
  ML_PRODUCTION_API: "https://biyuyo-pruebas.onrender.com/api/decision",
  SIMULATOR_ML_LOCAL_API: "http://localhost:8000",
  SIMULATOR_ML_PRODUCTION_API: "https://biyuyo-pruebas.onrender.com/api/ml",
};

export const getApiUrl = () => {
  if (typeof window === "undefined") return APP_CONFIG.PRODUCTION_API;
  const hostname = window.location.hostname;
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "::"
  ) {
    return APP_CONFIG.LOCAL_API;
  }
  return APP_CONFIG.PRODUCTION_API;
};

export const getMLApiUrl = () => {
  // If running server-side (Node.js), set env variables for local ML API
  if (typeof window === "undefined") {
    // Only for local development
    if (process.env.NODE_ENV === "development") {
      process.env.SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtampndXlpYnh5ZHp4bm9mY2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwODE2NTAsImV4cCI6MjA4NTY1NzY1MH0.ZYTzwvzdcjgiiJHollA7vyNZ7ZF8hIN1NuTOq5TdtjI";
      process.env.SUPABASE_URL = "https://pmjjguyibxydzxnofcjx.supabase.co";
    }
    return APP_CONFIG.ML_PRODUCTION_API;
  }
  const hostname = window.location.hostname;
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "::"
  ) {
    return APP_CONFIG.ML_LOCAL_API;
  }
  return APP_CONFIG.ML_PRODUCTION_API;
};

export const getSimulatorMLApiUrl = () => {
  if (typeof window === "undefined") return APP_CONFIG.SIMULATOR_ML_PRODUCTION_API;
  const hostname = window.location.hostname;
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "::"
  ) {
    return APP_CONFIG.SIMULATOR_ML_LOCAL_API;
  }
  return APP_CONFIG.SIMULATOR_ML_PRODUCTION_API;
};