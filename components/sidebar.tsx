"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, FolderOpen, Home, Settings, User, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  {
    title: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Long Term Storage",
    href: "/dashboard/storage",
    icon: FolderOpen,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={cn(
      "border-r border-border bg-card h-full flex flex-col transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo/Brand with Collapse Button */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h2 className="text-xl font-bold">PocketFiles</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Organize your digital life
            </p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "p-2 rounded-lg hover:bg-accent transition-colors",
            isCollapsed && "mx-auto"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section: Storage, Settings, Profile */}
      <div className="border-t border-border">
        {/* Storage Usage */}
        <div className={cn("p-4", isCollapsed && "px-2")}>
          {!isCollapsed ? (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Storage Used</span>
                <span className="font-semibold">2.4 GB / 10 GB</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "24%" }}></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1" title="Storage: 2.4 GB / 10 GB">
              <div className="w-10 h-10 rounded-full border-4 border-muted relative flex items-center justify-center">
                <div 
                  className="absolute inset-0 rounded-full border-4 border-primary"
                  style={{ 
                    clipPath: "polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 0%)",
                    transform: "rotate(86deg)"
                  }}
                ></div>
                <span className="text-xs font-semibold relative z-10">24%</span>
              </div>
            </div>
          )}
        </div>

        {/* Settings Link */}
        <div className="px-4 pb-2">
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
              pathname === "/dashboard/settings"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? "Settings" : undefined}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </Link>
        </div>

        {/* Profile */}
        <div className="p-4 border-t border-border">
          <Link
            href="/dashboard/profile"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-all",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? "Profile" : undefined}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">John Doe</p>
                <p className="text-xs text-muted-foreground truncate">john@example.com</p>
              </div>
            )}
          </Link>
        </div>
      </div>
    </aside>
  );
}