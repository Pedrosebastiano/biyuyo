export const APP_CONFIG = {
    // API URLs
    LOCAL_API: "http://localhost:3001",
    PRODUCTION_API: "https://biyuyo-pruebas.onrender.com"
};

export const getApiUrl = () => {
    if (typeof window === "undefined") return APP_CONFIG.PRODUCTION_API;

    const hostname = window.location.hostname;

    // Check if we are running locally (localhost, 127.0.0.1, or ipv6 local)
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