import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="text-xl font-bold">
          TubeRank
        </Link>
        <nav className="flex gap-6">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/digest" className="text-sm text-muted-foreground hover:text-foreground">
            Digest
          </Link>
          <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground">
            Settings
          </Link>
        </nav>
      </div>
    </header>
  )
}
