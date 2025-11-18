"use client";

import { Button } from "./ui/button"
import { Clock } from "lucide-react"
import { MoreVertical } from "lucide-react"
import { X } from "lucide-react"
import { FileText } from "lucide-react"
import { Link as LinkIcon } from "lucide-react"
import { File } from "lucide-react"

interface DataCardProps {
  id: string;
  type: "note" | "link" | "file";
  title: string;
  content: string;
  expiresIn: string;
}

const DataCard =  ({ 
  id, 
  type, 
  title, 
  content, 
  expiresIn
}: DataCardProps) => {
  return (
    <div
      key={id}
      className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-4">
        {/* Icon based on type */}
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          {type === "note" && <FileText className="w-5 h-5 text-primary" />}
          {type === "link" && <LinkIcon className="w-5 h-5 text-primary" />}
          {type === "file" && <File className="w-5 h-5 text-primary" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">{title}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                <Clock className="w-3 h-3" />
                <span>{expiresIn}</span>
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
          <p className="text-sm text-muted-foreground truncate">{content}</p>
          
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
  )
}

export default DataCard
