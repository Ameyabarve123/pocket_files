import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Sidebar } from "@/components/sidebar";
import { StorageProvider } from '@/components/storage-context';



export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StorageProvider>
      <main className="min-h-screen flex flex-col">
        {/* Top Navigation */}
        <nav className="w-full border-b border-b-foreground/10 h-16 flex-shrink-0">
          <div className="w-full h-full flex justify-between items-center px-5">
            <div className="flex gap-5 items-center font-semibold">
              <span className="text-lg">PocketFiles</span>
            </div>
            <AuthButton />
          </div>
        </nav>

        {/* Main Content Area with Sidebar */}
        <div className="flex-1 flex">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 max-w-7xl w-full mx-auto p-8">
              {children}
            </div>

            {/* Footer */}
            <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8">
              <ThemeSwitcher />
            </footer>
          </div>
        </div>
      </main>
    </StorageProvider>
  );
}