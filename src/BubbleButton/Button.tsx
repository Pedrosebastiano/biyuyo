import React, { useState, useEffect } from 'react';
import { FaUsers } from 'react-icons/fa';
import { useAuth } from "@/contexts/AuthContext";
import './Button.css';
import { Sidebar } from './Sidebar';

// Definir los tipos para las props (aunque este componente no recibe props)
interface CombinedBubbleProps { }

const CombinedBubble: React.FC<CombinedBubbleProps> = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Mostrar solo a usuarios premium
    if (user?.is_premium) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [user]);

  const handleWhatsAppClick = (): void => {
    window.open('https://wa.me/+584125936487', '_blank');
  };

  // Si no es visible, no renderizar nada
  if (!isVisible) {
    return null;
  }

  return (
    <Sidebar>
      <div
        className="combined-bubble whatsapp"
        aria-label="Menú de Perfiles"
        role="button"
        tabIndex={0}
        data-onboarding="premium-bubble-btn"
      >
        <div className="bubble-core">
          <div className="icon-container">
            <FaUsers className="bubble-icon" />
          </div>
        </div>

        {/* Tooltip siempre visible */}
        <div className="tooltip always-visible">
          Menú
        </div>
      </div>
    </Sidebar>
  );
};

export default CombinedBubble;