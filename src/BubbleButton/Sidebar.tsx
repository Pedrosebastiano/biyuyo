import React, { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPlus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { VerPerfil } from "./VerPerfil";
import { useOnboarding } from "@/contexts/OnboardingContext";

interface SidebarProps {
    children: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ children }) => {
    const navigate = useNavigate();
    const [verPerfilOpen, setVerPerfilOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { registerAction, unregisterAction } = useOnboarding();

    React.useEffect(() => {
        registerAction("open-bubble-menu", () => setDropdownOpen(true));
        registerAction("close-bubble-menu", () => setDropdownOpen(false));
        registerAction("open-ver-perfil", () => setVerPerfilOpen(true));
        registerAction("close-ver-perfil", () => setVerPerfilOpen(false));
        return () => {
            unregisterAction("open-bubble-menu");
            unregisterAction("close-bubble-menu");
            unregisterAction("open-ver-perfil");
            unregisterAction("close-ver-perfil");
        };
    }, [registerAction, unregisterAction]);

    const handleCreateProfile = () => {
        navigate("/shared");
    };

    const handleViewProfiles = () => {
        setVerPerfilOpen(true);
    };

    return (
        <>
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                    {children}
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" className="mb-2">
                    <DropdownMenuItem onClick={handleCreateProfile} className="cursor-pointer" data-onboarding="create-profile-menu-item">
                        <UserPlus className="mr-2 h-4 w-4" />
                        <span>Crear Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleViewProfiles} className="cursor-pointer" data-onboarding="view-profiles-menu-item">
                        <Users className="mr-2 h-4 w-4" />
                        <span>Cambiar Perfil</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <VerPerfil open={verPerfilOpen} onOpenChange={setVerPerfilOpen} />
        </>
    );
};
