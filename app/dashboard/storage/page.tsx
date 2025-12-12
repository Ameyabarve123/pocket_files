"use client";

import { Plus, Search, Grid3x3, List, FolderPlus, Upload, X } from "lucide-react";
import FolderCard from "@/components/folder-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useStorage } from "@/components/storage-context";
import { useAlert } from "@/components/use-alert";
import LongTermSearchBar from "@/components/long-term-search-bar";


export default function LongTermStorage() {
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"select" | "folder" | "file" | "text">("select");
  const [uploadType, setUploadType] = useState<"file" | "text">("file");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    file: null as File | null,
    textContent: ""
  });
  const [isUploading, setIsUploading] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [folderPath, setFolderPath] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: "Home" }
  ]);
  const { refreshStorage, subType } = useStorage();
  const { showAlert } = useAlert();


  useEffect(() => {
    loadFolders();
  }, [currentFolderId]);

  async function loadFolders() {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Build query based on whether we're at root or in a folder
      let query = supabase
        .from("storage_nodes")
        .select("id, name, type, parent_id, bucket, bucket_path, mime_type, file_size, created_at, description")
        .eq("uid", user.id);

      // Use .is() for null, .eq() for actual IDs
      if (currentFolderId === null) {
        query = query.is("parent_id", null);
      } else {
        query = query.eq("parent_id", currentFolderId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading items:", error);
      } else {
        // Sort so folders appear first, then files
        const sortedData = (data || []).sort((a, b) => {
          // If both are same type, maintain creation order
          if (a.type === b.type) return 0;
          // Folders first (type === 'folder')
          return a.type === 'folder' ? -1 : 1;
        });
        setFolders(sortedData);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function createFolder(name: string, uid: any, parentId: string | null = null) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("storage_nodes")
      .insert({
        name,
        description: formData.description,
        type: "folder",
        uid,
        parent_id: parentId
      })
      .select("id, name, type, parent_id, bucket, bucket_path, mime_type, file_size, created_at, description")
      .single();

    return { data, error };
  }

  async function uploadFile(file: File, name: string, description: string, parentId: string | null = null) {
    const formDataToSend = new FormData();
    formDataToSend.append("file", file);
    formDataToSend.append("name", name);
    formDataToSend.append("description", description);

    const response = await fetch(`/api/upload/long-term-storage/${parentId || currentFolderId || 'NULL'}`, {
      method: "POST",
      body: formDataToSend
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }
    await refreshStorage();
    return await response.json();
  }

  async function uploadText(textContent: string, name: string, description: string, parentId: string | null = null) {
    const blob = new Blob([textContent], { type: 'text/plain' });
    const file = new File([blob], `${name}.txt`, { type: 'text/plain' });

    const formDataToSend = new FormData();
    formDataToSend.append("file", file);
    formDataToSend.append("name", name);
    formDataToSend.append("description", description);

    const response = await fetch(`/api/upload/long-term-storage/${parentId || currentFolderId || 'NULL'}`, {
      method: "POST",
      body: formDataToSend
    });

    if (!response.ok) {
      throw new Error('Failed to upload text content');
    }
    await refreshStorage();
    return await response.json();
  }

  const handleFolderClick = (folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setFolderPath([...folderPath, { id: folderId, name: folderName }]);
    setCurrentPage(1);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newPath = folderPath.slice(0, index + 1);
    setFolderPath(newPath);
    setCurrentFolderId(newPath[newPath.length - 1].id);
    setCurrentPage(1);
  };

  const handleOpenDialog = () => {
    setShowNewDialog(true);
    setDialogMode("select");
    setUploadType("file");
    setFormData({ name: "", description: "", file: null, textContent: "" });
  };

  const handleCloseDialog = () => {
    setShowNewDialog(false);
    setDialogMode("select");
    setUploadType("file");
    setFormData({ name: "", description: "", file: null, textContent: "" });
  };


  const handleSubmit = async () => {
    setIsUploading(true);

    try {
      if (dialogMode === "folder") {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const result = await createFolder(formData.name, user?.id, currentFolderId);
        if (result.error) {
          const errorMsg:string = `Error creating folder: ${result.error.message}` 
          showAlert('Error', errorMsg);
        } else {
          showAlert('Success', "Folder created successfully!");
          handleCloseDialog();
          loadFolders();
        }
      } else if (dialogMode === "file") {
        if (uploadType === "file" && formData.file) {
          const result = await uploadFile(formData.file, formData.name, formData.description);
          if (result.error) {
            const errorMsg:string = `Error uploading file: ${result.error.message}` 
            showAlert('Error', errorMsg);
          } else {
            showAlert('Success', "File uploaded successfully!");
            handleCloseDialog();
            loadFolders();
          }
        } else if (uploadType === "text" && formData.textContent) {
          const result = await uploadText(formData.textContent, formData.name, formData.description);
          if (result.error) {
            const errorMsg:string = `Error uploading text: ${result.error.message}` 
            showAlert('Error', errorMsg);
          } else {
            showAlert('Success', "Text uploaded successfully!");
            handleCloseDialog();
            loadFolders();
          }
        }
      }
    } catch (error) {
      showAlert('Error', "An error occurred");
    } finally {
      setIsUploading(false);
    }
  };
  
  const filteredFolders = folders.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredFolders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFolders = filteredFolders.slice(startIndex, endIndex);
  const showButton = subType === 2 ? true : false
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
        <LongTermSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setCurrentPage={setCurrentPage}
          displayButton={showButton}
          loadFolders={loadFolders}
          setFolders={setFolders}
        />
      </div>

      {/* Folders Section */}
      <div>
        {/* Breadcrumb Navigation */}
        <div className="mb-4 flex items-center gap-2 text-sm">
          {folderPath.map((folder, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <span className="text-muted-foreground">/</span>}
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className={`hover:text-primary transition-colors ${
                  index === folderPath.length - 1 ? 'font-semibold text-primary' : 'text-muted-foreground'
                }`}
              >
                {folder.name}
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold">
            {folderPath[folderPath.length - 1].name}
          </h2>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="default" size="sm" onClick={handleOpenDialog}>
              <Plus className="w-4 h-4 mr-2" />
              New
            </Button>
          </div>
        </div>

        {/* Grid View */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading folders...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {currentFolders.map((item) => (
                <FolderCard 
                  key={item.id}
                  id={item.id}
                  i={item.name}
                  type={item.type}
                  mimeType={item.mime_type}
                  description={item.description}
                  fileSize={item.file_size}
                  bucket={item.bucket}
                  bucketPath={item.bucket_path}
                  onDelete={loadFolders}
                  onClick={() => item.type === 'folder' && handleFolderClick(item.id, item.name)}
                />
              ))}

              {/* Add new folder */}
              <button 
                onClick={handleOpenDialog}
                className="rounded-xl border-2 border-dashed border-border p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all h-full min-h-[140px]"
              >
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium">Create Folder</span>
              </button>
            </div>

            {filteredFolders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? `No results found for "${searchQuery}"`
                    : "No files or folders yet. Create your first folder or upload a file to get started!"
                  }
                </p>
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {folders.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, folders.length)} of {folders.length} items
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog */}
      {showNewDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl w-full max-w-md border border-border">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold">
                {dialogMode === "select" && "Create New"}
                {dialogMode === "folder" && "Create Folder"}
                {dialogMode === "file" && "Upload Content"}
              </h3>
              <button
                onClick={handleCloseDialog}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {dialogMode === "select" && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setDialogMode("folder")}
                    className="flex flex-col items-center gap-3 p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FolderPlus className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-medium">New Folder</span>
                  </button>
                  <button
                    onClick={() => {
                      setDialogMode("file");
                      setUploadType("file");
                    }}
                    className="flex flex-col items-center gap-3 p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-medium">Upload Content</span>
                  </button>
                </div>
              )}

              {dialogMode === "folder" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Folder Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter folder name"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setDialogMode("select")}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button onClick={handleSubmit} className="flex-1" disabled={isUploading || !formData.name}>
                      {isUploading ? "Creating..." : "Create Folder"}
                    </Button>
                  </div>
                </div>
              )}

              {dialogMode === "file" && (
                <div className="space-y-4">
                  {/* File or Text Toggle */}
                  <div className="flex gap-2 p-1 bg-muted rounded-lg">
                    <button
                      onClick={() => setUploadType("file")}
                      className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        uploadType === "file" 
                          ? "bg-background shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      onClick={() => setUploadType("text")}
                      className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        uploadType === "text" 
                          ? "bg-background shadow-sm" 
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Upload Text
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter file title"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {uploadType === "file" ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">File</label>
                      <input
                        type="file"
                        onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Text Content</label>
                      <textarea
                        value={formData.textContent}
                        onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                        placeholder="Enter your text content here..."
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        rows={6}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter description"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setDialogMode("select")}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={handleSubmit} 
                      className="flex-1" 
                      disabled={
                        isUploading || 
                        !formData.name || 
                        !formData.description || 
                        (uploadType === "file" && !formData.file) ||
                        (uploadType === "text" && !formData.textContent)
                      }
                    >
                      {isUploading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div id="modal-root"></div>
    </div>
  );
}