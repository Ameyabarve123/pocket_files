import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Sidebar } from "@/components/sidebar";
import { StorageProvider } from '@/components/storage-context';
import { AlertProvider } from "@/components/alert-context";
import { MobileNav } from "@/components/mobile-nav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StorageProvider>
      <main className="min-h-screen flex flex-col">
          {/* Top Navigation */}
          <nav className="w-full border-b border-b-foreground/10 h-14 sm:h-16 flex-shrink-0">
            <div className="w-full h-full flex justify-between items-center px-4 sm:px-5">
              <div className="flex gap-3 sm:gap-5 items-center font-semibold">
                <MobileNav />
                <span className="text-base sm:text-lg">PocketFiles</span>
              </div>
              <AuthButton />
            </div>
          </nav>

          {/* Main Content Area with Sidebar */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Sidebar */}
            <div className="hidden lg:block">
              <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-auto">
              <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8 md:px-8">
                <AlertProvider>
                  {children}
                </AlertProvider>
              </div>

              {/* Footer */}
              <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-6 sm:py-8">
                <ThemeSwitcher />
              </footer>
            </div>
          </div>
      </main>
    </StorageProvider>
  );
}