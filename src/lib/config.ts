export const APP_CONFIG = {
    // API URLs
    LOCAL_API:         "http://localhost:3001",
    PRODUCTION_API:    "https://biyuyo-pruebas.onrender.com",
    ML_LOCAL_API:      "http://localhost:8000",
    ML_PRODUCTION_API: "https://biyuyo-ml.onrender.com", // ← actualiza con tu URL real de Render después del deploy
  };
  
  export const getApiUrl = () => {
    if (typeof window === "undefined") return APP_CONFIG.PRODUCTION_API;
    const hostname = window.location.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      hostname === "::"
    ) {
      return APP_CONFIG.LOCAL_API;
    }
    return APP_CONFIG.PRODUCTION_API;
  };
  
  export const getMLApiUrl = () => {
    if (typeof window === "undefined") return APP_CONFIG.ML_PRODUCTION_API;
    const hostname = window.location.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      hostname === "::"
    ) {
      return APP_CONFIG.ML_LOCAL_API;
    }
    return APP_CONFIG.ML_PRODUCTION_API;
  };