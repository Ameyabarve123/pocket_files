import { FolderOpen, Plus, Upload, Send, Search, Grid3x3, List, MoreVertical, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function LongTermStorage() {
  return (
    <div className="flex flex-col gap-12 w-full">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Temporary Share</h1>
        <p className="text-lg text-muted-foreground">
          Quickly share folders, notes, or files with anyone
        </p>
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
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="group rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer relative"
            >
              {/* More options */}
              <button className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>

              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FolderOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1 w-full">
                  <p className="font-semibold text-sm truncate">Folder {i}</p>
                  <p className="text-xs text-muted-foreground">3 items</p>
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>2h left</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Add new folder */}
          <button className="rounded-xl border-2 border-dashed border-border p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all h-full min-h-[140px]">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium">Create Folder</span>
          </button>
        </div>

        {/* Alternative: List View (commented out, can be toggled) */}
        {/* 
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">Folder {i}</p>
                  <p className="text-xs text-muted-foreground">3 items • Expires in 2h</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        */}

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

      {/* Quick Share Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Quick Share</h2>
        
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            {/* Duration Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Expiration Time</label>
              <div className="flex flex-wrap gap-2">
                <button className="px-4 py-2 rounded-lg border-2 border-primary bg-primary text-primary-foreground text-sm font-medium transition-all">
                  5 minutes
                </button>
                <button className="px-4 py-2 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/10 text-sm font-medium transition-all">
                  30 minutes
                </button>
                <button className="px-4 py-2 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/10 text-sm font-medium transition-all">
                  1 hour
                </button>
                <button className="px-4 py-2 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/10 text-sm font-medium transition-all">
                  24 hours
                </button>
              </div>
            </div>

            {/* Upload and Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Upload button */}
              <Button variant="outline" size="lg" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload File
              </Button>

              {/* Input */}
              <div className="flex-1 flex items-center gap-3 border border-border rounded-lg px-4 py-3 bg-background focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 transition-all">
                <input
                  type="text"
                  placeholder="Write a note or paste a link..."
                  className="flex-1 bg-transparent outline-none text-sm"
                />
                <Button size="sm" className="gap-2">
                  <Send className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Files and notes will be automatically deleted after the selected time
          </p>
        </div>
      </div>
    </div>
  );
}