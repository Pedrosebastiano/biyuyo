import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Users, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useSharedProfile } from "@/contexts/SharedProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();

export default function JoinSharedProfile() {
    const { shareCode } = useParams<{ shareCode: string }>();
    const { user } = useAuth();
    const { joinSharedProfile, fetchSharedProfiles } = useSharedProfile();
    const navigate = useNavigate();

    const [profileInfo, setProfileInfo] = useState<{
        name: string;
        member_count: number;
        share_code: string;
    } | null>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "joining" | "success" | "error">("loading");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            if (!shareCode) {
                setStatus("error");
                setErrorMsg("Código de perfil no válido");
                return;
            }
            try {
                const res = await fetch(`${API_URL}/shared/code/${shareCode}`);
                if (!res.ok) {
                    setStatus("error");
                    setErrorMsg("Perfil compartido no encontrado");
                    return;
                }
                const data = await res.json();
                setProfileInfo({
                    name: data.name,
                    member_count: parseInt(data.member_count),
                    share_code: data.share_code
                });
                setStatus("ready");
            } catch {
                setStatus("error");
                setErrorMsg("Error al buscar el perfil");
            }
        };
        fetchProfile();
    }, [shareCode]);

    const handleJoin = async () => {
        if (!shareCode || !user) return;
        setStatus("joining");
        try {
            await joinSharedProfile(shareCode);
            setStatus("success");
            toast.success("Te uniste exitosamente");
            await fetchSharedProfiles();
            setTimeout(() => navigate("/shared"), 2000);
        } catch (err: any) {
            setStatus("error");
            setErrorMsg(err.message || "Error al unirse");
            toast.error(err.message || "Error al unirse al perfil");
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen px-4 py-6">
                <Card className="w-full max-w-md border-2">
                    <CardContent className="flex flex-col items-center py-8 text-center px-4 sm:px-6">
                        <XCircle className="h-10 w-10 sm:h-12 sm:w-12 text-destructive mb-4 shrink-0" />
                        <h3 className="text-base sm:text-lg font-semibold mb-2">Inicia sesión primero</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Necesitas una cuenta para unirte a un perfil compartido
                        </p>
                        <Button className="w-full sm:w-auto" onClick={() => navigate("/login")}>Iniciar Sesión</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen px-4 py-6">
            <Card className="w-full max-w-md border-2">
                <CardHeader className="text-center px-4 sm:px-6">
                    <div className="mx-auto bg-primary/10 rounded-full p-3 mb-2 w-fit">
                        <Users className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl">Unirse a Perfil Compartido</CardTitle>
                    <CardDescription className="text-sm">
                        {status === "loading" && "Cargando información del perfil..."}
                        {status === "ready" && "Has sido invitado a un perfil compartido"}
                        {status === "joining" && "Uniéndose al perfil..."}
                        {status === "success" && "¡Te uniste exitosamente!"}
                        {status === "error" && errorMsg}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4 px-4 sm:px-6">
                    {status === "loading" && (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    )}

                    {status === "ready" && profileInfo && (
                        <>
                            <div className="text-center space-y-1 w-full">
                                <p className="text-xl sm:text-2xl font-bold break-words">{profileInfo.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {profileInfo.member_count} miembro
                                    {profileInfo.member_count !== 1 ? "s" : ""} actualmente
                                </p>
                            </div>
                            <Button className="w-full" onClick={handleJoin}>
                                <Users className="mr-2 h-4 w-4 shrink-0" />
                                <span className="truncate">Unirse a {profileInfo.name}</span>
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => navigate("/shared")}
                            >
                                Cancelar
                            </Button>
                        </>
                    )}

                    {status === "joining" && (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    )}

                    {status === "success" && (
                        <>
                            <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-green-500 shrink-0" />
                            <p className="text-sm text-muted-foreground text-center">
                                Redirigiendo a tus perfiles compartidos...
                            </p>
                        </>
                    )}

                    {status === "error" && (
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate("/shared")}>
                            Ir a Perfiles Compartidos
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
