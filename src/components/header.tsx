import { GlobalSearch } from "@/components/global-search";

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <GlobalSearch />
    </header>
  );
}
