"use client";

import React, { useEffect, useRef, useState, createContext, useContext } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  durationMs?: number;
  direction?: "up" | "down" | "left" | "right" | "scale" | "none";
  threshold?: number;
}

export function ScrollReveal({
  children,
  className = "",
  delayMs = 0,
  durationMs = 700,
  direction = "up",
  threshold = 0.15,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const getTransformClasses = () => {
    if (isVisible) return "opacity-100 translate-x-0 translate-y-0 scale-100";
    switch (direction) {
      case "up":
        return "opacity-0 translate-y-8";
      case "down":
        return "opacity-0 -translate-y-8";
      case "left":
        return "opacity-0 translate-x-8";
      case "right":
        return "opacity-0 -translate-x-8";
      case "scale":
        return "opacity-0 scale-95 translate-y-4";
      case "none":
        return "opacity-0";
      default:
        return "opacity-0 translate-y-8";
    }
  };

  return (
    <div
      ref={elementRef}
      style={{
        transitionDuration: `${durationMs}ms`,
        transitionDelay: `${delayMs}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className={`transition-all ${getTransformClasses()} ${className}`}
    >
      {children}
    </div>
  );
}

interface StaggerContextType {
  isVisible: boolean;
  staggerMs: number;
}

const StaggerContext = createContext<StaggerContextType>({
  isVisible: false,
  staggerMs: 100,
});

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerMs?: number;
  threshold?: number;
}

export function StaggerContainer({
  children,
  className = "",
  staggerMs = 120,
  threshold = 0.15,
}: StaggerContainerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return (
    <StaggerContext.Provider value={{ isVisible, staggerMs }}>
      <div ref={containerRef} className={className}>
        {children}
      </div>
    </StaggerContext.Provider>
  );
}

interface StaggerItemProps {
  children: React.ReactNode;
  index: number;
  className?: string;
  durationMs?: number;
}

export function StaggerItem({
  children,
  index,
  className = "",
  durationMs = 650,
}: StaggerItemProps) {
  const { isVisible, staggerMs } = useContext(StaggerContext);
  const delayMs = index * staggerMs;

  return (
    <div
      style={{
        transitionDuration: `${durationMs}ms`,
        transitionDelay: `${delayMs}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className={`transition-all ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-7 scale-[0.98]"
      } ${className}`}
    >
      {children}
    </div>
  );
}
