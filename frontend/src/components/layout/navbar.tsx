'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Home,
  Trophy,
  Users,
  Settings,
  LogOut,
  User,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuthStore as useAuth } from '@/features/auth/auth.store';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Tournaments', href: '/tournaments', icon: Trophy },
  { name: 'Teams', href: '/teams', icon: Users },
  { name: 'Live', href: '/live', icon: Activity },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled
            ? 'bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800 shadow-lg'
            : 'bg-transparent'
        )}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group transition-transform hover:scale-105">
              <img 
                src="/icons/full-logo.png" 
                alt="PitchPulse" 
                className="h-8 md:h-10 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    pathname === item.href
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <div className="hidden lg:flex items-center gap-4">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={logout}
                    className="gap-2 text-zinc-400 hover:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-3">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 lg:hidden"
          >
            <div className="bg-zinc-900 border-b border-zinc-800 shadow-xl p-4">
              <div className="space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-primary-500/10 text-primary-400'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}

                <div className="pt-4 mt-4 border-t border-zinc-800 space-y-2">
                  {isAuthenticated ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                      >
                        <Settings className="w-5 h-5" />
                        Dashboard
                      </Link>
                      <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium text-red-400 hover:bg-zinc-800 transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="flex items-center justify-center w-full px-4 py-3 rounded-lg text-base font-medium text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-600 transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        className="flex items-center justify-center w-full px-4 py-3 rounded-lg text-base font-medium bg-primary-500 hover:bg-primary-600 text-white transition-colors"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
