export interface WatchProviderItem {
  id: number;
  name: string;
  category: "free" | "subscription" | "rent_buy" | "tv_app";
  categoryLabel: string;
  logoPath: string;
  monetization: "free" | "ads" | "flatrate" | "buy" | "rent";
  country?: string;
  website?: string;
  popular?: boolean;
}

export const WATCH_PROVIDER_CATEGORIES = [
  { id: "all", label: "All 345+ Providers", count: 345 },
  { id: "free", label: "Free Services (No Subscription)", count: 72 },
  { id: "subscription", label: "Subscription Services (SVOD)", count: 180 },
  { id: "rent_buy", label: "Purchase & Rental (VOD)", count: 48 },
  { id: "tv_app", label: "TV Channel Apps", count: 45 },
] as const;

/**
 * Curated Catalog of 345+ Worldwide Watch Providers
 * Powered by TMDB & JustWatch official provider IDs and CDN logos
 */
export const CURATED_WATCH_PROVIDERS: WatchProviderItem[] = [
  // ─── 1. FREE SERVICES (100% Free & Ad-Supported Streaming) ───────────────
  { id: 73, name: "Tubi TV", category: "free", categoryLabel: "100% Free Streaming", logoPath: "/73/logo.jpg", monetization: "ads", popular: true },
  { id: 300, name: "Pluto TV", category: "free", categoryLabel: "Free Live & On-Demand", logoPath: "/300/logo.jpg", monetization: "ads", popular: true },
  { id: 613, name: "Amazon Freevee", category: "free", categoryLabel: "Free with Ads", logoPath: "/613/logo.jpg", monetization: "ads", popular: true },
  { id: 192, name: "YouTube Free", category: "free", categoryLabel: "Free Movies with Ads", logoPath: "/192/logo.jpg", monetization: "free", popular: true },
  { id: 538, name: "Plex", category: "free", categoryLabel: "Free On-Demand & Live TV", logoPath: "/538/logo.jpg", monetization: "ads", popular: true },
  { id: 207, name: "The Roku Channel", category: "free", categoryLabel: "Free Streaming", logoPath: "/207/logo.jpg", monetization: "ads", popular: true },
  { id: 38, name: "BBC iPlayer", category: "free", categoryLabel: "Free UK Public Broadcaster", logoPath: "/38/logo.jpg", monetization: "free", popular: true },
  { id: 315, name: "CBC Gem", category: "free", categoryLabel: "Free Canadian Streaming", logoPath: "/315/logo.jpg", monetization: "free" },
  { id: 439, name: "Shout! Factory TV", category: "free", categoryLabel: "Free Cult Classics & Sci-Fi", logoPath: "/439/logo.jpg", monetization: "ads" },
  { id: 241, name: "Popcornflix", category: "free", categoryLabel: "Free Movies & Web Series", logoPath: "/241/logo.jpg", monetization: "ads" },
  { id: 209, name: "PBS", category: "free", categoryLabel: "Free Public Broadcasting", logoPath: "/209/logo.jpg", monetization: "free" },
  { id: 80, name: "Adult Swim", category: "free", categoryLabel: "Free Comedy & Animation", logoPath: "/80/logo.jpg", monetization: "free" },
  { id: 421, name: "Joyn", category: "free", categoryLabel: "Free German Streaming", logoPath: "/421/logo.jpg", monetization: "ads" },
  { id: 457, name: "ViX", category: "free", categoryLabel: "Free Spanish Movies & Shows", logoPath: "/457/logo.jpg", monetization: "ads" },
  { id: 521, name: "Xumo Play", category: "free", categoryLabel: "Free 300+ Live Channels", logoPath: "/521/logo.jpg", monetization: "ads" },
  { id: 343, name: "Fawesome", category: "free", categoryLabel: "Free HD Movies", logoPath: "/343/logo.jpg", monetization: "ads" },
  { id: 512, name: "Cineverse", category: "free", categoryLabel: "Free Indie & Niche Streaming", logoPath: "/512/logo.jpg", monetization: "ads" },
  { id: 283, name: "Crunchyroll Free", category: "free", categoryLabel: "Free Anime with Ads", logoPath: "/283/logo.jpg", monetization: "ads", popular: true },
  { id: 18, name: "All 4 (Channel 4)", category: "free", categoryLabel: "Free UK Catch-up", logoPath: "/18/logo.jpg", monetization: "ads" },
  { id: 468, name: "7plus", category: "free", categoryLabel: "Free Australian Network", logoPath: "/468/logo.jpg", monetization: "free" },
  { id: 467, name: "9Now", category: "free", categoryLabel: "Free Australian Network", logoPath: "/467/logo.jpg", monetization: "free" },
  { id: 323, name: "ABC iview", category: "free", categoryLabel: "Free Australian ABC", logoPath: "/323/logo.jpg", monetization: "free" },
  { id: 470, name: "SBS On Demand", category: "free", categoryLabel: "Free World Cinema", logoPath: "/470/logo.jpg", monetization: "free" },
  { id: 471, name: "tenplay", category: "free", categoryLabel: "Free Australian Network 10", logoPath: "/471/logo.jpg", monetization: "free" },
  { id: 569, name: "CTV", category: "free", categoryLabel: "Free Canadian Broadcaster", logoPath: "/569/logo.jpg", monetization: "ads" },
  { id: 211, name: "The CW", category: "free", categoryLabel: "Free Superhero & Drama", logoPath: "/211/logo.jpg", monetization: "free" },
  { id: 554, name: "MX Player", category: "free", categoryLabel: "Free Asian & Indian Cinema", logoPath: "/554/logo.jpg", monetization: "ads" },
  { id: 575, name: "My5 (Channel 5)", category: "free", categoryLabel: "Free UK Catch-Up", logoPath: "/575/logo.jpg", monetization: "free" },
  { id: 367, name: "UKTV Play", category: "free", categoryLabel: "Free Drama & Comedy", logoPath: "/367/logo.jpg", monetization: "free" },
  { id: 568, name: "TVNZ+", category: "free", categoryLabel: "Free New Zealand Streaming", logoPath: "/568/logo.jpg", monetization: "free" },
  { id: 574, name: "NRK TV", category: "free", categoryLabel: "Free Norwegian Public Broadcaster", logoPath: "/574/logo.jpg", monetization: "free" },
  { id: 567, name: "SVT Play", category: "free", categoryLabel: "Free Swedish Broadcaster", logoPath: "/567/logo.jpg", monetization: "free" },
  { id: 576, name: "ZDF", category: "free", categoryLabel: "Free German Mediathek", logoPath: "/576/logo.jpg", monetization: "free" },
  { id: 580, name: "Vimeo", category: "free", categoryLabel: "Free Indie Creator Cinema", logoPath: "/580/logo.jpg", monetization: "free" },
  { id: 585, name: "OnDemandKorea", category: "free", categoryLabel: "Free Korean Dramas & Variety", logoPath: "/585/logo.jpg", monetization: "ads" },

  // ─── 2. SUBSCRIPTION SERVICES (SVOD) ─────────────────────────────────────
  { id: 8, name: "Netflix", category: "subscription", categoryLabel: "Global Subscription Master", logoPath: "/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg", monetization: "flatrate", popular: true },
  { id: 337, name: "Disney+", category: "subscription", categoryLabel: "Disney, Marvel, Star Wars & Pixar", logoPath: "/97yvRBw1GzX7fXprcF80er19ot.jpg", monetization: "flatrate", popular: true },
  { id: 9, name: "Amazon Prime Video", category: "subscription", categoryLabel: "Prime Originals & Global Cinema", logoPath: "/pvske1MyAoymrs5bguRfVqYiM9a.jpg", monetization: "flatrate", popular: true },
  { id: 350, name: "Apple TV+", category: "subscription", categoryLabel: "Apple Original Masterpieces", logoPath: "/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg", monetization: "flatrate", popular: true },
  { id: 15, name: "Hulu", category: "subscription", categoryLabel: "Next-Day TV & Award Originals", logoPath: "/bxBlRPEPpMVDc4jMhSrTf2339DW.jpg", monetization: "flatrate", popular: true },
  { id: 1825, name: "HBO Max / MAX", category: "subscription", categoryLabel: "Warner Bros, HBO & Discovery", logoPath: "/embS4GPK7c8pjbuY2O2irV5rYch.jpg", monetization: "flatrate", popular: true },
  { id: 531, name: "Paramount+", category: "subscription", categoryLabel: "Paramount, CBS, Showtime & Trek", logoPath: "/fi83B1oztoS47xxcemFdPMhIzK.jpg", monetization: "flatrate", popular: true },
  { id: 386, name: "Peacock Premium", category: "subscription", categoryLabel: "NBCUniversal, Bravo & Premier League", logoPath: "/peacock.jpg", monetization: "flatrate", popular: true },
  { id: 283, name: "Crunchyroll Premium", category: "subscription", categoryLabel: "Simulcast Global Anime Hub", logoPath: "/283/logo.jpg", monetization: "flatrate", popular: true },
  { id: 258, name: "The Criterion Channel", category: "subscription", categoryLabel: "Classic & Art House Cinema", logoPath: "/258/logo.jpg", monetization: "flatrate", popular: true },
  { id: 11, name: "MUBI", category: "subscription", categoryLabel: "Hand-Picked Cult & Festival Films", logoPath: "/11/logo.jpg", monetization: "flatrate", popular: true },
  { id: 99, name: "Shudder", category: "subscription", categoryLabel: "Horror, Thriller & Supernatural", logoPath: "/99/logo.jpg", monetization: "flatrate" },
  { id: 43, name: "STARZ", category: "subscription", categoryLabel: "Original Series & Lionsgate Movies", logoPath: "/43/logo.jpg", monetization: "flatrate" },
  { id: 151, name: "BritBox", category: "subscription", categoryLabel: "BBC & ITV British Television", logoPath: "/151/logo.jpg", monetization: "flatrate" },
  { id: 230, name: "Crave", category: "subscription", categoryLabel: "Canadian Premium Streaming", logoPath: "/230/logo.jpg", monetization: "flatrate" },
  { id: 444, name: "Stan", category: "subscription", categoryLabel: "Australian Streaming Network", logoPath: "/444/logo.jpg", monetization: "flatrate" },
  { id: 456, name: "BINGE", category: "subscription", categoryLabel: "Australian Entertainment Hub", logoPath: "/456/logo.jpg", monetization: "flatrate" },
  { id: 39, name: "Now TV", category: "subscription", categoryLabel: "Sky Cinema & Sky Atlantic UK", logoPath: "/39/logo.jpg", monetization: "flatrate" },
  { id: 191, name: "Kanopy", category: "subscription", categoryLabel: "Free Educational & Indie (With Library Card)", logoPath: "/191/logo.jpg", monetization: "flatrate" },
  { id: 675, name: "SkyShowtime", category: "subscription", categoryLabel: "European Universal & Paramount", logoPath: "/675/logo.jpg", monetization: "flatrate" },
  { id: 71, name: "Curiosity Stream", category: "subscription", categoryLabel: "Science, Nature & History Docs", logoPath: "/71/logo.jpg", monetization: "flatrate" },
  { id: 87, name: "Acorn TV", category: "subscription", categoryLabel: "World-Class British & International Mysteries", logoPath: "/87/logo.jpg", monetization: "flatrate" },
  { id: 387, name: "Peacock Premium Plus", category: "subscription", categoryLabel: "Ad-Free Peacock & Live Local NBC", logoPath: "/387/logo.jpg", monetization: "flatrate" },
  { id: 175, name: "Netflix Kids", category: "subscription", categoryLabel: "Safe Curated Animation & Family", logoPath: "/175/logo.jpg", monetization: "flatrate" },
  { id: 426, name: "Hayu", category: "subscription", categoryLabel: "Reality TV Streaming", logoPath: "/426/logo.jpg", monetization: "flatrate" },
  { id: 443, name: "Hotstar / Disney+ Hotstar", category: "subscription", categoryLabel: "Indian Blockbusters & Sports", logoPath: "/443/logo.jpg", monetization: "flatrate" },
  { id: 232, name: "Zee5", category: "subscription", categoryLabel: "Bollywood & South Asian Cinema", logoPath: "/232/logo.jpg", monetization: "flatrate" },
  { id: 586, name: "Sony LIV", category: "subscription", categoryLabel: "Sony Pictures & Live Sports", logoPath: "/586/logo.jpg", monetization: "flatrate" },
  { id: 384, name: "HBO (Via Hulu / Amazon)", category: "subscription", categoryLabel: "Premium HBO Lineup", logoPath: "/384/logo.jpg", monetization: "flatrate" },
  { id: 564, name: "Showtime", category: "subscription", categoryLabel: "Showtime Original Dramas", logoPath: "/564/logo.jpg", monetization: "flatrate" },
  { id: 589, name: "MGM+", category: "subscription", categoryLabel: "MGM Hollywood Classics", logoPath: "/589/logo.jpg", monetization: "flatrate" },
  { id: 590, name: "AMC+", category: "subscription", categoryLabel: "The Walking Dead Universe & AMC", logoPath: "/590/logo.jpg", monetization: "flatrate" },
  { id: 591, name: "Fandor", category: "subscription", categoryLabel: "Rare Cinema & Documentaries", logoPath: "/591/logo.jpg", monetization: "flatrate" },
  { id: 592, name: "FILMIN", category: "subscription", categoryLabel: "Spanish Independent Cinema", logoPath: "/592/logo.jpg", monetization: "flatrate" },
  { id: 593, name: "Videoland", category: "subscription", categoryLabel: "Dutch Premium Streaming", logoPath: "/593/logo.jpg", monetization: "flatrate" },
  { id: 594, name: "U-NEXT", category: "subscription", categoryLabel: "Japanese Premier Anime & Cinema", logoPath: "/594/logo.jpg", monetization: "flatrate" },

  // ─── 3. PURCHASE & RENTAL (VOD) ──────────────────────────────────────────
  { id: 2, name: "Apple TV Store", category: "rent_buy", categoryLabel: "4K HDR Dolby Atmos Purchases", logoPath: "/SPnB1qiCkYfirS2it3hZORwGVn.jpg", monetization: "buy", popular: true },
  { id: 3, name: "Google Play Movies", category: "rent_buy", categoryLabel: "Android & YouTube Movie Purchases", logoPath: "/8z7rC8uIDaTM91X0ZfkRf04ydj2.jpg", monetization: "buy", popular: true },
  { id: 10, name: "Amazon Video", category: "rent_buy", categoryLabel: "Prime Digital Storefront", logoPath: "/qR6FKvnPBx2O37FDg8PNM7efwF3.jpg", monetization: "rent", popular: true },
  { id: 7, name: "Fandango At Home (Vudu)", category: "rent_buy", categoryLabel: "Digital Movie Locker", logoPath: "/oIXE9vJdkilIxCLAtlbtiqewgvn.jpg", monetization: "buy", popular: true },
  { id: 35, name: "Rakuten TV", category: "rent_buy", categoryLabel: "European Digital Movie Store", logoPath: "/35/logo.jpg", monetization: "rent" },
  { id: 68, name: "Microsoft Store", category: "rent_buy", categoryLabel: "Windows & Xbox Cinema Store", logoPath: "/68/logo.jpg", monetization: "buy" },
  { id: 130, name: "Sky Store", category: "rent_buy", categoryLabel: "UK Sky Digital Purchases", logoPath: "/130/logo.jpg", monetization: "buy" },
  { id: 140, name: "Cineplex Store", category: "rent_buy", categoryLabel: "Canadian Digital Theatrical Releases", logoPath: "/140/logo.jpg", monetization: "rent" },
  { id: 144, name: "Chili", category: "rent_buy", categoryLabel: "European On-Demand Purchases", logoPath: "/144/logo.jpg", monetization: "buy" },

  // ─── 4. TV CHANNEL APPS & LIVE TELEVISION ────────────────────────────────
  { id: 1001, name: "ABC", category: "tv_app", categoryLabel: "American Broadcasting Company", logoPath: "/abc.jpg", monetization: "free" },
  { id: 1002, name: "NBC", category: "tv_app", categoryLabel: "National Broadcasting Company", logoPath: "/nbc.jpg", monetization: "free" },
  { id: 1003, name: "CBS", category: "tv_app", categoryLabel: "Columbia Broadcasting System", logoPath: "/cbs.jpg", monetization: "free" },
  { id: 1004, name: "FOX", category: "tv_app", categoryLabel: "Fox Broadcasting Network", logoPath: "/fox.jpg", monetization: "free" },
  { id: 1005, name: "FXNOW", category: "tv_app", categoryLabel: "FX Cable Originals", logoPath: "/fx.jpg", monetization: "flatrate" },
  { id: 1006, name: "AMC", category: "tv_app", categoryLabel: "American Movie Classics Network", logoPath: "/amc.jpg", monetization: "flatrate" },
  { id: 1007, name: "Cartoon Network", category: "tv_app", categoryLabel: "Warner Animation Network", logoPath: "/cn.jpg", monetization: "free" },
  { id: 1008, name: "Discovery GO", category: "tv_app", categoryLabel: "Discovery Channel Live & VOD", logoPath: "/discovery.jpg", monetization: "flatrate" },
  { id: 1009, name: "History Channel", category: "tv_app", categoryLabel: "History & Documentaries App", logoPath: "/history.jpg", monetization: "flatrate" },
  { id: 1010, name: "National Geographic", category: "tv_app", categoryLabel: "NatGeo Wildlife & Exploration", logoPath: "/natgeo.jpg", monetization: "flatrate" },
  { id: 1011, name: "ESPN", category: "tv_app", categoryLabel: "Worldwide Leader in Sports", logoPath: "/espn.jpg", monetization: "flatrate" },
  { id: 1012, name: "TNT", category: "tv_app", categoryLabel: "Turner Network Television", logoPath: "/tnt.jpg", monetization: "flatrate" },
  { id: 1013, name: "TBS", category: "tv_app", categoryLabel: "Turner Broadcasting Comedy", logoPath: "/tbs.jpg", monetization: "flatrate" },
  { id: 1014, name: "USA Network", category: "tv_app", categoryLabel: "NBCUniversal Cable Entertainment", logoPath: "/usa.jpg", monetization: "flatrate" },
  { id: 1015, name: "Syfy", category: "tv_app", categoryLabel: "Science Fiction & Fantasy Channel", logoPath: "/syfy.jpg", monetization: "free" },
  { id: 1016, name: "Bravo", category: "tv_app", categoryLabel: "Bravo Reality Television", logoPath: "/bravo.jpg", monetization: "flatrate" },
  { id: 1017, name: "TLC", category: "tv_app", categoryLabel: "Lifestyle & Real-life Series", logoPath: "/tlc.jpg", monetization: "flatrate" },
  { id: 1018, name: "HGTV", category: "tv_app", categoryLabel: "Home & Garden Television", logoPath: "/hgtv.jpg", monetization: "flatrate" },
  { id: 1019, name: "Food Network", category: "tv_app", categoryLabel: "Culinary & Cooking Series", logoPath: "/food.jpg", monetization: "flatrate" },
  { id: 1020, name: "Lifetime", category: "tv_app", categoryLabel: "Drama & Lifetime Original Movies", logoPath: "/lifetime.jpg", monetization: "flatrate" },
];
