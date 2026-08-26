import { TMDB_API_KEY, TMDB_BASE_URL } from "./tmdb";

export interface TMDBCollectionPart {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count?: number;
  popularity: number;
  genre_ids?: number[];
  adult?: boolean;
}

export interface TMDBCollection {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: TMDBCollectionPart[];
  studio?: string;
  category?: string;
}

export interface FranchiseSeed {
  id: number;
  name: string;
  studio: string;
  category: string;
  tagline?: string;
}

/**
 * 32 Iconic TMDB Collection IDs - Populated dynamically from TMDB Database
 */
export const POPULAR_FRANCHISE_SEEDS: FranchiseSeed[] = [
  { id: 86311, name: "The Avengers Saga", studio: "Marvel Studios", category: "Superhero", tagline: "Earth's Mightiest Heroes assemble across Infinity & Endgame" },
  { id: 10, name: "Star Wars Saga", studio: "Lucasfilm", category: "Sci-Fi & Fantasy", tagline: "The complete Skywalker saga and galaxy far, far away" },
  { id: 1241, name: "Harry Potter Collection", studio: "Wizarding World", category: "Fantasy & Magic", tagline: "The journey of the Boy Who Lived through Hogwarts" },
  { id: 119, name: "The Lord of the Rings", studio: "Tolkien Legendarium", category: "Fantasy & Adventure", tagline: "The quest to destroy the One Ring in Mount Doom" },
  { id: 121938, name: "The Hobbit Trilogy", studio: "Tolkien Legendarium", category: "Fantasy & Adventure", tagline: "Bilbo Baggins and the reclamation of Erebor" },
  { id: 531241, name: "Spider-Man (MCU) Saga", studio: "Marvel / Sony", category: "Superhero", tagline: "Peter Parker's high school journey to the Multiverse" },
  { id: 556, name: "Spider-Man (Raimi Trilogy)", studio: "Sony Pictures", category: "Superhero", tagline: "Tobey Maguire's definitive Spider-Man trilogy" },
  { id: 573436, name: "Spider-Verse Animated", studio: "Sony Animation", category: "Animation & Multiverse", tagline: "Miles Morales and the infinite Spider-Society" },
  { id: 9485, name: "The Fast and the Furious Saga", studio: "Universal Pictures", category: "Action & Heist", tagline: "From quarter-mile street races to global espionage" },
  { id: 87359, name: "Mission: Impossible Saga", studio: "Paramount Pictures", category: "Action & Spy", tagline: "Ethan Hunt and the Impossible Missions Force" },
  { id: 404609, name: "John Wick Universe", studio: "Lionsgate", category: "Action & Thriller", tagline: "The Baba Yaga and the High Table assassins" },
  { id: 328, name: "Jurassic Park & World", studio: "Universal Pictures", category: "Sci-Fi & Adventure", tagline: "65 million years in the making" },
  { id: 8650, name: "Transformers Saga", studio: "Paramount / Hasbro", category: "Sci-Fi & Action", tagline: "Autobots and Decepticons war for Earth" },
  { id: 295, name: "Pirates of the Caribbean", studio: "Walt Disney Pictures", category: "Adventure & Fantasy", tagline: "Captain Jack Sparrow on the Seven Seas" },
  { id: 2344, name: "The Matrix Saga", studio: "Warner Bros.", category: "Sci-Fi & Cyberpunk", tagline: "Free your mind in the simulated reality" },
  { id: 263, name: "The Dark Knight Trilogy", studio: "DC / Warner Bros.", category: "Superhero & Crime", tagline: "Christopher Nolan's definitive Batman saga" },
  { id: 8091, name: "Alien Saga", studio: "20th Century Studios", category: "Sci-Fi Horror", tagline: "In space, no one can hear you scream" },
  { id: 399, name: "Predator Saga", studio: "20th Century Studios", category: "Sci-Fi Action", tagline: "The supreme intergalactic trophy hunters" },
  { id: 313086, name: "The Conjuring Universe", studio: "New Line Cinema", category: "Supernatural Horror", tagline: "The Warren case files of demonic hauntings" },
  { id: 726871, name: "Dune Saga", studio: "Legendary / Warner Bros.", category: "Sci-Fi Epic", tagline: "Paul Atreides and the prophecy of Arrakis" },
  { id: 87096, name: "Avatar Saga", studio: "20th Century Studios", category: "Sci-Fi Epic", tagline: "James Cameron's breathtaking world of Pandora" },
  { id: 645, name: "James Bond 007 Saga", studio: "EON / MGM", category: "Spy & Action", tagline: "The legendary MI6 secret agent with a license to kill" },
  { id: 131635, name: "The Hunger Games Saga", studio: "Lionsgate", category: "Dystopian Sci-Fi", tagline: "Katniss Everdeen and the rebellion of Panem" },
  { id: 8945, name: "Mad Max Wasteland Saga", studio: "Warner Bros.", category: "Post-Apocalyptic", tagline: "High-octane survival in the irradiated desert" },
  { id: 84, name: "Indiana Jones Saga", studio: "Lucasfilm / Paramount", category: "Adventure", tagline: "Archaeologist adventurer in pursuit of fortune and glory" },
  { id: 173710, name: "Planet of the Apes Saga", studio: "20th Century Studios", category: "Sci-Fi & Drama", tagline: "Caesar and the rise of the intelligent ape civilization" },
  { id: 10194, name: "Toy Story Saga", studio: "Pixar / Disney", category: "Animation & Family", tagline: "Woody and Buzz Lightyear's enduring friendship" },
  { id: 2150, name: "Shrek Saga", studio: "DreamWorks Animation", category: "Animation & Comedy", tagline: "Far Far Away and the beloved ogre champion" },
  { id: 86066, name: "Despicable Me & Minions", studio: "Illumination / Universal", category: "Animation & Comedy", tagline: "Gru, his family, and the chaotic Minion army" },
  { id: 77816, name: "Kung Fu Panda Saga", studio: "DreamWorks Animation", category: "Animation & Martial Arts", tagline: "Po the Dragon Warrior and the Furious Five" },
  { id: 2602, name: "Scream Saga", studio: "Paramount Pictures", category: "Slasher Horror", tagline: "Ghostface terrorizes Woodsboro with meta horror rules" },
  { id: 656, name: "Saw Collection", studio: "Lionsgate", category: "Psychological Horror", tagline: "Jigsaw and the deadly tests of survival" }
];

// Memory cache for collections to prevent repeated network calls
const collectionCache = new Map<number, TMDBCollection>();

/**
 * Dynamically fetch a franchise/collection directly from TMDB Database API
 */
export async function fetchTMDBCollection(collectionId: number): Promise<TMDBCollection | null> {
  if (collectionCache.has(collectionId)) {
    return collectionCache.get(collectionId)!;
  }

  try {
    const res = await fetch(`${TMDB_BASE_URL}/collection/${collectionId}?api_key=${TMDB_API_KEY}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) return null;

    const data: TMDBCollection = await res.json();
    
    // Sort movies by release date ascending by default
    if (data.parts && Array.isArray(data.parts)) {
      data.parts.sort((a, b) => {
        const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
        const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
        return dateA - dateB;
      });
    }

    // Attach seed metadata if available
    const seed = POPULAR_FRANCHISE_SEEDS.find((s) => s.id === collectionId);
    if (seed) {
      data.studio = seed.studio;
      data.category = seed.category;
      if (!data.overview && seed.tagline) {
        data.overview = seed.tagline;
      }
    }

    collectionCache.set(collectionId, data);
    return data;
  } catch (err) {
    console.error(`Failed to fetch TMDB collection ${collectionId}:`, err);
    return null;
  }
}

/**
 * Search TMDB Database for any Franchise / Collection dynamically
 */
export async function searchTMDBCollections(query: string): Promise<TMDBCollection[]> {
  if (!query || !query.trim()) return [];

  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/collection?query=${encodeURIComponent(query.trim())}&api_key=${TMDB_API_KEY}`
    );

    if (!res.ok) return [];

    const data = await res.json();
    return (data.results || []) as TMDBCollection[];
  } catch (err) {
    console.error("Failed to search TMDB collections:", err);
    return [];
  }
}
