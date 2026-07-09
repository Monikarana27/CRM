import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatWidgetProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  colorClass?: string;
  suffix?: string;
}

export function StatWidget({
  title,
  value,
  icon: Icon,
  colorClass = "bg-primary/10 text-primary",
  suffix,
}: StatWidgetProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-display text-2xl font-semibold tabular-nums">
          {typeof value === "number" ? value.toLocaleString("en-IN") : value}
          {suffix && <span className="ml-1 text-sm font-normal text-muted-foreground">{suffix}</span>}
        </div>
      </CardContent>
    </Card>
  );
}