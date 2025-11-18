"use client";
import { FolderOpen, Plus, Upload, Send, Search, Grid3x3, List, MoreVertical, Clock, FileText, Link as LinkIcon, Image, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import DataCard from "@/components/data-card";
import { useRef, useState } from "react";


export default function ProtectedPage() {
  // Mock data - replace with real data later
  const [sharedItems, setSharedItems] = useState(null);
  

  const fileInputRef = useRef<HTMLInputElement>(null);
  let mins: number = -1;

  const chooseDuration = (minutes: number) => {
    mins = minutes;
  }

  async function uploadImageClient(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("duration", mins.toString());

    const res = await fetch("/api/upload/temp-storage", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (res.ok) {
      alert("File uploaded successfully!");
    } else {
      console.log(result.error.message);
      alert("Upload failed: " + result.error.message);
    }
  }

  async function getData() {
    const res = await fetch("/api/get/temp-storage", {
      method: "GET",
    });

    return res.json();
  }

  // getData().then((data) => {
  //   setSharedItems(data);
  // });

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
        {Array.isArray(sharedItems) && sharedItems.length > 0 ? (
          <div className="space-y-3">
            {sharedItems.map((row) => (
              <DataCard
                key={row.id.toString()}
                id={row.id.toString()}
                // type={row.type as "note" | "link" | "file"}
                type={"file"}
                title={row.title}
                content={row.content}
                expiresIn={row.expiresIn}
              />
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
                <button onClick={() => chooseDuration(5)} className="px-4 py-2 rounded-lg border-2 border-border hover:border-primary focus:border-primary focus:bg-primary focus:text-primary-foreground hover:bg-primary/10 text-sm font-medium transition-all">
                  5 minutes
                </button>
                <button onClick={() => chooseDuration(30)} className="px-4 py-2 rounded-lg border-2 border-border hover:border-primary focus:border-primary focus:bg-primary focus:text-primary-foreground hover:bg-primary/10 text-sm font-medium transition-all">
                  30 minutes
                </button>
                <button onClick={() => chooseDuration(60)} className="px-4 py-2 rounded-lg border-2 border-border hover:border-primary focus:border-primary focus:bg-primary focus:text-primary-foreground hover:bg-primary/10 text-sm font-medium transition-all">
                  1 hour
                </button>
                <button onClick={() => chooseDuration(1440)} className="px-4 py-2 rounded-lg border-2 border-border hover:border-primary focus:border-primary focus:bg-primary focus:text-primary-foreground hover:bg-primary/10 text-sm font-medium transition-all">
                  24 hours
                </button>
              </div>
            </div>

            {/* Upload and Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Upload button */}
              <input
                type="file"
                accept="*/*"
                ref={fileInputRef}
                className="hidden"
                onChange={uploadImageClient}
              />

              {/* Upload button */}
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
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