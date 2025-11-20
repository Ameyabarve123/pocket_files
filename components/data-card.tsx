"use client";

import { Button } from "./ui/button"
import { Share, Clock, MoreVertical, X, FileText, File, Download, Image, Copy } from "lucide-react"

interface DataCardProps {
  id: string;
  uid: string;
  file_name: string;
  file_size: number;
  file_type: string;
  data: string; // URL to the file
  expires_at: string;
  created_at: string;
  in_bucket: number;
  bucket_file_path: string;
  view: "grid" | "list";
}

const DataCard = ({ 
  id, 
  uid,
  file_name, 
  file_size,
  file_type,
  data,
  expires_at,
  created_at,
  in_bucket,
  bucket_file_path,
  view
}: DataCardProps) => {
  
  const isImage = file_type.startsWith('image/');

  // Determine file type for icon
  const getFileIcon = () => {
    if (file_type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-primary" />;
    } else if (file_type.includes('pdf') || file_type.includes('document')) {
      return <FileText className="w-5 h-5 text-primary" />;
    } else {
      return <File className="w-5 h-5 text-primary" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    const now = new Date();
    const expiryDate = new Date(expires_at);
    const diffMs = expiryDate.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Expired';
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
    return `${diffMins}m`;
  };

  // Copy link to clipboard save for link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(data);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Download file
  const handleDownload = async () => {
    try {
      const response = await fetch(data);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download file');
    }
  };

  // Delete file
  const handleDelete = async () => {
    if (in_bucket === 1){
      if (!confirm('Are you sure you want to delete this file?')) return;
    
      try {
        const fileName = encodeURIComponent(bucket_file_path);

        const res = await fetch(`/api/delete/temp-storage/file/${id}/${fileName}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          alert('File deleted successfully!');
        } else {
          alert('Failed to delete file');
        }
      } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete file');
      }
    } else {
      if (!confirm('Are you sure you want to delete this text?')) return;
    
      try {

        const res = await fetch(`/api/delete/temp-storage/text/${id}/${uid}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          alert('Text deleted successfully!');
        } else {
          alert('Failed to delete text');
        }
      } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete text');
      }
    }
    
  };
  
  return view === "grid" ? (
    <div 
      key={id}
      className="bg-card border border-border rounded-xl p-3 hover:shadow-md transition-shadow group flex flex-col"
    >
      {/* Image / Icon */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        {isImage ? (
          <img 
            src={data}
            alt={file_name}
            className="object-contain w-full h-full"
          />
        ) : (
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            {getFileIcon()}
          </div>
        )}

        {/* Hover actions (top-right) */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <Button 
            variant="ghost"
            size="icon"
            className="h-7 w-7 p-0"
            onClick={handleCopyLink}
          >
            {isImage ?
              <Share className="w-4 h-4" />
              :
              <Copy className="w-4 h-4" />
            }
          </Button>

          {isImage && (
            <Button 
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-0"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4" />
            </Button>
          )}

          <Button 
            variant="ghost"
            size="icon"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Text content */}
      <div className="mt-3 flex-1 min-w-0">
        <h3 className="font-semibold text-sm truncate">
          {in_bucket === 0 ? data : bucket_file_path}
        </h3>

        <p className="text-xs text-muted-foreground mt-1">
          {file_type} • {formatFileSize(file_size)}
        </p>

        {/* Expiration / Time remaining */}
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded w-fit">
          <Clock className="w-3 h-3" />
          <span>{getTimeRemaining()}</span>
        </div>
      </div>
    </div>
  ) : (
    <div key={id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start gap-4">
        {/* Icon based on file type */}
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          {getFileIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">{in_bucket === 0 ? data : bucket_file_path}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                <Clock className="w-3 h-3" />
                <span>{getTimeRemaining()}</span>
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
          <p className="text-sm text-muted-foreground">
            {file_type} • {formatFileSize(file_size)}
          </p>

          {/* Image Preview */}
          {isImage && (
            <div className="mt-3 rounded-lg overflow-hidden border border-border">
              <img 
                src={data} 
                alt={file_name} 
                className="w-full max-h-48 object-contain bg-muted"
              />
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3">
            {isImage ?
              <>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs"
                    onClick={handleCopyLink}
                  >
                    <Share className="w-3 h-3 mr-1" />
                    Share
                  </Button> 

                  <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs"
                  onClick={handleDownload}
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </>
              :
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs"
                onClick={handleCopyLink}
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy Text
              </Button>
            }

            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <X className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataCard