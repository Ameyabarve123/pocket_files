import { Search } from "lucide-react";
interface LongTermSearchBarProps {
  searchQuery: string;
  setSearchQuery: (value: any) => void;
  setCurrentPage: (value: any) => void;
}
const LongTermSearchBar = ({searchQuery, setSearchQuery, setCurrentPage}: LongTermSearchBarProps) => {
  return (
    <div className="flex items-center gap-2 border border-border rounded-lg px-4 py-3 bg-card shadow-sm max-w-2xl">
      <Search className="w-5 h-5 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search your files..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setCurrentPage(1);
        }}
        className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
      />
    </div>
  )
}

export default LongTermSearchBar
