import React from "react";
import { Mic } from "lucide-react";
import "@/BubbleButton/Button.css"; // Reuse and extend some styles, or we can use inline/tailwind for the color

interface SpeechRecognitionBubbleProps {
  onClick: () => void;
}

export const SpeechRecognitionBubble: React.FC<SpeechRecognitionBubbleProps> = ({ onClick }) => {
  return (
    <div
      className="combined-bubble speech"
      aria-label="Registrar transacción por voz"
      role="button"
      tabIndex={0}
      onClick={onClick}
    >
      <div className="bubble-core">
        <div className="icon-container">
          <Mic className="bubble-icon" style={{ color: "white" }} />
        </div>
      </div>

      <div className="tooltip always-visible" style={{ position: "absolute", right: "calc(100% + 15px)" }}>
        Por voz
      </div>
    </div>
  );
};
