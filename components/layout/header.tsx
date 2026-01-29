'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { SkipLink } from '@/components/ui/skip-link'
import { Menu, X, Home, FileText, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Digest', href: '/digest', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // Close mobile menu on route change
  const prevPathname = useRef(pathname)
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname
      setIsMobileMenuOpen(false)
    }
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        closeMobileMenu()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isMobileMenuOpen])

  return (
    <>
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#main-navigation">Skip to navigation</SkipLink>
      
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link 
          href="/dashboard" 
          className="text-xl font-bold hover:text-primary transition-all duration-300 touch-manipulation hover:scale-105 hover:text-shadow-neon"
          onClick={closeMobileMenu}
        >
          TubeRank
        </Link>

        {/* Desktop Navigation */}
        <nav id="main-navigation" className="hidden md:flex gap-6" role="navigation" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 text-sm transition-all duration-300 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-2 py-2 hover:bg-muted/50 hover:scale-105",
                  isActive ? "text-foreground font-medium bg-primary/10 shadow-sm" : "text-muted-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 touch-manipulation hover:bg-primary/10 hover:scale-110 transition-all duration-300"
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          <div className="relative h-5 w-5">
            <Menu 
              className={cn(
                "h-5 w-5 absolute transition-all duration-200",
                isMobileMenuOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
              )} 
              aria-hidden="true" 
            />
            <X 
              className={cn(
                "h-5 w-5 absolute transition-all duration-200",
                isMobileMenuOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
              )} 
              aria-hidden="true" 
            />
          </div>
        </Button>
      </div>

      {/* Mobile Navigation Menu */}
      <div 
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-all duration-300",
          isMobileMenuOpen ? "visible" : "invisible"
        )}
      >
        {/* Backdrop */}
        <div 
          className={cn(
            "absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
        
        {/* Mobile Menu */}
        <div 
          id="mobile-navigation"
          className={cn(
            "absolute top-16 left-0 right-0 bg-background border-b shadow-lg transition-all duration-300 transform",
            isMobileMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
          )}
          role="navigation"
          aria-label="Main navigation"
        >
          <nav className="container mx-auto px-4 py-6">
            <div className="flex flex-col space-y-2" role="list">
              {navigation.map((item, index) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "flex items-center gap-4 px-4 py-4 rounded-xl text-base font-medium transition-all duration-200 touch-manipulation",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      "active:scale-95 active:bg-muted/50",
                      isActive 
                        ? "bg-primary/10 text-primary shadow-sm border border-primary/20" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: isMobileMenuOpen ? 'slideInUp 0.3s ease-out forwards' : 'none'
                    }}
                    role="listitem"
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                      isActive ? "bg-primary/20" : "bg-muted/50"
                    )}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
    </>
  )
}