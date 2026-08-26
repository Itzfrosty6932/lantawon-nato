# Navigation Map & State Flow

**Date**: 2026-08-22  
**Purpose**: Map all navigational transitions, state preservation, and player handoffs.

---

## 1. Flow Diagram

```mermaid
flowchart TD
    A[Discover Hub / Home] -->|Click Media Card| B[Watch / Theater Page /watch/:id]
    A -->|Quick Trailer Button| C[Trailer Pop-up Modal]
    A -->|Type in Search| D[Instant Autocomplete Dropdown]
    D -->|Select Suggestion| B
    A -->|Ask AI Natural Query| E[NLP Filtered Catalog]
    E -->|Select Media| B
    
    A -->|Sidebar Navigation| F[Downloads / Local Library]
    F -->|Scan Folder / FileSystem API| G[Indexed Local Videos]
    G -->|Play Local File| B
    
    A -->|Sidebar Navigation| H[Personal Library / Stats]
    H -->|Click Continue Watching| B
    
    B -->|Click Season Dropdown| I[Episode Grid]
    I -->|Select Episode| B
    B -->|Click Cast Member| J[Person Modal / Filmography]
    J -->|Select Co-star / Movie| B
    B -->|Click Franchise Node| K[Timeline Movie Card]
    K -->|Navigate| B
```

---

## 2. State Preservation Rules
- **Scroll Position**: Preserved across route transitions using Next.js layout retention.
- **Search Query & Filters**: Synchronized with URL query parameters (`?q=...&genre=...&era=...&sort=...`) for shareable, bookmarkable deep links.
- **Watch History & Progress**: Debounced to client IndexedDB every 5 seconds during active playback.
- **Active Local Files**: Stored in session memory blob cache (`LocalScanner`) to avoid re-prompting file permissions during the same browsing session.
