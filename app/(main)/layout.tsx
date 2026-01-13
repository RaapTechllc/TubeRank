import { Header } from '@/components/layout/header'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="container mx-auto py-6" role="main" aria-label="Main content">
        {children}
      </main>
    </div>
  )
}
