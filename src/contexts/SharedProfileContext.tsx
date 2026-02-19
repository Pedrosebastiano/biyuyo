import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";
import { getApiUrl } from "@/lib/config";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = getApiUrl();

export interface SharedProfile {
    shared_id: string;
    share_code: string;
    name: string;
    created_at: string;
    member_count: number;
}

interface SharedProfileContextType {
    activeSharedProfile: SharedProfile | null;
    sharedProfiles: SharedProfile[];
    loading: boolean;
    setActiveProfile: (profile: SharedProfile | null) => void;
    fetchSharedProfiles: () => Promise<void>;
    createSharedProfile: (name: string) => Promise<SharedProfile>;
    joinSharedProfile: (shareCode: string) => Promise<void>;
}

const SharedProfileContext = createContext<SharedProfileContextType | null>(null);

export function SharedProfileProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [activeSharedProfile, setActiveSharedProfileState] = useState<SharedProfile | null>(() => {
        try {
            const stored = localStorage.getItem("biyuyo_active_shared_profile");
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [sharedProfiles, setSharedProfiles] = useState<SharedProfile[]>([]);
    const [loading, setLoading] = useState(false);

    const setActiveProfile = (profile: SharedProfile | null) => {
        setActiveSharedProfileState(profile);
        if (profile) {
            localStorage.setItem("biyuyo_active_shared_profile", JSON.stringify(profile));
        } else {
            localStorage.removeItem("biyuyo_active_shared_profile");
        }
    };

    const fetchSharedProfiles = useCallback(async () => {
        if (!user?.user_id) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/shared/user/${user.user_id}`);
            if (!res.ok) throw new Error("Error fetching shared profiles");
            const data = await res.json();
            setSharedProfiles(data);
        } catch (err) {
            console.error("Error fetching shared profiles:", err);
        } finally {
            setLoading(false);
        }
    }, [user?.user_id]);

    const createSharedProfile = async (name: string): Promise<SharedProfile> => {
        if (!user?.user_id) throw new Error("No user");
        const res = await fetch(`${API_URL}/shared`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, user_id: user.user_id }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Error creating shared profile");
        }
        const newProfile = await res.json();
        await fetchSharedProfiles();
        return newProfile;
    };

    const joinSharedProfile = async (shareCode: string) => {
        if (!user?.user_id) throw new Error("No user");
        const res = await fetch(`${API_URL}/shared/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ share_code: shareCode, user_id: user.user_id }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Error joining shared profile");
        }
        await fetchSharedProfiles();
    };

    useEffect(() => {
        if (user?.user_id) {
            fetchSharedProfiles();
        } else {
            setSharedProfiles([]);
            setActiveProfile(null);
        }
    }, [user?.user_id, fetchSharedProfiles]);

    return (
        <SharedProfileContext.Provider
            value={{
                activeSharedProfile,
                sharedProfiles,
                loading,
                setActiveProfile,
                fetchSharedProfiles,
                createSharedProfile,
                joinSharedProfile,
            }}
        >
            {children}
        </SharedProfileContext.Provider>
    );
}

export function useSharedProfile() {
    const ctx = useContext(SharedProfileContext);
    if (!ctx) throw new Error("useSharedProfile must be used within SharedProfileProvider");
    return ctx;
}
