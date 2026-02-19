import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, User, Crown, ArrowRight, Loader2 } from "lucide-react";
import { useSharedProfile } from "@/contexts/SharedProfileContext";
import { toast } from "sonner";

interface VerPerfilProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const VerPerfil: React.FC<VerPerfilProps> = ({ open, onOpenChange }) => {
    const {
        sharedProfiles,
        activeSharedProfile,
        loading,
        setActiveProfile,
    } = useSharedProfile();

    const handleSelectPersonal = () => {
        setActiveProfile(null);
        toast.info("Perfil personal activado");
        onOpenChange(false);
    };

    const handleSelectShared = (profile: typeof sharedProfiles[0]) => {
        if (activeSharedProfile?.shared_id === profile.shared_id) {
            // Already active, deactivate
            setActiveProfile(null);
            toast.info("Volviste a tu perfil personal");
        } else {
            setActiveProfile(profile);
            toast.success(`Perfil activo: ${profile.name}`);
        }
        onOpenChange(false);
    };

    const isPersonalActive = !activeSharedProfile;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Cambiar Perfil</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-2 py-2">
                        {/* Personal Profile */}
                        <button
                            onClick={handleSelectPersonal}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${isPersonalActive
                                ? "bg-primary/10 border-2 border-primary/40"
                                : "bg-muted/50 border-2 border-transparent hover:bg-muted"
                                }`}
                        >
                            <div
                                className={`p-2 rounded-full ${isPersonalActive
                                    ? "bg-primary/20"
                                    : "bg-muted"
                                    }`}
                            >
                                <User
                                    className={`h-5 w-5 ${isPersonalActive
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                        }`}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">
                                    Perfil Personal
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Tus finanzas individuales
                                </p>
                            </div>
                            {isPersonalActive && (
                                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium shrink-0">
                                    Activo
                                </span>
                            )}
                        </button>

                        {/* Divider if there are shared profiles */}
                        {sharedProfiles.length > 0 && (
                            <div className="flex items-center gap-2 py-1">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-xs text-muted-foreground">
                                    Compartidos
                                </span>
                                <div className="h-px flex-1 bg-border" />
                            </div>
                        )}

                        {/* Shared Profiles */}
                        {sharedProfiles.map((profile) => {
                            const isActive =
                                activeSharedProfile?.shared_id ===
                                profile.shared_id;

                            return (
                                <button
                                    key={profile.shared_id}
                                    onClick={() => handleSelectShared(profile)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${isActive
                                        ? "bg-primary/10 border-2 border-primary/40"
                                        : "bg-muted/50 border-2 border-transparent hover:bg-muted"
                                        }`}
                                >
                                    <div
                                        className={`p-2 rounded-full ${isActive
                                            ? "bg-primary/20"
                                            : "bg-muted"
                                            }`}
                                    >
                                        <Users
                                            className={`h-5 w-5 ${isActive
                                                ? "text-primary"
                                                : "text-muted-foreground"
                                                }`}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                            {profile.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                                            <span>
                                                {profile.member_count || "?"} miembro
                                                {(profile.member_count || 0) !== 1
                                                    ? "s"
                                                    : ""}
                                            </span>
                                            <span className="font-mono text-[10px] bg-muted px-1 rounded">
                                                {profile.share_code}
                                            </span>
                                        </p>
                                    </div>
                                    {isActive ? (
                                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium shrink-0">
                                            Activo
                                        </span>
                                    ) : (
                                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                    )}
                                </button>
                            );
                        })}

                        {/* Empty state */}
                        {sharedProfiles.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No tienes perfiles compartidos aún.
                                <br />
                                Crea uno desde el menú.
                            </p>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
