import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatLine {
  label: string;
  value: string | number;
}

interface StatWidgetProps {
  title: string;
  badge?: { text: string; className?: string };
  lines: StatLine[];
  progress?: { value: number; colorClass?: string };
  actionLabel?: string;
  actionHref?: string;
}

function isZero(value: string | number) {
  return value === 0 || value === "0";
}

export function StatWidget({
  title,
  badge,
  lines,
  progress,
  actionLabel,
  actionHref,
}: StatWidgetProps) {
  const allZero = lines.length > 0 && lines.every((line) => isZero(line.value));

  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {badge && (
          <Badge variant="outline" className={badge.className}>
            {badge.text}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-1.5">
        {allZero ? (
          <div className="flex flex-1 items-center justify-center py-4">
            <p className="text-sm text-muted-foreground/60">Nothing here yet</p>
          </div>
        ) : (
          lines.map((line) => (
            <div key={line.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{line.label}</span>
              <span
                className={cn(
                  "font-medium tabular-nums",
                  isZero(line.value) && "text-muted-foreground/50"
                )}
              >
                {line.value}
              </span>
            </div>
          ))
        )}

        {progress && (
          progress.value > 0 ? (
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", progress.colorClass ?? "bg-primary")}
                style={{ width: `${Math.min(progress.value, 100)}%` }}
              />
            </div>
          ) : (
            <div className="mt-1 h-1.5 w-full rounded-full border border-dashed border-muted-foreground/25" />
          )
        )}

        {actionLabel && actionHref && (
          <Link
            href={actionHref}
            className="mt-3 flex h-9 items-center justify-center rounded-md border border-input text-sm font-medium text-primary transition-colors hover:bg-accent/10"
          >
            {actionLabel}
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
