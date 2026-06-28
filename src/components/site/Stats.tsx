type Stat = { value: string; label: string };

export function Stats({ items }: { items: Stat[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
      {items.map((s) => (
        <div key={s.label} className="bg-card px-6 py-8 text-center">
          <dt className="text-sm font-medium text-muted-foreground">{s.label}</dt>
          <dd className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {s.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
