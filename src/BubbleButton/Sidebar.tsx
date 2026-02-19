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

interface SidebarProps {
    children: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ children }) => {
    const navigate = useNavigate();
    const [verPerfilOpen, setVerPerfilOpen] = useState(false);

    const handleCreateProfile = () => {
        navigate("/shared");
    };

    const handleViewProfiles = () => {
        setVerPerfilOpen(true);
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    {children}
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" className="mb-2">
                    <DropdownMenuItem onClick={handleCreateProfile} className="cursor-pointer">
                        <UserPlus className="mr-2 h-4 w-4" />
                        <span>Crear Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleViewProfiles} className="cursor-pointer">
                        <Users className="mr-2 h-4 w-4" />
                        <span>Cambiar Perfil</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <VerPerfil open={verPerfilOpen} onOpenChange={setVerPerfilOpen} />
        </>
    );
};
