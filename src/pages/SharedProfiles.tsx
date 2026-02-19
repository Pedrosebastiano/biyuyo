import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Users,
    Plus,
    Copy,
    Check,
    UserPlus,
    Crown,
    Loader2,
    Link as LinkIcon,
    ArrowRight,
    ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useSharedProfile, SharedProfile } from "@/contexts/SharedProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();

export default function SharedProfiles() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const {
        sharedProfiles,
        activeSharedProfile,
        loading,
        setActiveProfile,
        createSharedProfile,
        joinSharedProfile,
        fetchSharedProfiles,
    } = useSharedProfile();

    const [newProfileName, setNewProfileName] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [joinDialogOpen, setJoinDialogOpen] = useState(false);
    const [memberCounts, setMemberCounts] = useState<Record<string, { name: string; email: string }[]>>({});

    useEffect(() => {
        fetchSharedProfiles();
    }, [fetchSharedProfiles]);

    // Fetch members for each profile
    useEffect(() => {
        const fetchMembers = async () => {
            for (const profile of sharedProfiles) {
                try {
                    const res = await fetch(`${API_URL}/shared/${profile.shared_id}/members`);
                    if (res.ok) {
                        const members = await res.json();
                        setMemberCounts((prev) => ({ ...prev, [profile.shared_id]: members }));
                    }
                } catch {
                    // Ignore
                }
            }
        };
        if (sharedProfiles.length > 0) fetchMembers();
    }, [sharedProfiles]);

    const handleCreate = async () => {
        if (!newProfileName.trim()) {
            toast.error("El nombre es requerido");
            return;
        }
        setCreating(true);
        try {
            await createSharedProfile(newProfileName.trim());
            toast.success("Perfil compartido creado exitosamente");
            setNewProfileName("");
            setCreateDialogOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Error al crear el perfil");
        } finally {
            setCreating(false);
        }
    };

    const handleJoin = async () => {
        if (!joinCode.trim()) {
            toast.error("El código es requerido");
            return;
        }
        setJoining(true);
        try {
            await joinSharedProfile(joinCode.trim());
            toast.success("Te uniste al perfil compartido exitosamente");
            setJoinCode("");
            setJoinDialogOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Error al unirse al perfil");
        } finally {
            setJoining(false);
        }
    };

    const copyShareLink = (shareCode: string) => {
        const link = `${window.location.origin}/shared/join/${shareCode}`;
        navigator.clipboard.writeText(link).then(() => {
            setCopiedId(shareCode);
            toast.success("Enlace copiado al portapapeles");
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const copyShareCode = (shareCode: string) => {
        navigator.clipboard.writeText(shareCode).then(() => {
            setCopiedId(shareCode);
            toast.success("Código copiado al portapapeles");
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const handleActivate = (profile: SharedProfile) => {
        if (activeSharedProfile?.shared_id === profile.shared_id) {
            setActiveProfile(null);
            toast.info("Volviste a tu perfil personal");
        } else {
            setActiveProfile(profile);
            toast.success(`Perfil activo: ${profile.name}`);
        }
    };

    return (
        <div className="min-h-screen bg-background px-4 sm:px-6 py-8">
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 text-sm text-primary hover:underline mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver
            </button>

            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="bg-primary/10 p-2.5 rounded-full">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-[#2d509e]">
                                Perfiles Compartidos
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Comparte tus finanzas con familia, pareja o compañeros
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action buttons - Responsive layout */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 w-full sm:flex-1 h-12">
                                <UserPlus className="h-4 w-4" />
                                Unirse
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Unirse a un Perfil Compartido</DialogTitle>
                                <DialogDescription>
                                    Ingresa el código de 8 caracteres del perfil compartido
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="join-code">Código del Perfil</Label>
                                    <Input
                                        id="join-code"
                                        placeholder="Pega el código aquí (Ej: A1B2C3D4)..."
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        className="border-2 font-mono"
                                        maxLength={8}
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={handleJoin}
                                    disabled={joining || !joinCode.trim()}
                                >
                                    {joining ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Uniéndose...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Unirse al Perfil
                                        </>
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 w-full sm:flex-1 h-12">
                                <Plus className="h-4 w-4" />
                                Crear Perfil
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Crear Perfil Compartido</DialogTitle>
                                <DialogDescription>
                                    Dale un nombre al perfil que compartirás con otros
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="profile-name">Nombre del Perfil</Label>
                                    <Input
                                        id="profile-name"
                                        placeholder="Ej: Casa, Familia, Viaje Europa..."
                                        value={newProfileName}
                                        onChange={(e) => setNewProfileName(e.target.value)}
                                        className="border-2"
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={handleCreate}
                                    disabled={creating || !newProfileName.trim()}
                                >
                                    {creating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creando...
                                        </>
                                    ) : (
                                        "Crear Perfil"
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Active Profile Banner */}
                {activeSharedProfile && (
                    <Card className="border-primary/30 border-2 bg-primary/5">
                        <CardContent className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="bg-primary/20 rounded-full p-2 shrink-0">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-primary text-sm">
                                        Perfil Activo: {activeSharedProfile.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        Código: <span className="font-mono font-bold select-all bg-muted px-1 rounded">{activeSharedProfile.share_code}</span>
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto shrink-0"
                                onClick={() => {
                                    setActiveProfile(null);
                                    toast.info("Volviste a tu perfil personal");
                                }}
                            >
                                Volver a Personal
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Profiles List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : sharedProfiles.length === 0 ? (
                    <Card className="border-dashed border-2">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="bg-muted rounded-full p-4 mb-4">
                                <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">
                                No tienes perfiles compartidos
                            </h3>
                            <p className="text-muted-foreground mb-6 max-w-md text-sm">
                                Crea un perfil para compartir gastos, ingresos y recordatorios con
                                otras personas. Perfecto para gestionar finanzas en pareja, familia
                                o entre compañeros.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <Button
                                    variant="outline"
                                    onClick={() => setJoinDialogOpen(true)}
                                    className="gap-2 w-full sm:w-auto"
                                >
                                    <UserPlus className="h-4 w-4" />
                                    Unirse a uno existente
                                </Button>
                                <Button
                                    onClick={() => setCreateDialogOpen(true)}
                                    className="gap-2 w-full sm:w-auto"
                                >
                                    <Plus className="h-4 w-4" />
                                    Crear mi primer perfil
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {sharedProfiles.map((profile) => {
                            const isActive =
                                activeSharedProfile?.shared_id === profile.shared_id;
                            const members = memberCounts[profile.shared_id] || [];

                            return (
                                <Card
                                    key={profile.shared_id}
                                    className={`transition-all hover:shadow-md ${isActive
                                            ? "border-primary border-2 shadow-md"
                                            : "border-2"
                                        }`}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                {isActive && (
                                                    <Crown className="h-4 w-4 text-primary" />
                                                )}
                                                <div>
                                                    <CardTitle className="text-lg">
                                                        {profile.name}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Código:</span>
                                                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono font-bold text-primary">{profile.share_code}</code>
                                                    </div>
                                                </div>
                                            </div>
                                            {isActive && (
                                                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-medium shrink-0">
                                                    Activo
                                                </span>
                                            )}
                                        </div>
                                        <CardDescription>
                                            {profile.member_count || members.length} miembro
                                            {(profile.member_count || members.length) !== 1
                                                ? "s"
                                                : ""}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {/* Members preview */}
                                        {members.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {members.slice(0, 4).map((m) => (
                                                    <span
                                                        key={m.email}
                                                        className="text-xs bg-muted px-2 py-1 rounded-full"
                                                        title={m.email}
                                                    >
                                                        {m.name}
                                                    </span>
                                                ))}
                                                {members.length > 4 && (
                                                    <span className="text-xs bg-muted px-2 py-1 rounded-full">
                                                        +{members.length - 4}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Action buttons */}
                                        <div className="flex gap-2">
                                            <Button
                                                variant={isActive ? "outline" : "default"}
                                                size="sm"
                                                className="flex-1 gap-1"
                                                onClick={() => handleActivate(profile)}
                                            >
                                                {isActive ? (
                                                    "Desactivar"
                                                ) : (
                                                    <>
                                                        <ArrowRight className="h-3 w-3" />
                                                        Activar
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyShareLink(profile.share_code)}
                                                title="Copiar enlace para compartir"
                                            >
                                                {copiedId === profile.share_code ? (
                                                    <Check className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <LinkIcon className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyShareCode(profile.share_code)}
                                                title="Copiar Código"
                                            >
                                                {copiedId === profile.share_code ? (
                                                    <Check className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
