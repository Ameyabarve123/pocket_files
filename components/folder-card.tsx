"use client";
import { FolderOpen, MoreVertical } from "lucide-react"

const FolderCard = ({ i }: { i: String }) => {
  const handleClick = () => {
    console.log(`Folder ${i} clicked`);
  };
  return (
    <div
      className="group rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer relative"
      onClick={handleClick}
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
          <p className="font-semibold text-sm truncate">{i}</p>
        </div>
      </div>
    </div>
  )
}

export default FolderCard
