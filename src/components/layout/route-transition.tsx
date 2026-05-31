"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * RouteTransition — Calm, architectural page transitions.
 *
 * Uses a very subtle opacity cross-fade. No spring, no bounce, no motion.
 * Just a quiet visual acknowledgment that the surface has changed.
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setIsTransitioning(true);
      prevPathname.current = pathname;

      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return (
    <div
      className={
        isTransitioning
          ? "opacity-0 transition-opacity duration-200 ease-out"
          : "opacity-100 transition-opacity duration-300 ease-out delay-75"
      }
    >
      {children}
    </div>
  );
}
