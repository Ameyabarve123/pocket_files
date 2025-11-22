"use client";
import { Upload, Send, Search, Grid3x3, List, Link as LinkIcon, Image, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import DataCard from "@/components/data-card";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProtectedPage() {
  const [sharedItems, setSharedItems] = useState<any[] | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [textInput, setTextInput] = useState("");

  const filteredItems = sharedItems?.filter((item) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      item.file_name.toLowerCase().includes(query) ||
      item.file_type.toLowerCase().includes(query) ||
      (item.data && item.data.toLowerCase().includes(query))
    );
  });

  async function uploadImageClient(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("duration", selectedDuration.toString());

    const res = await fetch("/api/upload/temp-storage/file", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (res.ok) {
      alert("File uploaded successfully!");
      getData().then((data) => {
        setSharedItems(data);
      });
    } else {
      console.log(result.error);
      alert("Upload failed: " + result.error.message);
    }
  }

  async function uploadTextClient() {
    if (textInput == "") return;

    const formData = new FormData();
    formData.append("text", textInput);
    formData.append("duration", selectedDuration.toString());

    const res = await fetch("/api/upload/temp-storage/text", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    if (res.ok) {
      alert("Text uploaded successfully!");
      setTextInput("");
      getData().then((data) => {
        setSharedItems(data);
      });
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

  // Fetch data on component mount
  useEffect(() => {
    getData().then((data) => {
      setSharedItems(data);
    });

    const supabase = createClient();
    const channel = supabase
      .channel('temp_storage_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'temp_storage' },
        () => {
          getData().then((data) => setSharedItems(data));
        }
      ).on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'temp_storage' },
        () => {
          getData().then((data) => setSharedItems(data));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex flex-col gap-12 w-full">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Home</h1>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center border border-border rounded-lg p-1">
              <button
                className={`p-1.5 rounded hover:bg-accent transition-colors ${
                  view === "grid" ? "bg-accent" : ""
                }`}
                onClick={() => setView("grid")}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>

              <button
                className={`p-1.5 rounded hover:bg-accent transition-colors ${
                  view === "list" ? "bg-accent" : ""
                }`}
                onClick={() => setView("list")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Items List */}
        {Array.isArray(filteredItems) && filteredItems.length > 0 ? (
          view === "grid" ? (
            // GRID VIEW
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
              {filteredItems.map((row) => (
                <DataCard
                  key={row.id}
                  id={row.id}
                  uid={row.uid}
                  file_name={row.file_name}
                  file_size={row.file_size}
                  file_type={row.file_type}
                  data={row.data}
                  expires_at={row.expires_at}
                  created_at={row.created_at}
                  in_bucket={row.in_bucket}
                  bucket_file_path={row.bucket_file_path}
                  view="grid"
                />
              ))}
            </div>
          ) : (
            // LIST VIEW
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
              {filteredItems.map((row) => (
                <DataCard
                  key={row.id}
                  id={row.id}
                  uid={row.uid}
                  file_name={row.file_name}
                  file_size={row.file_size}
                  file_type={row.file_type}
                  data={row.data}
                  expires_at={row.expires_at}
                  created_at={row.created_at}
                  in_bucket={row.in_bucket}
                  bucket_file_path={row.bucket_file_path}
                  view="list"
                />
              ))}
            </div>
          )
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
                <button 
                  onClick={() => setSelectedDuration(5)} 
                  className={`px-4 py-2 rounded-lg border-2 hover:bg-primary/10 text-sm font-medium transition-all ${
                    selectedDuration === 5 
                      ? 'border-primary bg-primary text-primary-foreground' 
                      : 'border-border hover:border-primary'
                  }`}
                >
                  5 minutes
                </button>
                <button 
                  onClick={() => setSelectedDuration(30)} 
                  className={`px-4 py-2 rounded-lg border-2 hover:bg-primary/10 text-sm font-medium transition-all ${
                    selectedDuration === 30 
                      ? 'border-primary bg-primary text-primary-foreground' 
                      : 'border-border hover:border-primary'
                  }`}
                >
                  30 minutes
                </button>
                <button 
                  onClick={() => setSelectedDuration(60)} 
                  className={`px-4 py-2 rounded-lg border-2 hover:bg-primary/10 text-sm font-medium transition-all ${
                    selectedDuration === 60 
                      ? 'border-primary bg-primary text-primary-foreground' 
                      : 'border-border hover:border-primary'
                  }`}
                >
                  1 hour
                </button>
                <button 
                  onClick={() => setSelectedDuration(1440)} 
                  className={`px-4 py-2 rounded-lg border-2 hover:bg-primary/10 text-sm font-medium transition-all ${
                    selectedDuration === 1440 
                      ? 'border-primary bg-primary text-primary-foreground' 
                      : 'border-border hover:border-primary'
                  }`}
                >
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
                  onChange={(e) => setTextInput(e.target.value)}
                  value={textInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      uploadTextClient();
                    }
                  }}
                />
                <Button 
                  size="sm" 
                  className="gap-2"
                  onClick={uploadTextClient}
                  >
                  <Send className="w-4 h-4" 
                />
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