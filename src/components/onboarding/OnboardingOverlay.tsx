import React, { useState, useEffect, useRef, useCallback } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import "./OnboardingOverlay.css";

/**
 * Computes where to place the tooltip relative to the target element.
 */
function computePositions(
  targetEl: HTMLElement | null,
  tooltipEl: HTMLElement | null,
  placement: string = "bottom"
) {
  const pad = 12;
  const gap = 16;

  // Center placement — no target element needed
  if (placement === "center" || !targetEl) {
    const tooltipWidth = tooltipEl?.offsetWidth ?? 380;
    const tooltipHeight = tooltipEl?.offsetHeight ?? 250;
    return {
      tooltipPos: {
        top: Math.max(window.innerHeight / 2 - tooltipHeight / 2, 20),
        left: Math.max(window.innerWidth / 2 - tooltipWidth / 2, 16),
      },
      spotRect: {
        // For center, make spotlight cover the whole visible area (but leave space for tooltip)
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  const rect = targetEl.getBoundingClientRect();
  const spotRect = {
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };

  const tooltipWidth = tooltipEl?.offsetWidth ?? 380;
  const tooltipHeight = tooltipEl?.offsetHeight ?? 200;

  let top = 0;
  let left = 0;

  switch (placement) {
    case "top":
      top = spotRect.top - tooltipHeight - gap;
      left = spotRect.left + spotRect.width / 2 - tooltipWidth / 2;
      break;
    case "bottom":
      top = spotRect.top + spotRect.height + gap;
      left = spotRect.left + spotRect.width / 2 - tooltipWidth / 2;
      break;
    case "bottom-fixed":
      // Fixed at the very bottom of the screen
      top = window.innerHeight - tooltipHeight - 20; 
      left = window.innerWidth / 2 - tooltipWidth / 2;
      break;
    case "left":
      top = spotRect.top + spotRect.height / 2 - tooltipHeight / 2;
      left = spotRect.left - tooltipWidth - gap;
      break;
    case "right":
      top = spotRect.top + spotRect.height / 2 - tooltipHeight / 2;
      left = spotRect.left + spotRect.width + gap;
      break;
    default:
      top = spotRect.top + spotRect.height + gap;
      left = spotRect.left + spotRect.width / 2 - tooltipWidth / 2;
  }

  // Keep tooltip within viewport
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (left < 12) left = 12;
  if (left + tooltipWidth > vw - 12) left = vw - tooltipWidth - 12;
  if (top + tooltipHeight > vh - 12) {
    top = spotRect.top - tooltipHeight - gap;
  }
  if (top < 12) {
    top = spotRect.top + spotRect.height + gap;
    if (top + tooltipHeight > vh - 12) top = 12;
  }

  return { tooltipPos: { top, left }, spotRect };
}

export const OnboardingOverlay: React.FC = () => {
  const {
    isOnboarding,
    currentStep,
    totalSteps,
    currentStepData,
    nextStep,
    prevStep,
    skipOnboarding,
    registerAction,
    unregisterAction,
  } = useOnboarding();

  const tooltipRef = useRef<HTMLDivElement>(null);
  const [spotRect, setSpotRect] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipKey, setTooltipKey] = useState(0);
  const prevStepRef = useRef<number>(-1);

  const updatePositions = useCallback(() => {
    if (!currentStepData) return;

    const isCenter = currentStepData.placement === "center";

    const targetEl = isCenter
      ? null
      : document.querySelector<HTMLElement>(
          `[data-onboarding="${currentStepData.target}"]`
        );

    if (!isCenter && !targetEl) return;

    const { tooltipPos: tp, spotRect: sr } = computePositions(
      targetEl,
      tooltipRef.current,
      currentStepData.placement
    );
    setTooltipPos(tp);
    setSpotRect(sr);
  }, [currentStepData]);

  // On step change: find target, trigger action, compute positions
  useEffect(() => {
    if (!isOnboarding || !currentStepData) {
      setIsVisible(false);
      return;
    }

    // Trigger action for this step (if any) — delayed to let navigation happen
    const actionTimer = setTimeout(() => {
      if (currentStepData.action) {
        // Trigger the action registered by the page
        const cb = (window as any).__onboarding_actions?.[currentStepData.action];
        // We use the registerAction system instead
      }
    }, 100);

    // Wait for DOM to update and animations to settle
    let attempts = 0;
    const posTimer = setInterval(() => {
      attempts++;
      updatePositions();
      if (attempts === 5) {
        // Show overlay after ~250ms
        setIsVisible(true);
        setTooltipKey((k) => k + 1);
      }
      if (attempts >= 20) {
        // Stop polling after ~1s
        clearInterval(posTimer);
      }
    }, 50);

    prevStepRef.current = currentStep;

    return () => {
      clearTimeout(actionTimer);
      clearInterval(posTimer);
    };
  }, [isOnboarding, currentStep, currentStepData, updatePositions]);

  // Update positions on scroll/resize
  useEffect(() => {
    if (!isOnboarding) return;
    const handleUpdate = () => updatePositions();
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);
    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [isOnboarding, updatePositions]);

  // Scroll target into view (not for center placement)
  useEffect(() => {
    if (!isOnboarding || !currentStepData) return;
    if (currentStepData.placement === "center") return;

    const timer = setTimeout(() => {
      const targetEl = document.querySelector<HTMLElement>(
        `[data-onboarding="${currentStepData.target}"]`
      );
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(updatePositions, 400);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [isOnboarding, currentStep, currentStepData, updatePositions]);

  if (!isOnboarding || !currentStepData) return null;

  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;
  const isCenter = currentStepData.placement === "center";

  // Clip path: for center placement, show full dark overlay; otherwise cut a hole
  const clipPath = isCenter
    ? "none"
    : `polygon(
        0% 0%, 0% 100%, 
        ${spotRect.left}px 100%, 
        ${spotRect.left}px ${spotRect.top}px, 
        ${spotRect.left + spotRect.width}px ${spotRect.top}px, 
        ${spotRect.left + spotRect.width}px ${spotRect.top + spotRect.height}px, 
        ${spotRect.left}px ${spotRect.top + spotRect.height}px, 
        ${spotRect.left}px 100%, 
        100% 100%, 100% 0%
      )`;

  return (
    <div className={`onboarding-overlay ${isVisible ? "active" : ""}`}>
      {/* Dark backdrop */}
      <div
        className="onboarding-backdrop"
        style={{ clipPath }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Spotlight ring (not for center) */}
      {!isCenter && (
        <div
          className="onboarding-spotlight"
          style={{
            top: spotRect.top,
            left: spotRect.left,
            width: spotRect.width,
            height: spotRect.height,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        key={tooltipKey}
        className="onboarding-tooltip"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
        }}
      >
        {/* Progress dots */}
        <div className="onboarding-progress">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`progress-dot ${
                i === currentStep
                  ? "active"
                  : i < currentStep
                  ? "completed"
                  : ""
              }`}
            />
          ))}
          <span className="progress-text">
            {currentStep + 1} / {totalSteps}
          </span>
        </div>

        {/* Content */}
        <div className="tooltip-title">{currentStepData.title}</div>
        <div className="tooltip-description">{currentStepData.description}</div>

        {/* Actions */}
        <div className="onboarding-actions">
          {!isFirstStep && (
            <button className="btn-back" onClick={prevStep}>
              ← Atrás
            </button>
          )}
          <button className="btn-next" onClick={nextStep}>
            {isLastStep ? "🎉 ¡Empezar!" : "Siguiente →"}
          </button>
          {!isLastStep && (
            <button className="btn-skip" onClick={skipOnboarding}>
              Saltar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
