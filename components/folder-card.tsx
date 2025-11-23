"use client";
import { FolderOpen, FileText, File, Image, FileCode, FileAudio, X, Download, Share2, Copy, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface FolderCardProps {
  i: string;
  id: string;
  type?: string;
  mimeType?: string;
  description?: string;
  fileSize?: number;
  bucket?: string;
  bucketPath?: string;
  onDelete?: () => void;
  onClick?: () => void;
}

const FolderCard = ({ i, id, type, mimeType, description, fileSize, bucket, bucketPath, onDelete, onClick }: FolderCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFileDialog, setShowFileDialog] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

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
          onDelete();
        }
      }
    } catch (error) {
      alert("An error occurred while deleting");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClick = () => {
    if (type === 'folder' && onClick) {
      onClick();
    } else if (type === 'file') {
      setShowFileDialog(true);
    }
  };

  const handleDownloadFile = async () => {
    try {
      const supabase = createClient();
      
      const { data: signedUrl, error } = await supabase.storage
        .from(bucket!)
        .createSignedUrl(bucketPath!, 60);

      if (error || !signedUrl) {
        alert("Error generating download link");
        return;
      }

      const link = document.createElement('a');
      link.href = signedUrl.signedUrl;
      link.download = i;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Error downloading file");
    }
  };

  const handleCopyContent = async () => {
    try {
      const supabase = createClient();
      
      const { data: signedUrl, error } = await supabase.storage
        .from(bucket!)
        .createSignedUrl(bucketPath!, 60);

      if (error || !signedUrl) {
        alert("Error fetching file content");
        return;
      }

      const response = await fetch(signedUrl.signedUrl);
      const text = await response.text();

      await navigator.clipboard.writeText(text);
      alert("Content copied to clipboard!");
    } catch (error) {
      alert("Error copying content");
    }
  };

  const handleShareFile = async () => {
    try {
      const supabase = createClient();
      
      const { data: signedUrl, error } = await supabase.storage
        .from(bucket!)
        .createSignedUrl(bucketPath!, 86400);

      if (error || !signedUrl) {
        alert("Error generating share link");
        return;
      }

      await navigator.clipboard.writeText(signedUrl.signedUrl);
      alert("Share link copied to clipboard! Valid for 24 hours.");
    } catch (error) {
      alert("Error sharing file");
    }
  };

  const handleDeleteFromDialog = async () => {
    const confirmed = confirm(`Are you sure you want to delete "${i}"?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/delete/long-term-storage/${id}`, {
        method: "DELETE"
      });

      const result = await response.json();

      if (result.error) {
        alert("Error deleting: " + result.error);
      } else {
        alert("File deleted successfully!");
        setShowFileDialog(false);
        if (onDelete) {
          onDelete();
        }
      }
    } catch (error) {
      alert("An error occurred while deleting");
    }
  };

  const getIcon = () => {
    if (type === 'folder') {
      return <FolderOpen className="w-6 h-6 text-primary" />;
    }

    if (mimeType) {
      if (mimeType.startsWith('image/')) {
        return <Image className="w-6 h-6 text-blue-500" />;
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
    <>
      <div
        className="group rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer relative"
        onClick={handleClick}
      >
        <Button 
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-opacity text-destructive hover:text-destructive"
        >
          {isDeleting ? (
            <span className="text-m">...</span>
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

      {/* File Details Dialog */}
      {showFileDialog && type === 'file' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFileDialog(false)}>
          <div className="bg-background rounded-lg shadow-xl w-full max-w-lg border border-border" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold truncate pr-4">{i}</h3>
              <button
                onClick={() => setShowFileDialog(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Description */}
              {description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1 text-sm">{description}</p>
                </div>
              )}

              {/* File Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">Type</label>
                  <p className="font-medium">{mimeType || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-muted-foreground">Size</label>
                  <p className="font-medium">
                    {fileSize 
                      ? `${(fileSize / 1024).toFixed(2)} KB`
                      : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-4">
                <Button 
                  onClick={handleDownloadFile}
                  className="w-full justify-start"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
                
                {mimeType?.startsWith('text/') && (
                  <Button 
                    onClick={handleCopyContent}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Content
                  </Button>
                )}

                <Button 
                  onClick={handleShareFile}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share File (Copy Link)
                </Button>

                <Button 
                  onClick={handleDeleteFromDialog}
                  variant="destructive"
                  className="w-full justify-start"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete File
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default FolderCard