import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPlus, Users } from "lucide-react";

interface SidebarProps {
    children: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ children }) => {
    const handleCreateProfile = () => {
        console.log("Crear Perfil clicked");
        // Add logic here
    };

    const handleViewProfiles = () => {
        console.log("Ver Perfiles clicked");
        // Add logic here
    };

    return (
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
                    <span>Ver Perfiles</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
