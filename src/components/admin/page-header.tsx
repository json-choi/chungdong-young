import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  meta?: ReactNode;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, meta, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 pb-5 border-b border-church-border-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="font-heading text-[24px] sm:text-[26px] text-church-text leading-tight">
              {title}
            </h1>
            {meta ? (
              <span className="font-mono text-[12px] text-church-muted tabular-nums">
                {meta}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="mt-1.5 text-[13.5px] text-church-muted leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
