import { Search } from "lucide-react";
import { useState, FormEvent } from "react";
import { Button } from "./ui/button";

interface LongTermSearchBarProps {
  searchQuery: string;
  setSearchQuery: (value: any) => void;
  setCurrentPage: (value: any) => void;
  setFolders?: (value: any) => void;
  displayButton: boolean;
}

const LongTermSearchBar = ({
  searchQuery,
  setSearchQuery,
  setCurrentPage,
  displayButton,
  setFolders,
}: LongTermSearchBarProps) => {
  const [useAISearch, setUseAISearch] = useState(false);
  const [searchValue, setSearchValue] = useState<string>("");

  const embeddedVectorSearch = async (text: string) => {
    console.log("AI Search:", text);
    const res = await fetch(`/api/get/long-term-storage/vector-search?query=${encodeURIComponent(text)}`);
    const data = await res.json();

    console.log("Vector search results:", data);

    return data;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    embeddedVectorSearch(searchValue);

    setSearchValue("");
    setCurrentPage(1);
  };

  return (
    <>
      {useAISearch ? (
        // AI search
        <div className="flex gap-4 w-full">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 rounded-lg px-4 py-3 flex-1 w-full border  
              bg-gradient-to-br from-purple-600/10 via-blue-500/10 to-transparent
              border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.25)]
              transition-all duration-300"
          >
            <Search className="w-5 h-5 text-purple-400 animate-pulse" />

            <input
              type="text"
              placeholder="AI search..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex-1 w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />

            <button
              type="submit"
              className="text-sm text-purple-300 hover:text-purple-400"
            >
              Send
            </button>
          </form>

          {displayButton && (
            <Button onClick={() => setUseAISearch(false)}>Toggle AI Search</Button>
          )}
        </div>
      ) : (
        // Normal search
        <div className="flex gap-4 w-full">
          <div className="flex items-center gap-2 border border-border rounded-lg px-4 py-3 bg-card shadow-sm flex-1 w-full">
            <Search className="w-5 h-5 text-muted-foreground" />

            <input
              type="text"
              placeholder="Search your files..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
          </div>

          {displayButton && (
            <Button onClick={() => setUseAISearch(true)}>
              Toggle AI Search
            </Button>
          )}
        </div>
      )}
    </>
  );
};

export default LongTermSearchBar;
