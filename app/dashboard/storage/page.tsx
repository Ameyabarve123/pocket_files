import { Plus, Search, Grid3x3, List } from "lucide-react";
import FolderCard from "@/components/folder-card";
import { Button } from "@/components/ui/button";

export default async function LongTermStorage() {
  return (
    <div className="flex flex-col gap-12 w-full">
      {/* Page Header with Search */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Files</h1>
          <p className="text-lg text-muted-foreground">
            Save and organize your files for long-term access.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="flex items-center gap-2 border border-border rounded-lg px-4 py-3 bg-card shadow-sm max-w-2xl">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your files..."
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Folders Section with Search and View Toggle */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold">Your Folders</h2>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="flex-1 sm:flex-initial flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-background min-w-[200px]">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search folders..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center border border-border rounded-lg p-1">
              <button className="p-1.5 rounded hover:bg-accent transition-colors bg-accent">
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded hover:bg-accent transition-colors">
                <List className="w-4 h-4" />
              </button>
            </div>

            <Button variant="default" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New
            </Button>
          </div>
        </div>

        {/* Grid View */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* Example folder cards */}
          {["Folder 1", "Folder 2", "Folder 3", "Folder 4"].map((i) => (
            <FolderCard key={i} i={i} />
          ))}

          {/* Add new folder */}
          <button className="rounded-xl border-2 border-dashed border-border p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all h-full min-h-[140px]">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium">Create Folder</span>
          </button>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">Showing 8 of 24 folders</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}