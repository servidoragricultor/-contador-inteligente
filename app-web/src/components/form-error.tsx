"use client";

import { ReactNode, useEffect, useRef } from "react";

export function FormError({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className={`calm-alert-error ${className}`} id={id} ref={ref} role="alert" tabIndex={-1}>
      {children}
    </div>
  );
}
