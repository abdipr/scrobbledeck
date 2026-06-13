const API_KEY =
  import.meta.env.VITE_LASTFM_API_KEY || "0ba136b606bebb99b634e91fe9f0897f";
const BASE_URL = "https://ws.audioscrobbler.com/2.0/";

export interface Track {
  name: string;
  artist: string;
  album: string;
  image: string;
  nowPlaying: boolean;
  loved?: boolean;
  plays?: number;
  date?: string;
  previewUrl?: string;
  appleMusicUrl?: string;
}

export interface iTunesInfo {
  image?: string;
  previewUrl?: string;
  appleMusicUrl?: string;
}

export async function fetchiTunesInfo(
  artist: string,
  track: string,
): Promise<iTunesInfo | null> {
  try {
    const cleanedArtist = cleanSearchTerm(artist);
    const cleanedTrack = cleanSearchTerm(track);
    const term = `${cleanedArtist} ${cleanedTrack}`;
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.results?.[0];
    if (result) {
      const resultArtist = (result.artistName || "").toLowerCase();
      const queryArtist = artist.toLowerCase();
      const queryArtistWords = queryArtist.split(/\s+/).filter((w) => w.length > 2);
      
      const isArtistMatch =
        queryArtistWords.some((word) => resultArtist.includes(word)) ||
        resultArtist.includes(queryArtist) ||
        queryArtist.includes(resultArtist);

      if (isArtistMatch) {
        return {
          image: result.artworkUrl100
            ? result.artworkUrl100.replace("100x100bb", "500x500bb")
            : undefined,
          previewUrl: result.previewUrl || "",
          appleMusicUrl: result.trackViewUrl || "",
        };
      }
    }
  } catch (e) {
    console.error("fetchiTunesInfo error:", e);
  }
  return null;
}

export interface Artist {
  name: string;
  playcount: number;
  image: string;
  url: string;
}

export interface Album {
  name: string;
  artist: string;
  playcount: number;
  image: string;
}

const cleanImage = (url: string): string => {
  if (
    !url ||
    url.includes("2a96cbd8b46e442fc41c2b86b821562f") ||
    url.includes("2a96cbd87eeb481c8f21b2dd77693716") ||
    url.includes("noimage")
  ) {
    return "";
  }
  return url;
};

// Fallback image fetching helpers
const cleanSearchTerm = (term: string): string => {
  return term
    .replace(/\s*[\(\[][Ff]eat\..*?[\)\]]/g, "") // remove (feat. ...) or [feat. ...]
    .replace(/\s*[\(\[][Ff]t\..*?[\)\]]/g, "") // remove (ft. ...) or [ft. ...]
    .replace(
      /\s+-\s+.*?(?:[Rr]emastered|[Ll]ive|[Ss]ingle|[Vv]ersion|[Ee]dit).*/g,
      "",
    ) // remove " - Remastered..." etc.
    .replace(/\s*[\(\[][Rr]emastered.*?[\)\]]/g, "") // remove (Remastered...)
    .replace(/\s*[\(\[][Ll]ive.*?[\)\]]/g, "") // remove (Live...)
    .replace(/\s*[\(\[][Ss]ingle.*?[\)\]]/g, "") // remove (Single...)
    .replace(/\s*[\(\[][Vv]ersion.*?[\)\]]/g, "") // remove (Version...)
    .replace(/\s*[\(\[][Ee]dit.*?[\)\]]/g, "") // remove (Edit...)
    .trim();
};

async function fetchLastfmTrackImage(
  artist: string,
  track: string,
): Promise<string> {
  try {
    const url = `${BASE_URL}?method=track.getInfo&api_key=${API_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return "";
    const data = await res.json();
    const albumImage =
      data?.track?.album?.image?.find((img: any) => img.size === "large")?.[
        "#text"
      ] ||
      data?.track?.album?.image?.find(
        (img: any) => img.size === "extralarge",
      )?.["#text"] ||
      "";
    return cleanImage(albumImage);
  } catch (e) {
    console.error("fetchLastfmTrackImage error:", e);
  }
  return "";
}

async function fetchFallbackTrackImage(
  artist: string,
  track: string,
): Promise<string> {
  // 1. Try to get it directly from Last.fm's track.getInfo first (album artwork)
  const lastfmImg = await fetchLastfmTrackImage(artist, track);
  if (lastfmImg) return lastfmImg;

  // 2. Secondary fallback: iTunes Search API
  const info = await fetchiTunesInfo(artist, track);
  return info?.image || "";
}

async function fetchFallbackArtistImage(artist: string): Promise<string> {
  const cleanedArtist = cleanSearchTerm(artist);

  // Try Deezer first for actual artist portrait image
  try {
    const url = `https://api.deezer.com/search/artist?q=${encodeURIComponent(cleanedArtist)}&limit=1`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const picture = data?.data?.[0]?.picture_medium;
      if (picture) return picture;
    }
  } catch (e) {
    console.warn("Deezer fetch failed, trying iTunes:", e);
  }

  // Fallback to iTunes if Deezer fails or is blocked by CORS
  try {
    const songUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanedArtist)}&entity=song&limit=1`;
    const songRes = await fetch(songUrl);
    if (songRes.ok) {
      const songData = await songRes.json();
      const artwork = songData?.results?.[0]?.artworkUrl100;
      if (artwork) {
        return artwork.replace("100x100bb", "500x500bb");
      }
    }
  } catch (e) {
    console.error("fetchFallbackArtistImage iTunes fallback error:", e);
  }
  return "";
}

async function fetchFallbackAlbumImage(
  artist: string,
  album: string,
): Promise<string> {
  try {
    const cleanedArtist = cleanSearchTerm(artist);
    const cleanedAlbum = cleanSearchTerm(album);
    const term = `${cleanedArtist} ${cleanedAlbum}`;
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return "";
    const data = await res.json();
    const artwork = data?.results?.[0]?.artworkUrl100;
    if (artwork) {
      return artwork.replace("100x100bb", "500x500bb");
    }
  } catch (e) {
    console.error("fetchFallbackAlbumImage error:", e);
  }
  return "";
}

// Convert Last.fm period to API format
// last.fm values: overall | 7day | 1month | 3month | 6month | 12month
export type Period = "7day" | "1month" | "12month" | "overall";

export async function fetchNowPlaying(username: string): Promise<Track | null> {
  try {
    const url = `${BASE_URL}?method=user.getrecenttracks&user=${encodeURIComponent(username)}&api_key=${API_KEY}&format=json&limit=1&extended=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch recent tracks");
    const data = await res.json();
    const trackData = data?.recenttracks?.track?.[0];
    if (!trackData) return null;

    const rawImage =
      trackData.image?.find((img: any) => img.size === "extralarge")?.[
        "#text"
      ] ||
      trackData.image?.find((img: any) => img.size === "large")?.["#text"] ||
      "";

    const artistName =
      trackData.artist?.name || trackData.artist?.["#text"] || "";
    let cleanedImg = cleanImage(rawImage);
    let previewUrl = "";
    let appleMusicUrl = "";

    if (artistName && trackData.name) {
      if (!cleanedImg) {
        cleanedImg = await fetchFallbackTrackImage(artistName, trackData.name);
      }
      const itunesInfo = await fetchiTunesInfo(artistName, trackData.name);
      if (itunesInfo) {
        previewUrl = itunesInfo.previewUrl || "";
        appleMusicUrl = itunesInfo.appleMusicUrl || "";
      }
    }

    return {
      name: trackData.name,
      artist: artistName,
      album: trackData.album?.["#text"] || "",
      image: cleanedImg,
      nowPlaying: trackData["@attr"]?.nowplaying === "true",
      loved: trackData.loved === "1",
      date: trackData.date?.["#text"] || "",
      previewUrl,
      appleMusicUrl,
    };
  } catch (error) {
    console.error("fetchNowPlaying error:", error);
    return null;
  }
}

export async function fetchTopTracks(
  username: string,
  period: Period,
  limit = 5,
): Promise<Track[]> {
  try {
    const url = `${BASE_URL}?method=user.gettoptracks&user=${encodeURIComponent(username)}&period=${period}&api_key=${API_KEY}&format=json&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch top tracks");
    const data = await res.json();
    const tracks = data?.toptracks?.track || [];
    const tracksList = Array.isArray(tracks) ? tracks : [tracks];
    return Promise.all(
      tracksList.map(async (track: any) => {
        const artist = track.artist?.name || "";
        const name = track.name;
        let imgUrl = cleanImage(
          track.image?.find((img: any) => img.size === "large")?.["#text"] ||
            "",
        );
        let previewUrl = "";
        let appleMusicUrl = "";

        if (artist && name) {
          if (!imgUrl) {
            imgUrl = await fetchFallbackTrackImage(artist, name);
          }
          const itunesInfo = await fetchiTunesInfo(artist, name);
          if (itunesInfo) {
            previewUrl = itunesInfo.previewUrl || "";
            appleMusicUrl = itunesInfo.appleMusicUrl || "";
          }
        }
        return {
          name,
          artist,
          album: "",
          image: imgUrl,
          nowPlaying: false,
          plays: parseInt(track.playcount || "0", 10),
          previewUrl,
          appleMusicUrl,
        };
      }),
    );
  } catch (error) {
    console.error("fetchTopTracks error:", error);
    return [];
  }
}

export async function fetchTopArtists(
  username: string,
  period: Period,
  limit = 5,
): Promise<Artist[]> {
  try {
    const url = `${BASE_URL}?method=user.gettopartists&user=${encodeURIComponent(username)}&period=${period}&api_key=${API_KEY}&format=json&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch top artists");
    const data = await res.json();
    const artists = data?.topartists?.artist || [];
    const artistsList = Array.isArray(artists) ? artists : [artists];
    return Promise.all(
      artistsList.map(async (artist: any) => {
        const name = artist.name;
        let imgUrl = cleanImage(
          artist.image?.find((img: any) => img.size === "large")?.["#text"] ||
            "",
        );
        if (!imgUrl) {
          imgUrl = await fetchFallbackArtistImage(name);
        }
        return {
          name,
          playcount: parseInt(artist.playcount || "0", 10),
          image: imgUrl,
          url: artist.url,
        };
      }),
    );
  } catch (error) {
    console.error("fetchTopArtists error:", error);
    return [];
  }
}

export async function fetchTopAlbums(
  username: string,
  period: Period,
  limit = 5,
): Promise<Album[]> {
  try {
    const url = `${BASE_URL}?method=user.gettopalbums&user=${encodeURIComponent(username)}&period=${period}&api_key=${API_KEY}&format=json&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch top albums");
    const data = await res.json();
    const albums = data?.topalbums?.album || [];
    const albumsList = Array.isArray(albums) ? albums : [albums];
    return Promise.all(
      albumsList.map(async (album: any) => {
        const name = album.name;
        const artist = album.artist?.name || "";
        let imgUrl = cleanImage(
          album.image?.find((img: any) => img.size === "large")?.["#text"] ||
            "",
        );
        if (!imgUrl && artist) {
          imgUrl = await fetchFallbackAlbumImage(artist, name);
        }
        return {
          name,
          artist,
          playcount: parseInt(album.playcount || "0", 10),
          image: imgUrl,
        };
      }),
    );
  } catch (error) {
    console.error("fetchTopAlbums error:", error);
    return [];
  }
}

export async function fetchLovedTracks(
  username: string,
  limit = 50,
): Promise<{ artist: string; name: string }[]> {
  try {
    const url = `${BASE_URL}?method=user.getlovedtracks&user=${encodeURIComponent(username)}&api_key=${API_KEY}&format=json&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const tracks = data?.lovedtracks?.track || [];
    const tracksList = Array.isArray(tracks) ? tracks : [tracks];
    return tracksList.map((t: any) => ({
      artist: t.artist?.name || "",
      name: t.name || "",
    }));
  } catch (e) {
    console.error("fetchLovedTracks error:", e);
    return [];
  }
}
