import React, { useState, useEffect } from 'react';
import { FaUsers } from 'react-icons/fa';
import { useAuth } from "@/contexts/AuthContext";
import './Button.css';

// Definir los tipos para las props (aunque este componente no recibe props)
interface CombinedBubbleProps { }

const CombinedBubble: React.FC<CombinedBubbleProps> = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Verificar si el usuario tiene correo de la universidad
    if (user?.email && user.email.endsWith('@correo.unimet.edu.ve')) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [user]); // Se ejecuta cada vez que cambia el usuario

  const handleWhatsAppClick = (): void => {
    window.open('https://wa.me/+584125936487', '_blank');
  };

  // Si no es visible, no renderizar nada
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="combined-bubble whatsapp"
      onClick={handleWhatsAppClick}
      aria-label="Contactar por WhatsApp"
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent): void => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleWhatsAppClick();
        }
      }}
    >
      <div className="bubble-core">
        <div className="icon-container">
          <FaUsers className="bubble-icon" />
        </div>
      </div>

      {/* Tooltip siempre visible */}
      <div className="tooltip always-visible">
        Contactar por WhatsApp
      </div>
    </div>
  );
};

export default CombinedBubble;