/**
 * Staggered entrance reveal powered by GSAP.
 *
 * Attach the returned ref to a container; every descendant marked with
 * `data-reveal` fades and rises into place on mount, one after another.
 * Honors `prefers-reduced-motion` (no animation, content stays visible)
 * and uses a layout effect so elements never flash before hiding.
 */
import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useIsomorphicLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");
    if (targets.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        opacity: 0,
        y: 18,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.08,
        clearProps: "transform",
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return ref;
}
