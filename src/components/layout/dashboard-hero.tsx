export function DashboardHero({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-[oklch(0.271_0.105_12.094)] px-8 py-10 shadow-lg shadow-primary/10">
      <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
      <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
      <div className="relative">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-primary-foreground">
          {title}
        </h1>
        <p className="mt-1.5 text-primary-foreground/75">{subtitle}</p>
      </div>
    </div>
  );
}
