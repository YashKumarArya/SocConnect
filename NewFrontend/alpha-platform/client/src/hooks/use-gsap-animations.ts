
import { useEffect, useRef, MutableRefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useGSAPFadeIn = (trigger?: string, delay = 0) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(element,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay,
          ease: "power2.out",
          scrollTrigger: trigger ? {
            trigger: element,
            start: "top 80%",
            toggleActions: "play none none reverse"
          } : undefined
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [trigger, delay]);

  return ref;
};

export const useGSAPScaleIn = (delay = 0) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(element,
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          delay,
          ease: "back.out(1.7)"
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [delay]);

  return ref;
};

export const useGSAPStagger = (selector: string, delay = 0) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(element.querySelectorAll(selector),
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          delay,
          ease: "power2.out"
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [selector, delay]);

  return ref;
};

export const useGSAPSlideIn = (direction: 'left' | 'right' | 'up' | 'down' = 'up', delay = 0) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const getTransform = () => {
      switch (direction) {
        case 'left': return { x: -50, y: 0 };
        case 'right': return { x: 50, y: 0 };
        case 'up': return { x: 0, y: 50 };
        case 'down': return { x: 0, y: -50 };
        default: return { x: 0, y: 50 };
      }
    };

    const ctx = gsap.context(() => {
      const { x, y } = getTransform();
      gsap.fromTo(element,
        { opacity: 0, x, y },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.8,
          delay,
          ease: "power3.out"
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [direction, delay]);

  return ref;
};

export const useGSAPFloat = (intensity = 10, duration = 2) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const ctx = gsap.context(() => {
      gsap.to(element, {
        y: -intensity,
        duration,
        yoyo: true,
        repeat: -1,
        ease: "power2.inOut"
      });
    }, ref);

    return () => ctx.revert();
  }, [intensity, duration]);

  return ref;
};
