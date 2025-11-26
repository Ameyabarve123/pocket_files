"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button"
import { Share, Clock, MoreVertical, X, FileText, File, Download, Image as ImageIcon, Copy, FileCode, FileAudio } from "lucide-react"
import { useStorage } from "./storage-context";
import Image from "next/image";
import { useAlert } from "./use-alert";
import Modal from "./modal";

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
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(false);
  const { refreshStorage } = useStorage();

  // Determine file type for icon
  const getFileIcon = () => {
    if (file_type) {
      if (file_type.startsWith('image/')) {
        return <ImageIcon className="w-6 h-6 text-blue-500" />;
      }
      if (file_type.startsWith('audio/')) {
        return <FileAudio className="w-6 h-6 text-pink-500" />;
      }
      if (file_type.includes('text') || file_type === 'text/plain') {
        return <FileText className="w-6 h-6 text-green-500" />;
      }
      if (file_type.includes('code') || file_type.includes('javascript') || file_type.includes('json')) {
        return <FileCode className="w-6 h-6 text-orange-500" />;
      }
      if (file_type.includes('pdf')) {
        return <FileText className="w-6 h-6 text-red-500" />;
      }
    }

    return <File className="w-6 h-6 text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const deleteExpired = async() => {
    try {
      if (in_bucket === 1) {
        const res = await fetch(`/api/delete/temp-storage/file/${id}`, {
          method: 'DELETE',
        });
      } else {
        const res = await fetch(`/api/delete/temp-storage/text/${id}`, {
          method: 'DELETE',
        });
      }
      await refreshStorage()
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete file');
    }
  }

  // Calculate time remaining
  const getTimeRemaining = () => {
    const now = new Date();
    const expiryDate = new Date(expires_at); 
    const diffMs = expiryDate.getTime() - now.getTime();
    
    if (diffMs < 0) {
      deleteExpired();
      return 'Expired';
    } 
    
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h ${diffMins % 60}m`;
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m ${diffSecs % 60}s`;
    if (diffMins > 0) return `${diffMins}m ${diffSecs % 60}s`;
    return `${diffSecs}s`;
  };

  useEffect(() => {
    // Set initial value
    setTimeRemaining(getTimeRemaining());

    // Update every second (1000ms)
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining());
    }, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [expires_at]);

  useEffect(() => {
    handleDelete();
  }, [confirmAction]);

  // Copy text to clipboard save for link
  const handleCopyLink = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(data);
      if (in_bucket === 1)
        showAlert("Warning", 'Shareable Link copied to clipboard! NOTE: EVEN IF YOU DELETE THE FILE, THE LINK WILL STILL WORK UNTIL EXPIRATION.');
      else
        showAlert('Success', 'Text copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      showAlert('Error', 'Failed to copy');
    } finally {
      setIsCopying(false);
    }
  };

  // Download file
  const handleDownload = async () => {
    setIsDownloading(true);
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
      showAlert('Error', 'Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  };

  // Delete file
  const handleDelete = async () => {
  if (in_bucket === 1){
      if (!confirmAction) return;
      setIsDeleting(true);
      try {
        const res = await fetch(`/api/delete/temp-storage/file/${id}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          showAlert('Success', 'File deleted successfully!');
          await refreshStorage()
        } else {
          showAlert('Error', 'Failed to delete file');
        }
      } catch (err) {
        showAlert('Error', `Failed to delete file ${err}`);
      } finally {
        setIsDeleting(false);
      }
    } else {
      if (!confirmAction) return;
      
      setIsDeleting(true);
      try {
        const res = await fetch(`/api/delete/temp-storage/text/${id}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          showAlert('Success', 'Text deleted successfully!');
          await refreshStorage()
        } else {
          showAlert('Error', 'Failed to delete text');
        }
      } catch (err) {
        showAlert('Error', `Failed to delete text ${err}`);
      } finally {
        setIsDeleting(false);
      }
    }
    setConfirmAction(false);
  };

  const {showAlert } = useAlert();
  
  return view === "grid" ? (
    <div 
      key={id}
      className="bg-card border border-border rounded-xl p-3 hover:shadow-md transition-shadow group flex flex-col"
    >
      {openModal && 
        <Modal 
          onClose={() => setOpenModal(false)}
          giveVal={setConfirmAction}
          title={"Confirm delete"}>
            <p>This action is permanent</p>
        </Modal>
      }
      {/* Image / Icon */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center">
        {isImage ? (
          <Image 
            src={data}
            alt={file_name}
            width={500}
            height={500}
            className="object-contain w-full h-full"
          />
        ) : (
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            {getFileIcon()}
          </div>
        )}

        {/* Hover actions (top-right) */}
        <div className="absolute top-2 right-2 opacity-0 rounded-sm bg-muted group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <Button 
            variant="ghost"
            size="icon"
            className="h-7 w-7 p-0"
            onClick={handleCopyLink}
            disabled={isCopying}
          >
            {isCopying ? (
              <span className="text-xs">...</span>
            ) : in_bucket === 1 ? (
              <Share className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>

          {in_bucket === 1 && (
            <Button 
              variant="ghost"
              size="icon"
              className="h-7 w-7 p-0"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <span className="text-xs">...</span>
              ) : (
                <Download className="w-4 h-4" />
              )}
            </Button>
          )}

          <Button 
            variant="ghost"
            size="icon"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={() => setOpenModal(true)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <span className="text-xs">...</span>
            ) : (
              <X className="w-4 h-4" />
            )}
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
          <span>{timeRemaining}</span>
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
                <span>{timeRemaining}</span>
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
            {in_bucket === 1 ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs"
                  onClick={handleCopyLink}
                  disabled={isCopying}
                >
                  <Share className="w-3 h-3 mr-1" />
                  {isCopying ? 'Copying...' : 'Share'}
                </Button> 

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  <Download className="w-3 h-3 mr-1" />
                  {isDownloading ? 'Downloading...' : 'Download'}
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs"
                onClick={handleCopyLink}
                disabled={isCopying}
              >
                <Copy className="w-3 h-3 mr-1" />
                {isCopying ? 'Copying...' : 'Copy Text'}
              </Button>
            )}

            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs text-destructive hover:text-destructive"
              onClick={() => setOpenModal(true)}
              disabled={isDeleting}
            >
              <X className="w-3 h-3 mr-1" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataCard