import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function TrustedBy() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const logosRef = useRef<HTMLDivElement>(null);

  const logos = [
    { name: "YC", color: "bg-[hsl(220,15%,10%)]" },
    { name: "Stripe", color: "bg-[hsl(220,15%,10%)]" },
    { name: "Zip", color: "bg-[hsl(220,15%,10%)]" },
    { name: "Tech Co", color: "bg-[hsl(220,15%,10%)]" },
    { name: "Secure", color: "bg-[hsl(220,15%,10%)]" },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(titleRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Logos stagger animation
      gsap.fromTo(logosRef.current?.children,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: logosRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Hover animations for logos
      if (logosRef.current) {
        Array.from(logosRef.current.children).forEach((logo) => {
          const logoElement = logo as HTMLElement;
          
          logoElement.addEventListener('mouseenter', () => {
            gsap.to(logoElement, { scale: 1.1, duration: 0.3, ease: "power2.out" });
          });

          logoElement.addEventListener('mouseleave', () => {
            gsap.to(logoElement, { scale: 1, duration: 0.3, ease: "power2.out" });
          });
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 px-6 border-t border-[hsl(330,100%,50%)]/20 bg-[hsl(220,15%,5%)]">
      <div className="container mx-auto">
        <p 
          ref={titleRef}
          className="text-center text-gray-400 mb-8"
        >
          Trusted by industry leaders
        </p>
        
        <div 
          ref={logosRef}
          className="flex flex-wrap justify-center items-center gap-8 opacity-70"
        >
          {logos.map((logo, index) => (
            <div
              key={logo.name}
              className={`w-24 h-12 ${logo.color} rounded flex items-center justify-center border border-[hsl(330,100%,50%)]/10 hover:border-[hsl(330,100%,50%)]/40 shadow-md transition-all duration-300 cursor-pointer`}
            >
              <span className="text-white font-semibold text-sm">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
