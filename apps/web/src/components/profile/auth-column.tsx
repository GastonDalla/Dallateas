import type { ReactNode } from "react";

import { PageHeader } from "@/components/shell/page-header";

type AuthColumnProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

/** The one narrow column every sign-in screen shares. */
export function AuthColumn({ title, description, children, footer }: AuthColumnProps) {
  return (
    <div className="mx-auto w-full max-w-sm px-4 py-12 md:py-20">
      <PageHeader title={title} description={description} />
      <div className="mt-8">{children}</div>
      {footer && <p className="mt-8 text-sm text-muted-foreground">{footer}</p>}
    </div>
  );
}

export function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-6">
      <p className="tabular text-[13px] text-muted-foreground">
        Paso {step} de {total}
      </p>
      <div aria-hidden="true" className="mt-2 flex gap-1">
        {Array.from({ length: total }, (_, index) => (
          <span key={index} className={index < step ? "h-1 flex-1 bg-primary" : "h-1 flex-1 bg-muted"} />
        ))}
      </div>
    </div>
  );
}
