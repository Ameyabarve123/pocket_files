"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gem, FolderOpen, Home, Settings, User, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useStorage } from "@/components/storage-context";

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

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${sizes[i]}`;
}

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { storageUsed, maxStorage, loading, userName, email, profilePicture} = useStorage();

  const percent = Math.round((storageUsed / maxStorage) * 100);
  const usedLabel = `${formatBytes(storageUsed)} / ${formatBytes(maxStorage)}`;
  const clampedPercent = Math.max(0, Math.min(100, percent));

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
      <nav className="p-4 space-y-2">
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
      <div className="border-t border-border mt-4">
        {/* Storage Usage */}
        <div className={cn("p-4", isCollapsed && "px-2")}>
          {loading ? (
            <div className="text-center text-xs text-muted-foreground">Loading...</div>
          ) : !isCollapsed ? (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Storage Used</span>
                <span className="font-semibold">{usedLabel}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${clampedPercent}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center gap-1"
              title={`Storage: ${usedLabel}`}
            >
              <div
                className="w-10 h-10 rounded-full p-6 border-4 border-muted relative flex items-center justify-center transition-all duration-300"
                style={{
                  background: `conic-gradient(#0ea5e9 ${clampedPercent}%, rgba(0,0,0,0.06) ${clampedPercent}%)`,
                }}
              >
                <div className="w-6 h-6 rounded-full bg-card flex items-center justify-center">
                  <span className="text-xs font-semibold">{clampedPercent}%</span>
                </div>
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

        {/* <div className="px-4 pb-2">
          <Link
            key={"pricing"}
            href={"/dashboard/pricing"}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
              pathname === "/dashboard/pricing"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
              isCollapsed && "justify-center"
            )}
            title={isCollapsed ? "Pricing" : undefined}
          >
            <span className="w-5 h-5 flex-shrink-0"><Gem className="w-5 h-5 flex-shrink-0"></Gem></span>
            {!isCollapsed && <span>Pricing</span>}
          </Link>
        </div> */}

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
            {!profilePicture || profilePicture === '""' ? (
                <User className="w-5 h-5 text-primary" />  
              ) : (
                <img src={profilePicture} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
              )
            }
              
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{email}</p>
              </div>
            )}
          </Link>
        </div>
      </div>
    </aside>
  );
}