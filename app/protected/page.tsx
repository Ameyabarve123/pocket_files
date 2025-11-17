import { FolderOpen, Plus, Upload, Send, Search, Grid3x3, List, MoreVertical, Clock, FileText, Link as LinkIcon, Image, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ProtectedPage() {
  // Mock data - replace with real data later
  const sharedItems = [
    { id: 1, type: "note", title: "Meeting notes", content: "Quick notes from the standup...", expiresIn: "4m 32s" },
    { id: 2, type: "link", title: "https://example.com/article", content: "https://example.com/article", expiresIn: "12m 05s" },
    { id: 3, type: "file", title: "presentation.pdf", content: "2.4 MB", expiresIn: "45m 18s" },
  ];

  return (
    <div className="flex flex-col gap-12 w-full">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Temporary Share</h1>
        <p className="text-lg text-muted-foreground">
          Quickly share folders, notes, or files with anyone
        </p>
      </div>

      {/* Shared Items Display Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Active Shares</h2>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 bg-background min-w-[200px]">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search shares..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center border border-border rounded-lg p-1">
              <button className="p-1.5 rounded hover:bg-accent transition-colors">
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded hover:bg-accent transition-colors bg-accent">
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Items List */}
        {sharedItems.length > 0 ? (
          <div className="space-y-3">
            {sharedItems.map((item) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start gap-4">
                  {/* Icon based on type */}
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {item.type === "note" && <FileText className="w-5 h-5 text-primary" />}
                    {item.type === "link" && <LinkIcon className="w-5 h-5 text-primary" />}
                    {item.type === "file" && <File className="w-5 h-5 text-primary" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          <Clock className="w-3 h-3" />
                          <span>{item.expiresIn}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{item.content}</p>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-3">
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        Copy Link
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        View
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive">
                        <X className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty state
          <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
            <div className="max-w-sm mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">No active shares</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a file, share a link, or write a note below to get started
                </p>
              </div>
            </div>
          </div>
        )}
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