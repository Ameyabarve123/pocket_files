import { Search } from "lucide-react";
import { useState, FormEvent } from "react";
import { Button } from "./ui/button";

interface LongTermSearchBarProps {
  searchQuery: string;
  setSearchQuery: (value: any) => void;
  setCurrentPage: (value: any) => void;
  setFolders?: (value: any) => void;
  loadFolders?: () => void;
  displayButton: boolean;
}

const LongTermSearchBar = ({
  searchQuery,
  setSearchQuery,
  setCurrentPage,
  displayButton,
  setFolders,
  loadFolders,
}: LongTermSearchBarProps) => {
  const [useAISearch, setUseAISearch] = useState(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [searching, setSearching] = useState<boolean>(false);

  const embeddedVectorSearch = async (text: string) => {
    setSearching(true);
    if (!text && loadFolders) {
      loadFolders();
      setSearching(false);
      return;
    }
    console.log("entered")
    const url = `/api/get/long-term-storage/vector-search?query=${encodeURIComponent(text)}`;
    const res = await fetch(url);

    // 1. Check if the HTTP response itself was successful (status 200-299)
    if (!res.ok) {
        // Parse the error message from the body if available
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP Error: ${res.status} ${res.statusText}`;
        console.error("AI Search failed:", errorMessage);
        setSearching(false);
        // Optionally display a user-friendly error message here (e.g., toast or state update)
        alert(`Search failed: ${errorMessage}`); 
        return;
    }

    // 2. Parse the successful response body
    const data = await res.json();
    
    // 3. Check for an internal API-level error message in the payload
    if (data.error || !data.results) {
      console.error("AI Search error in payload:", data.error || "No results key found");
      // Optionally display a user-friendly error message here
      setSearching(false);
      alert(`Search error: ${data.error || "An unknown search error occurred."}`);
      return;
    }
    
    // Success: Update state with results
    if (setFolders) {
      setFolders(data.results); 
    }
    setSearching(false);
    return data.results;
  };
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    embeddedVectorSearch(searchValue);
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
              disabled={searching}
              className="flex-1 w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
          
            <button
              type="submit"
              className={!searching ? 
                ("text-sm text-purple-300 hover:text-purple-400"):("text-sm text-purple-300")
              }
              disabled={searching}
            >
              Send
            </button>
          </form>

          {displayButton && (
            <Button disabled={searching} onClick={() => setUseAISearch(false)}>Toggle AI Search</Button>
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
