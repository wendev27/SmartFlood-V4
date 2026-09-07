"use client";

import Link from "next/link";

interface LandingNavLinkProps {
  href: `#${string}`;
  children: string;
}

export function LandingNavLink({ href, children }: LandingNavLinkProps) {
  function animateNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    const destination = document.querySelector<HTMLElement>(href);
    if (!destination) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    destination.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", href);

    if (reduceMotion) return;

    event.currentTarget.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(0.9)", color: "#0088ff" },
        { transform: "scale(1)" },
      ],
      { duration: 320, easing: "cubic-bezier(.22,1,.36,1)" },
    );

    destination.animate(
      [
        { opacity: 0.7, transform: "translateY(18px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 620, easing: "cubic-bezier(.22,1,.36,1)" },
    );
  }

  return <Link href={href} onClick={animateNavigation}>{children}</Link>;
}
