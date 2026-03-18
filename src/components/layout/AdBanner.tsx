import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
    interface Window {
        adsbygoogle: unknown[];
    }
}

const ALLOWED_ROUTES = ["/", "/transactions", "/analytics", "/goals", "/ml"];

export function AdBanner() {
    const location = useLocation();
    const isAllowed = ALLOWED_ROUTES.includes(location.pathname);

    useEffect(() => {
        if (!isAllowed) return;
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (_) { }
    }, [isAllowed]);

    if (!isAllowed) return null;

    return (
        <div
            style={{ width: "100%", height: "50px", overflow: "hidden" }}
            className="fixed z-40 left-0 right-0 bottom-16 lg:bottom-0 bg-transparent"
        >
            <ins
                className="adsbygoogle"
                style={{ display: "block", width: "100%", height: "50px" }}
                data-ad-client="ca-pub-6635816714427153"
                data-ad-slot=""
                data-ad-format="horizontal"
                data-full-width-responsive="false"
            />
        </div>
    );
}
