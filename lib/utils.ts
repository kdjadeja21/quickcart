import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Creates an increment animation effect for numerical values
 * @param fromValue - Starting value
 * @param toValue - Target value
 * @param duration - Animation duration in milliseconds
 * @param onUpdate - Callback function called on each animation frame with current value
 * @param easing - Easing function (default: easeOutQuart)
 */
export function animateIncrement(
  fromValue: number,
  toValue: number,
  duration: number,
  onUpdate: (value: number) => void,
  easing: 'linear' | 'easeOutQuart' | 'easeOutCubic' | 'easeOutExpo' = 'easeOutQuart'
): () => void {
  const startTime = performance.now();
  const valueDiff = toValue - fromValue;
  
  // Easing functions
  const easingFunctions = {
    linear: (t: number) => t,
    easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
    easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
    easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
  };
  
  const ease = easingFunctions[easing];
  
  let animationId: number;
  
  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const easedProgress = ease(progress);
    const currentValue = fromValue + (valueDiff * easedProgress);
    
    onUpdate(currentValue);
    
    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    }
  };
  
  animationId = requestAnimationFrame(animate);
  
  // Return cleanup function
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };
}
