import React from 'react';
import { FaUsers } from 'react-icons/fa';
import './CombinedBubble.css';

// Definir los tipos para las props (aunque este componente no recibe props)
interface CombinedBubbleProps {}

const CombinedBubble: React.FC<CombinedBubbleProps> = () => {
  const handleWhatsAppClick = (): void => {
    window.open('https://wa.me/+584125936487', '_blank');
  };

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