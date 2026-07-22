"use client";

import { ComponentProps, ReactNode } from "react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = Omit<ComponentProps<"button">, "children"> & {
  children: ReactNode;
  pendingLabel: string;
};

export function SubmitButton({ children, disabled, pendingLabel, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button {...props} disabled={disabled || pending} type="submit">
      {pending ? (
        <span className="inline-flex items-center gap-2" role="status">
          <span aria-hidden="true" className="calm-spinner" />
          {pendingLabel}
        </span>
      ) : children}
    </button>
  );
}
