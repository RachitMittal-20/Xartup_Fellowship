export default function CompanyProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Company Profile</h1>
      <p className="mt-1 text-muted-foreground">
        Detailed view — overview, signals, notes, enrichment.
      </p>
    </div>
  );
}
