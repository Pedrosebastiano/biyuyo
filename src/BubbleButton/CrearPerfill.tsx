import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from "lucide-react";

interface CrearPerfilProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const CrearPerfil: React.FC<CrearPerfilProps> = ({ open, onOpenChange }) => {
    const [profileName, setProfileName] = useState("");
    const [isGenerated, setIsGenerated] = useState(false);
    const [inviteLink, setInviteLink] = useState("");
    const [copied, setCopied] = useState(false);

    const handleGenerate = () => {
        if (!profileName) return;
        // Simulate link generation
        const uniqueId = Math.random().toString(36).substring(7);
        const link = `https://biyuyo.app/invite/${uniqueId}`;
        setInviteLink(link);
        setIsGenerated(true);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Crear Perfil Compartido</DialogTitle>
                </DialogHeader>

                {!isGenerated ? (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del perfil</Label>
                            <Input
                                id="name"
                                placeholder="Ej: Gastos de Casa"
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button onClick={handleGenerate} disabled={!profileName}>
                                Generar QR y Link
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <div className="space-y-6 py-4 flex flex-col items-center">
                        <div className="text-center space-y-2">
                            <h3 className="font-semibold text-lg">{profileName}</h3>
                            <p className="text-sm text-muted-foreground">Escanea para unirte</p>
                        </div>

                        <div className="p-4 bg-white rounded-xl shadow-sm border">
                            <QRCodeSVG value={inviteLink} size={180} />
                        </div>

                        <div className="w-full space-y-2">
                            <Label>Link de invitación</Label>
                            <div className="flex items-center gap-2">
                                <Input value={inviteLink} readOnly />
                                <Button size="icon" variant="outline" onClick={handleCopy}>
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
