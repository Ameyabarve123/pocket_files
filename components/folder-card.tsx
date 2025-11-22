"use client";
import { FolderOpen, FileText, File, Image, FileCode, FileVideo, FileAudio, X } from "lucide-react"
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface FolderCardProps {
  i: string;
  id: string; // Add id prop
  type?: string;
  mimeType?: string;
  onDelete?: () => void; // Callback to refresh list after deletion
}

const FolderCard = ({ i, id, type, mimeType, onDelete }: FolderCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click

    const confirmed = confirm(`Are you sure you want to delete "${i}"?`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/delete/long-term-storage/${id}`, {
        method: "DELETE"
      });

      const result = await response.json();

      if (result.error) {
        alert("Error deleting: " + result.error);
      } else {
        if (onDelete) {
          onDelete(); // Refresh the list
        }
      }
    } catch (error) {
      alert("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

  // Determine which icon to show based on type and mime type
  const getIcon = () => {
    if (type === 'folder') {
      return <FolderOpen className="w-6 h-6 text-primary" />;
    }

    // For files, check mime type
    if (mimeType) {
      if (mimeType.startsWith('image/')) {
        return <Image className="w-6 h-6 text-blue-500" />;
      }
      if (mimeType.startsWith('video/')) {
        return <FileVideo className="w-6 h-6 text-purple-500" />;
      }
      if (mimeType.startsWith('audio/')) {
        return <FileAudio className="w-6 h-6 text-pink-500" />;
      }
      if (mimeType.includes('text') || mimeType === 'text/plain') {
        return <FileText className="w-6 h-6 text-green-500" />;
      }
      if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) {
        return <FileCode className="w-6 h-6 text-orange-500" />;
      }
      if (mimeType.includes('pdf')) {
        return <FileText className="w-6 h-6 text-red-500" />;
      }
    }

    // Default file icon
    return <File className="w-6 h-6 text-gray-500" />;
  };

  const getBackgroundColor = () => {
    if (type === 'folder') {
      return 'bg-primary/10 group-hover:bg-primary/20';
    }
    
    if (mimeType) {
      if (mimeType.startsWith('image/')) return 'bg-blue-50 group-hover:bg-blue-100';
      if (mimeType.startsWith('video/')) return 'bg-purple-50 group-hover:bg-purple-100';
      if (mimeType.startsWith('audio/')) return 'bg-pink-50 group-hover:bg-pink-100';
      if (mimeType.includes('text')) return 'bg-green-50 group-hover:bg-green-100';
      if (mimeType.includes('code')) return 'bg-orange-50 group-hover:bg-orange-100';
      if (mimeType.includes('pdf')) return 'bg-red-50 group-hover:bg-red-100';
    }
    
    return 'bg-gray-50 group-hover:bg-gray-100';
  };

  return (
    <div
      className="group rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer relative"
    >
      {/* Delete button */}
      <Button 
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity text-destructive hover:text-destructive"
      >
        {isDeleting ? (
          <span className="text-xs">...</span>
        ) : (
          <X className="w-4 h-4" />
        )}
      </Button>

      <div className="flex flex-col items-center gap-3 text-center">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${getBackgroundColor()}`}>
          {getIcon()}
        </div>
        <div className="space-y-1 w-full">
          <p className="font-semibold text-sm truncate">{i}</p>
        </div>
      </div>
    </div>
  )
}

export default FolderCard