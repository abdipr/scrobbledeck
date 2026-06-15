import { useEffect, useState, useRef, type CSSProperties } from "react";
import { getColor, getPalette } from "colorthief";
import { useSearchParams } from "react-router-dom";
import {
  fetchNowPlaying,
  fetchTopTracks,
  fetchTopArtists,
  fetchTopAlbums,
  fetchLovedTracks,
  fetchRecentTracksList,
  fetchUserInfo,
  fetchWeeklyTrackChart,
  fetchTopTags,
} from "../lib/api";
import type {
  Track,
  Artist,
  Album,
  Period,
  UserProfile,
  WeeklyStat,
  Tag,
} from "../lib/api";
import { Music, Radio, Disc, User, Play, Heart } from "lucide-react";

export default function WidgetEmbed() {
  const [searchParams] = useSearchParams();

  // URL parameters parsing
  const username = searchParams.get("username") || "";
  const type = searchParams.get("type") || "nowplaying"; // nowplaying | toptracks | topartists | topalbums
  const period = (searchParams.get("period") || "7day") as Period;
  const bgParam = searchParams.get("bg") || "#09090b";
  const bgImage = searchParams.get("bgImage") || "";
  const customTextColor = searchParams.get("textColor") || "#a1a1aa";
  const customAccentColor = searchParams.get("accentColor") || "";
  const customRadius = searchParams.get("radius") || "lg"; // none | sm | md | lg | xl | full
  const layout = searchParams.get("layout") || "list"; // list | grid | compact
  const rawLimit = parseInt(searchParams.get("limit") || "5", 10);
  const limit = Math.min(Math.max(rawLimit, 1), 30);
  const animated = searchParams.get("animated") !== "false";
  const customFont = searchParams.get("font") || "Be Vietnam Pro";
  const clickable = searchParams.get("clickable") !== "false";
  const showCover = searchParams.get("showCover") !== "false";
  const colsParam = searchParams.get("cols");
  const showLoved = searchParams.get("showLoved") !== "false";
  const showPlaycount = searchParams.get("showPlaycount") !== "false";
  const autoScroll = searchParams.get("autoScroll") === "true";
  const showUsername = searchParams.get("showUsername") === "true";
  const scrobbleLabel = searchParams.get("scrobbleLabel") || "scrobbles";
  const clickTarget = searchParams.get("clickTarget") || "lastfm";
  const heightMode = searchParams.get("heightMode") || "auto";

  const getRedirectUrl = (track: Track) => {
    if (clickTarget === "spotify") {
      return `https://open.spotify.com/search/${encodeURIComponent(track.artist + " " + track.name)}`;
    }
    if (clickTarget === "applemusic") {
      return (
        track.appleMusicUrl ||
        `https://music.apple.com/us/search?term=${encodeURIComponent(track.artist + " " + track.name)}`
      );
    }
    return getTrackUrl(track.artist, track.name);
  };

  const getNowPlayingRedirectUrl = () => {
    if (!nowPlaying)
      return `https://www.last.fm/user/${encodeURIComponent(username)}`;
    if (clickTarget === "spotify") {
      return `https://open.spotify.com/search/${encodeURIComponent(nowPlaying.artist + " " + nowPlaying.name)}`;
    }
    if (clickTarget === "applemusic") {
      return (
        nowPlaying.appleMusicUrl ||
        `https://music.apple.com/us/search?term=${encodeURIComponent(nowPlaying.artist + " " + nowPlaying.name)}`
      );
    }
    return getTrackUrl(nowPlaying.artist || "", nowPlaying.name || "");
  };

  const getArtistRedirectUrl = (artistName: string) => {
    if (clickTarget === "spotify") {
      return `https://open.spotify.com/search/${encodeURIComponent(artistName)}`;
    }
    if (clickTarget === "applemusic") {
      return `https://music.apple.com/us/search?term=${encodeURIComponent(artistName)}`;
    }
    return getArtistUrl(artistName);
  };

  const getAlbumRedirectUrl = (artistName: string, albumName: string) => {
    if (clickTarget === "spotify") {
      return `https://open.spotify.com/search/${encodeURIComponent(artistName + " " + albumName)}`;
    }
    if (clickTarget === "applemusic") {
      return `https://music.apple.com/us/search?term=${encodeURIComponent(artistName + " " + albumName)}`;
    }
    return getAlbumUrl(artistName, albumName);
  };

  const getScrobbleText = (count: number) => {
    const label = scrobbleLabel.trim();
    const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
    return `${count} ${capitalized}`;
  };

  const autoCols = (lim: number): number => {
    if (lim <= 3) return lim;
    if (lim <= 6) return 3;
    if (lim <= 9) return 3;
    if (lim === 10) return 5;
    if (lim <= 12) return 4;
    return 5;
  };
  const cols =
    colsParam && colsParam !== "auto"
      ? parseInt(colsParam, 10)
      : autoCols(limit);

  // URL Helpers for Last.fm user library links
  const getArtistUrl = (artistName: string) =>
    `https://www.last.fm/user/${encodeURIComponent(username)}/library/music/${encodeURIComponent(artistName)}`;

  const getAlbumUrl = (artistName: string, albumName: string) =>
    `https://www.last.fm/user/${encodeURIComponent(username)}/library/music/${encodeURIComponent(artistName)}/${encodeURIComponent(albumName)}`;

  const getTrackUrl = (artistName: string, trackName: string) =>
    `https://www.last.fm/user/${encodeURIComponent(username)}/library/music/${encodeURIComponent(artistName)}/_/${encodeURIComponent(trackName)}`;

  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<Track | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
  const [topTags, setTopTags] = useState<Tag[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const [audioObj] = useState(() => new Audio());
  const [dynamicColor, setDynamicColor] = useState<{
    r: number;
    g: number;
    b: number;
    hex: string;
    isDark: boolean;
    secondaryHex?: string;
  } | null>(null);
  const [showBars, setShowBars] = useState(false);

  useEffect(() => {
    // Control #root height based on heightMode
    const root = document.getElementById("root");
    if (root) {
      if (heightMode === "fixed") {
        root.style.minHeight = "auto";
        root.style.height = "100dvh";
        document.body.style.overflow = "hidden";
      } else {
        root.style.minHeight = "auto";
        root.style.height = "fit-content";
        document.body.style.overflow = "visible";
      }
    }
  }, [heightMode]);

  useEffect(() => {
    if (
      bgParam?.startsWith("dynamic") &&
      type === "nowplaying" &&
      nowPlaying?.image
    ) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = nowPlaying.image;

      img.onload = async () => {
        try {
          const color = await getColor(img);
          const palette = await getPalette(img, { colorCount: 3 });

          if (!color) return;

          const { r, g, b } = color.rgb();
          const hex = color.hex();
          const isDark = color.isDark;

          let secondaryHex = hex;

          if (palette && palette.length > 1) {
            secondaryHex = palette[1].hex();
          }

          setDynamicColor({
            r,
            g,
            b,
            hex,
            isDark,
            secondaryHex,
          });
        } catch (e) {
          console.error("ColorThief error:", e);
        }
      };
    } else {
      setDynamicColor(null);
    }
  }, [bgParam, type, nowPlaying?.image]);

  const togglePreview = (url: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (playingPreview === url) {
      audioObj.pause();
      setPlayingPreview(null);
    } else {
      audioObj.src = url;
      audioObj.play().catch((err) => console.log("Audio play error:", err));
      setPlayingPreview(url);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const handleAudioEnded = () => {
      setPlayingPreview(null);
    };
    audioObj.addEventListener("ended", handleAudioEnded);
    return () => {
      audioObj.removeEventListener("ended", handleAudioEnded);
      audioObj.pause();
    };
  }, [audioObj]);

  // Apple Music layout states
  const [elapsed, setElapsed] = useState(48);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (
      type !== "nowplaying" ||
      layout !== "apple" ||
      isPaused ||
      !nowPlaying?.nowPlaying
    )
      return;
    const interval = setInterval(() => {
      setElapsed((prev) => (prev >= 210 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [type, layout, isPaused, nowPlaying?.name, nowPlaying?.nowPlaying]);

  useEffect(() => {
    // Reset elapsed time when track name changes
    setElapsed(Math.floor(Math.random() * 40) + 15);
    setIsPaused(false);
  }, [nowPlaying?.name]);

  // Dynamically load Google Font
  useEffect(() => {
    if (!customFont) return;
    const fontId = `g-font-${customFont.replace(/\s+/g, "-").toLowerCase()}`;
    if (document.getElementById(fontId)) return;

    const link = document.createElement("link");
    link.id = fontId;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(customFont)}:wght@300;400;500;600;700;800;900&display=swap`;
    document.head.appendChild(link);
  }, [customFont]);

  // Set body background to transparent for embed styling
  useEffect(() => {
    document.body.style.backgroundColor = "transparent";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  useEffect(() => {
    if (!username) {
      setError("Last.fm username is required");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        if (type === "nowplaying") {
          const data = await fetchNowPlaying(username);
          setNowPlaying(data);
        } else if (type === "toptracks") {
          const [tracksData, lovedList] = await Promise.all([
            fetchTopTracks(username, period, limit),
            fetchLovedTracks(username, 50).catch(() => []),
          ]);

          const mappedTracks = tracksData.map((track) => {
            const isLoved = lovedList.some(
              (lt) =>
                lt.name.toLowerCase() === track.name.toLowerCase() &&
                lt.artist.toLowerCase() === track.artist.toLowerCase(),
            );
            return { ...track, loved: isLoved };
          });
          setTracks(mappedTracks);
        } else if (type === "topartists") {
          const data = await fetchTopArtists(username, period, limit);
          setArtists(data);
        } else if (type === "topalbums") {
          const data = await fetchTopAlbums(username, period, limit);
          setAlbums(data);
        } else if (type === "recenttracks") {
          const data = await fetchRecentTracksList(username, limit);
          setTracks(data);
        } else if (type === "lovedtracks") {
          const data = await fetchLovedTracks(username, limit);
          setTracks(data);
        } else if (type === "userprofile") {
          const data = await fetchUserInfo(username);
          setUserProfile(data);
        } else if (type === "weeklystats") {
          const data = await fetchWeeklyTrackChart(username, limit);
          setWeeklyStats(data);
        } else if (type === "topgenres") {
          const data = await fetchTopTags(username, limit);
          setTopTags(data);
        }
      } catch (err) {
        setError("Error fetching stats");
      } finally {
        setLoading(false);
        if (type === "weeklystats") {
          setTimeout(() => setShowBars(true), 100);
        }
      }
    };

    loadData();

    let interval: any;
    if (type === "nowplaying" && isVisible) {
      const isPlaying = nowPlaying?.nowPlaying;
      const delay = isPlaying ? 15000 : 60000;
      interval = setInterval(loadData, delay);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [username, type, period, limit, isVisible, nowPlaying?.nowPlaying]);

  useEffect(() => {
    if (layout !== "carousel" || !autoScroll || loading || !carouselRef.current)
      return;

    let animationId: number;
    let currentScroll = carouselRef.current.scrollLeft;
    // Base speed = 0.5 pixels per frame, slow down to 0.1 on hover
    const speed = isHovered ? 0.1 : 0.5;

    const scroll = () => {
      if (carouselRef.current) {
        currentScroll += speed;

        // Use scrollWidth / 2 because we duplicated the items
        const halfWidth = carouselRef.current.scrollWidth / 2;

        if (currentScroll >= halfWidth) {
          currentScroll -= halfWidth; // seamless reset
        }

        carouselRef.current.scrollLeft = currentScroll;
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [layout, autoScroll, loading, isHovered]);

  // Determine container styling based on theme
  let containerStyle: CSSProperties = {};
  let containerClasses = "";
  let textClass = "";
  let accentColor = customAccentColor || "#ef4444"; // default red-500

  // Apply border radius
  const radiusMap: Record<string, string> = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };
  const roundedClass = radiusMap[customRadius] || "rounded-lg";

  if (bgParam === "glass") {
    containerClasses = `backdrop-blur-md bg-white/10 border border-white/20 text-white shadow-xl ${roundedClass} transition-all duration-300 ease-in-out`;
    textClass = "text-white/80 transition-colors duration-300";
  } else if (bgParam?.startsWith("dynamic") && type === "nowplaying") {
    containerClasses = `shadow-2xl ${roundedClass} transition-all duration-700 ease-in-out border`;
    if (dynamicColor) {
      const { r, g, b, hex } = dynamicColor;

      // Determine if we should use dark or light layout based on explicit theme,
      // fallback to auto-detect if the theme is just "dynamic"
      const forceDark =
        bgParam === "dynamic-dark" ||
        (bgParam === "dynamic" && dynamicColor.isDark);

      if (forceDark) {
        // Guarantee the background is dark by heavily darkening the extracted hue (e.g., 25% brightness)
        const bgR = Math.round(r * 0.25);
        const bgG = Math.round(g * 0.25);
        const bgB = Math.round(b * 0.25);

        // Very light tinted text for dark background
        const textR = Math.round(r + (255 - r) * 0.85);
        const textG = Math.round(g + (255 - g) * 0.85);
        const textB = Math.round(b + (255 - b) * 0.85);
        const textColor = `rgb(${textR}, ${textG}, ${textB})`;

        containerStyle = {
          background: `radial-gradient(circle at 10% 0%, rgb(${bgR}, ${bgG}, ${bgB}) 0%, rgb(10, 10, 12) 100%)`,
          borderColor: `rgba(${bgR}, ${bgG}, ${bgB}, 0.5)`,
          color: textColor,
        };
        textClass = "opacity-90 transition-colors duration-700";
      } else {
        // Guarantee the background is light by heavily lightening the extracted hue (e.g., mix 80% white)
        const bgR = Math.round(r + (255 - r) * 0.8);
        const bgG = Math.round(g + (255 - g) * 0.8);
        const bgB = Math.round(b + (255 - b) * 0.8);

        // Very dark tinted text for light background
        const textR = Math.round(r * 0.2);
        const textG = Math.round(g * 0.2);
        const textB = Math.round(b * 0.2);
        const textColor = `rgb(${textR}, ${textG}, ${textB})`;

        containerStyle = {
          background: `radial-gradient(circle at 10% 0%, rgb(${bgR}, ${bgG}, ${bgB}) 0%, rgb(248, 248, 250) 100%)`,
          borderColor: `rgba(${bgR}, ${bgG}, ${bgB}, 0.5)`,
          color: textColor,
        };
        textClass = "opacity-90 transition-colors duration-700";
      }

      // Ensure the accent color contrasts with the guaranteed background
      let finalAccent = dynamicColor.secondaryHex || hex;
      if (forceDark && dynamicColor.isDark) {
        // Lighten the accent if the album is naturally dark, so it pops against the dark background
        finalAccent = `rgb(${Math.round(r + (255 - r) * 0.4)}, ${Math.round(g + (255 - g) * 0.4)}, ${Math.round(b + (255 - b) * 0.4)})`;
      }
      if (!forceDark && !dynamicColor.isDark) {
        // Darken the accent if the album is naturally light, so it pops against the light background
        finalAccent = `rgb(${Math.round(r * 0.4)}, ${Math.round(g * 0.4)}, ${Math.round(b * 0.4)})`;
      }
      accentColor = finalAccent;
    } else {
      // Fallback while extracting
      containerClasses += " bg-zinc-950 border-zinc-900 text-zinc-100";
      textClass = "text-zinc-400 transition-colors duration-700";
    }
  } else {
    // Custom theme: utilizes parameters bg and textColor
    containerClasses = `shadow-md ${roundedClass} transition-all duration-300 ease-in-out`;
    containerStyle = {
      background: bgParam,
      color: customTextColor,
    };
    textClass = "opacity-80 transition-colors duration-300";
  }

  if (bgImage) {
    containerStyle.backgroundImage = `url(${bgImage})`;
    containerStyle.backgroundSize = "cover";
    containerStyle.backgroundPosition = "center";
  }

  containerStyle.fontFamily = `"${customFont}", sans-serif`;

  // Custom scrollbar generation based on background
  const getScrollbarCSS = () => {
    let isDarkBg = true;
    if (bgParam && bgParam.startsWith("#")) {
      const hex = bgParam.replace("#", "");
      if (hex.length === 3 || hex.length === 6) {
        const r = parseInt(
          hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2),
          16,
        );
        const g = parseInt(
          hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4),
          16,
        );
        const b = parseInt(
          hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6),
          16,
        );
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        isDarkBg = brightness < 128;
      }
    } else if (bgParam === "light" || bgParam === "dynamic-light") {
      isDarkBg = false;
    } else if (bgParam === "glass") {
      isDarkBg = true;
    }

    const thumbColor = isDarkBg
      ? "rgba(255, 255, 255, 0.2)"
      : "rgba(0, 0, 0, 0.2)";
    const thumbHoverColor = isDarkBg
      ? "rgba(255, 255, 255, 0.35)"
      : "rgba(0, 0, 0, 0.35)";

    return `
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: ${thumbColor} transparent;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: ${thumbColor} !important;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: ${thumbHoverColor} !important;
      }
    `;
  };

  const formatRelativeTime = (uts?: number, fallback?: string) => {
    if (!uts) return fallback || "";
    const now = Math.floor(Date.now() / 1000);
    const diff = now - uts;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
    return fallback || "";
  };

  const isPlaying = nowPlaying?.nowPlaying || false;

  const renderSkeletons = () => {
    const isGrid = layout === "grid" || layout === "carousel";
    const skeletonClass = "bg-current/10 animate-pulse rounded";

    if (type === "userprofile") {
      return (
        <div
          className={`p-6 w-full ${containerClasses}`}
          style={containerStyle}
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-28 h-28 rounded-full bg-current/10 animate-pulse border-4 border-current/10 shadow-xl" />
            <div className="flex-1 w-full flex flex-col items-center md:items-start">
              <div className="w-48 h-8 bg-current/10 animate-pulse rounded mb-2" />
              <div className="w-32 h-4 bg-current/10 animate-pulse rounded mb-4" />
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="w-24 h-14 bg-current/10 animate-pulse rounded-xl" />
                <div className="w-24 h-14 bg-current/10 animate-pulse rounded-xl" />
                <div className="w-24 h-14 bg-current/10 animate-pulse rounded-xl hidden sm:block" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (type === "topgenres") {
      return (
        <div
          className={`w-full h-full flex flex-wrap content-start items-center gap-2 p-6 justify-center ${containerClasses}`}
          style={containerStyle}
        >
          {Array(limit)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="w-24 h-8 bg-current/10 animate-pulse rounded-full"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
        </div>
      );
    }

    if (type === "weeklystats") {
      return (
        <div
          className={`w-full flex flex-col p-6 overflow-hidden ${containerClasses}`}
          style={containerStyle}
        >
          <h3 className="font-extrabold text-lg flex items-center gap-2 shrink-0 pb-3 mb-3 border-b border-current/10">
            <Music className="w-5 h-5" style={{ color: accentColor }} /> Weekly
            Top
          </h3>
          <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
            {Array(limit)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-md bg-current/10 animate-pulse shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-end mb-2">
                      <div className="w-3/4">
                        <div className="w-full h-4 bg-current/10 animate-pulse rounded mb-1" />
                        <div className="w-1/2 h-3 bg-current/10 animate-pulse rounded" />
                      </div>
                      <div className="w-6 h-4 bg-current/10 animate-pulse rounded" />
                    </div>
                    <div className="w-full h-1.5 bg-current/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-current/10 animate-pulse"
                        style={{ width: "0%" }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      );
    }

    if (type === "nowplaying") {
      if (layout === "apple") {
        return (
          <div
            className={`p-6 flex flex-col justify-between w-full ${containerClasses} relative select-none rounded-[28px]`}
            style={containerStyle}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center min-w-0 flex-1">
                {showCover && (
                  <div
                    className={`relative shrink-0 w-16 h-16 rounded-xl shadow-lg border border-white/5 bg-current/10 animate-pulse`}
                  />
                )}
                <div className="ml-4 min-w-0 flex-1 flex flex-col justify-center">
                  <div className="w-3/4 h-5 bg-current/10 animate-pulse rounded mb-2" />
                  <div className="w-1/2 h-3.5 bg-current/10 animate-pulse rounded" />
                </div>
              </div>
            </div>
            <div className="w-full mt-4">
              <div className="w-full h-[3.5px] rounded-full relative overflow-hidden bg-current/10 animate-pulse mb-2"></div>
              <div className="flex justify-between items-center text-[10px]">
                <div className="w-6 h-3 bg-current/10 animate-pulse rounded" />
                <div className="w-6 h-3 bg-current/10 animate-pulse rounded" />
              </div>
            </div>

            {/* Bottom row: Media Controls (Actual SVG icons, no skeleton) */}
            <div className="flex justify-between items-center w-full px-1 mt-2">
              <div className="p-1 opacity-70 text-current">
                <Heart
                  className="w-4.5 h-4.5"
                  style={{ color: "currentColor", fill: "transparent" }}
                />
              </div>

              <div className="flex items-center gap-4 sm:gap-8">
                <div className="text-current opacity-30 scale-[2] transform origin-center">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 26 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill="currentColor"
                      d="M23.120291 14.390625Q23.120291 15.051636 22.773672 15.381592Q22.427053 15.711548 21.955618 15.711548Q21.532644 15.711548 21.127493 15.474243L12.723562 10.581665Q12.248953 10.304077 12.013235 10.02594Q11.777517 9.7478027 11.777517 9.359375Q11.777517 8.9685059 12.013235 8.6915894Q12.248953 8.4146729 12.723562 8.137085L21.127493 3.2445068Q21.532644 3.0072021 21.955618 3.0072021Q22.427053 3.0072021 22.773672 3.3358765Q23.120291 3.6645508 23.120291 4.3227539L23.120291 14.390625ZM11.828909 14.390625Q11.828909 15.051636 11.484976 15.381592Q11.141043 15.711548 10.664236 15.711548Q10.241262 15.711548 9.8361111 15.474243L1.4375515 10.581665Q0.95757103 10.304077 0.72185326 10.02594Q0.48613548 9.7478027 0.48613548 9.359375Q0.48613548 8.9685059 0.72185326 8.6915894Q0.95757103 8.4146729 1.4375515 8.137085L9.8361111 3.2445068Q10.241262 3.0072021 10.664236 3.0072021Q11.141043 3.0072021 11.484976 3.3358765Q11.828909 3.6645508 11.828909 4.3227539L11.828909 14.390625Z"
                    />
                  </svg>
                </div>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-current scale-[2.5] transform origin-center">
                  <svg
                    width="16"
                    height="16"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    fill="currentColor"
                  >
                    <path d="M128 104.3v303.4c0 6.4 6.5 10.4 11.7 7.2l240.5-151.7c5.1-3.2 5.1-11.1 0-14.3L139.7 97.2c-5.2-3.3-11.7.7-11.7 7.1z" />
                  </svg>
                </div>
                <div className="text-current opacity-75 scale-[2] transform origin-center">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 26 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill="currentColor"
                      d="M2.1897488 14.390625L2.1897488 4.3227539Q2.1897488 3.6645508 2.5375881 3.3358765Q2.8854275 3.0072021 3.3569851 3.0072021Q3.7798367 3.0072021 4.184988 3.2445068L12.588919 8.137085Q13.061087 8.4146729 13.296804 8.6915894Q13.532522 8.9685059 13.532522 9.359375Q13.532522 9.7478027 13.296804 10.02594Q13.061087 10.304077 12.588919 10.581665L4.184988 15.474243Q3.7798367 15.711548 3.3569851 15.711548Q2.8854275 15.711548 2.5375881 15.381592Q2.1897488 15.051636 2.1897488 14.390625ZM13.481131 14.390625L13.481131 4.3227539Q13.481131 3.6645508 13.826284 3.3358765Q14.171438 3.0072021 14.648245 3.0072021Q15.071218 3.0072021 15.47637 3.2445068L23.874929 8.137085Q24.352468 8.4146729 24.588186 8.6915894Q24.823904 8.9685059 24.823904 9.359375Q24.823904 9.7478027 24.588186 10.02594Q24.352468 10.304077 23.874929 10.581665L15.47637 15.474243Q15.071218 15.711548 14.648245 15.711548Q14.171438 15.711548 13.826284 15.381592Q13.481131 15.051636 13.481131 14.390625Z"
                    />
                  </svg>
                </div>
              </div>

              <div className="flex items-center opacity-70 text-current">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="currentColor"
                    transform="translate(-9.53674e-07 0)"
                    fillRule="evenodd"
                    d="M0 9.9642096C0 12.6082 1.04041 15.0197 2.72947 16.798C2.90257 16.986601 3.13833 16.9827 3.29866 16.785801L3.79582 16.235901C3.9367399 16.0623 3.9284201 15.882 3.7913799 15.7211C2.38252 14.2057 1.508 12.1787 1.508 9.9642096C1.508 5.3554702 5.3310499 1.52021 9.9642096 1.52021C14.5974 1.52021 18.420401 5.3554702 18.420401 9.9642096C18.420401 12.1749 17.5459 14.2057 16.1409 15.7172C16 15.8781 15.9917 16.058399 16.132601 16.235901L16.629801 16.785801C16.7901 16.978901 17.025801 16.986601 17.1989 16.798C18.888 15.0197 19.9284 12.6082 19.9284 9.9642096C19.9284 4.5021501 15.4629 0 9.9642096 0C4.4655299 0 0 4.5021501 0 9.9642096ZM9.4931402 11.979C9.7367201 11.6988 10.1834 11.6988 10.4353 11.979L16.3528 18.6805C16.6819 19.058399 16.4827 19.602699 15.9628 19.602699L3.9656501 19.602699C3.44575 19.602699 3.2465601 19.058399 3.5755899 18.6805L9.4931402 11.979ZM9.9642096 2.7832C13.9248 2.7832 17.145201 6.0280299 17.145201 9.9642096C17.145201 11.7742 16.474899 13.4128 15.3557 14.6829C15.1826 14.8915 14.9391 14.8831 14.7749 14.6867L14.2655 14.133C14.124 13.9715 14.1368 13.7868 14.266 13.6215C15.1173 12.6388 15.625 11.3647 15.625 9.9642096C15.625 6.8691401 13.0715 4.3034101 9.9642096 4.3034101C6.8569298 4.3034101 4.3034101 6.8691401 4.3034101 9.9642096C4.3034101 11.3609 4.8150401 12.6388 5.6623802 13.6337C5.7877698 13.799 5.80442 13.9799 5.66294 14.1413L5.16189 14.6867C4.9976802 14.8792 4.7458301 14.8915 4.5727301 14.6829C3.4535201 13.4128 2.7832 11.7742 2.7832 9.9642096C2.7832 6.0280299 6.0036101 2.7832 9.9642096 2.7832ZM9.9642096 5.5664101C12.3867 5.5664101 14.362 7.5539098 14.362 9.9642096C14.362 10.9242 14.0501 11.8148 13.5047 12.52C13.3515 12.7602 13.0847 12.7641 12.9044 12.5516L12.379 12.0029C12.2491 11.857 12.2536 11.6916 12.3473 11.5341C12.6603 11.0879 12.8418 10.5424 12.8418 9.9642096C12.8418 8.3950195 11.5334 7.0866199 9.9642096 7.0866199C8.3950195 7.0866199 7.0866199 8.3950195 7.0866199 9.9642096C7.0866199 10.5385 7.2680898 11.0879 7.58108 11.5341C7.67485 11.6916 7.6792998 11.857 7.5494599 12.0029L7.0240002 12.5478C6.8436999 12.7602 6.57688 12.7602 6.4237599 12.5283C5.8782701 11.8064 5.5664101 10.9242 5.5664101 9.9642096C5.5664101 7.5539098 7.5416999 5.5664101 9.9642096 5.5664101Z"
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      }

      if (layout === "compact") {
        return (
          <div
            className={`p-4 flex items-center gap-4 w-full min-h-[90px] ${containerClasses}`}
            style={containerStyle}
          >
            {showCover && (
              <div className="relative shrink-0 w-12 h-12 bg-current/10 animate-pulse rounded-md" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-16 h-4 bg-red-500/20 animate-pulse rounded" />
              </div>
              <div className="w-3/4 h-4 bg-current/10 animate-pulse rounded mb-1.5" />
              <div className="w-1/2 h-3 bg-current/10 animate-pulse rounded" />
            </div>
          </div>
        );
      }

      // Default layout (Vinyl disc)
      return (
        <div
          className={`p-6 flex flex-col md:flex-row items-center gap-6 w-full ${containerClasses}`}
          style={containerStyle}
        >
          {showCover && (
            <div className="relative shrink-0">
              <div className="relative w-32 h-32 rounded-full border-2 border-white/10 bg-current/5 flex items-center justify-center shadow-xl">
                <div className="absolute inset-1 rounded-full border border-white/5 bg-current/5"></div>
                <div className="absolute inset-6 rounded-full border border-dashed border-current/10 animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute w-5 h-5 bg-current/20 rounded-full border-2 border-current/30"></div>
              </div>
            </div>
          )}
          <div className="flex-1 text-center md:text-left min-w-0 w-full flex flex-col items-center md:items-start justify-center">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-24 h-5 bg-current/10 animate-pulse rounded" />
            </div>
            <div className="w-3/4 h-8 bg-current/10 animate-pulse rounded mb-2" />
            <div className="w-1/2 h-5 bg-current/10 animate-pulse rounded" />
          </div>
        </div>
      );
    }

    // List & Grid Skeletons (toptracks, recenttracks, topartists, topalbums)
    const renderSkeletonItems = () => {
      return Array(limit)
        .fill(0)
        .map((_, idx) => {
          if (isGrid || layout === "immersive-grid") {
            if (layout === "immersive-grid") {
              return (
                <div
                  key={idx}
                  className="aspect-square bg-current/10 animate-pulse w-full border border-current/5"
                />
              );
            }
            return (
              <div
                key={idx}
                className={`flex flex-col items-center text-center p-2 rounded ${layout === "carousel" ? "min-w-[130px] snap-center shrink-0" : ""}`}
              >
                {showCover && (
                  <div
                    className={`w-20 h-20 bg-current/10 animate-pulse mb-2 shadow-md ${type === "topartists" ? "rounded-full border border-white/5" : "rounded"}`}
                  />
                )}
                <div className="w-full h-3 bg-current/10 animate-pulse rounded mb-1" />
                <div className="w-2/3 h-2 bg-current/10 animate-pulse rounded mb-2" />
                <div className="w-1/3 h-2 bg-current/10 animate-pulse rounded" />
              </div>
            );
          }

          return (
            <div key={idx} className="flex items-center gap-3 p-2 rounded">
              <span className="font-extrabold text-sm w-5 text-center opacity-75">
                {idx + 1}
              </span>
              {showCover && (
                <div
                  className={`w-10 h-10 shrink-0 bg-current/10 animate-pulse ${type === "topartists" ? "rounded-full border border-white/5" : "rounded"}`}
                />
              )}
              <div
                className={`flex flex-col justify-center flex-1 min-w-0 ml-4`}
              >
                <div className={`w-3/4 h-4 ${skeletonClass} mb-1`} />
                <div className={`w-1/2 h-3 ${skeletonClass}`} />
              </div>
              <div className={`w-12 h-3 ${skeletonClass}`} />
            </div>
          );
        });
    };

    const typeLabels: Record<string, string> = {
      toptracks: "Top Tracks",
      topartists: "Top Artists",
      topalbums: "Top Albums",
      recenttracks: "Recent Tracks",
      lovedtracks: "Loved Tracks",
    };

    const periodLabels: Record<string, string> = {
      "7day": "Last 7 Days",
      "1month": "Last 30 Days",
      "12month": "Last Year",
      overall: "All Time",
    };

    return (
      <div
        className={`p-3 sm:p-5 w-full h-full flex flex-col overflow-hidden ${containerClasses}`}
        style={containerStyle}
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0">
          <h3 className="font-extrabold text-xs sm:text-sm tracking-wider flex items-center gap-2 truncate">
            <Play
              className="w-4 h-4 fill-current text-red-500"
              style={{ color: accentColor }}
            />{" "}
            {typeLabels[type] || "Last.fm"}
          </h3>
          <span className="text-[10px] font-bold opacity-50 uppercase tracking-widest whitespace-nowrap ml-4">
            {type === "recenttracks" || type === "lovedtracks"
              ? ""
              : periodLabels[period] || period}
          </span>
        </div>
        {layout === "list" ? (
          <div className="flex flex-col w-full flex-1 min-h-0 p-2 sm:p-4 overflow-y-auto custom-scrollbar gap-2">
            {renderSkeletonItems()}
          </div>
        ) : layout === "carousel" ? (
          <div className="flex w-full flex-1 min-h-0 p-2 sm:p-4 overflow-x-auto custom-scrollbar gap-3 snap-x snap-mandatory items-stretch pb-6">
            {renderSkeletonItems()}
          </div>
        ) : (
          <div
            className={`grid ${layout === "immersive-grid" ? "gap-0 p-0 content-start auto-rows-max" : "gap-3 p-2 sm:p-4 content-start auto-rows-max"} flex-1 min-h-0 overflow-y-auto custom-scrollbar w-full`}
            style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, max(85px, calc(100% / ${cols} - ${layout === "immersive-grid" ? "0px" : "12px"}))), 1fr))`,
            }}
          >
            {renderSkeletonItems()}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return renderSkeletons();
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-center border border-red-500/20 bg-red-500/10 rounded-lg text-red-400 w-full min-h-[150px]">
        <Radio className="w-6 h-6 mb-2 animate-pulse" />
        <span className="text-sm font-semibold">{error}</span>
      </div>
    );
  }

  // View: Now Playing
  if (type === "nowplaying") {
    const albumCover =
      nowPlaying?.image ||
      "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=250&h=250&fit=crop";

    if (layout === "apple") {
      const itemUrl = getNowPlayingRedirectUrl();
      const duration = 210;
      const progressPercent = Math.min(100, (elapsed / duration) * 100);
      const remaining = duration - elapsed;

      const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? "0" : ""}${s}`;
      };

      const formatRemaining = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `-${m}:${s < 10 ? "0" : ""}${s}`;
      };

      return (
        <div
          className={`p-6 flex flex-col justify-between w-full ${containerClasses} relative select-none rounded-[28px]`}
          style={containerStyle}
        >
          {/* Top row: Art cover, Text metadata, EQ */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center min-w-0 flex-1">
              {showCover && (
                <a
                  href={clickable && username ? itemUrl : undefined}
                  target={clickable && username ? "_blank" : undefined}
                  rel={
                    clickable && username ? "noopener noreferrer" : undefined
                  }
                  className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden shadow-lg border border-white/5 ${clickable && username ? "cursor-pointer hover:opacity-90" : ""}`}
                >
                  <img
                    src={albumCover}
                    alt={nowPlaying?.album || "Album cover"}
                    className="w-full h-full object-cover"
                  />
                </a>
              )}
              <div className="ml-4 min-w-0 flex-1">
                <a
                  href={clickable && username ? itemUrl : undefined}
                  target={clickable && username ? "_blank" : undefined}
                  rel={
                    clickable && username ? "noopener noreferrer" : undefined
                  }
                  className={`font-bold text-[17px] leading-tight tracking-tight block truncate ${clickable && username ? "hover:underline cursor-pointer text-current" : ""}`}
                >
                  {nowPlaying?.name || "Not Playing"}
                </a>
                <p
                  className={`text-sm font-medium truncate mt-1 ${textClass} opacity-80`}
                >
                  {nowPlaying?.artist || "Unknown Artist"}
                </p>
              </div>
            </div>

            {/* Equalizer animation */}
            {isPlaying && !isPaused && animated ? (
              <div className="flex items-end gap-[3px] h-[18px] px-1 shrink-0 ml-3 mb-1">
                <span
                  className="w-[3px] h-3 rounded-full animate-[equalizer_0.8s_ease-in-out_infinite_alternate]"
                  style={{ backgroundColor: accentColor }}
                ></span>
                <span
                  className="w-[3px] h-[18px] rounded-full animate-[equalizer_1.2s_ease-in-out_infinite_alternate_0.2s]"
                  style={{ backgroundColor: accentColor }}
                ></span>
                <span
                  className="w-[3px] h-2 rounded-full animate-[equalizer_1s_ease-in-out_infinite_alternate_0.4s]"
                  style={{ backgroundColor: accentColor }}
                ></span>
              </div>
            ) : (
              <div className="flex items-end gap-[3px] h-[18px] px-1 shrink-0 ml-3 mb-1 opacity-40">
                <span
                  className="w-[3px] h-2.5 rounded-full"
                  style={{ backgroundColor: accentColor }}
                ></span>
                <span
                  className="w-[3px] h-4 rounded-full"
                  style={{ backgroundColor: accentColor }}
                ></span>
                <span
                  className="w-[3px] h-1.5 rounded-full"
                  style={{ backgroundColor: accentColor }}
                ></span>
              </div>
            )}
          </div>

          {/* Middle row: Progress slider & Duration text labels */}
          <div className="w-full mt-4">
            <div className="w-full h-[3.5px] rounded-full relative overflow-hidden bg-current opacity-15"></div>
            <div className="mt-[-3.5px] w-full h-[3.5px] rounded-full relative overflow-hidden bg-transparent">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: isPlaying ? `${progressPercent}%` : "0%",
                  backgroundColor: accentColor,
                }}
              />
            </div>

            <div
              className={`flex justify-between items-center w-full mt-1.5 text-[10px] font-medium tracking-wider ${textClass} opacity-60`}
            >
              {isPlaying ? (
                <>
                  <span>{formatTime(elapsed)}</span>
                  <span>{formatRemaining(remaining)}</span>
                </>
              ) : (
                <>
                  <span>Last Played</span>
                  <span className="text-[9px] font-medium">
                    {nowPlaying?.date || "Recently"}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Bottom row: Media Controls */}
          <div className="flex justify-between items-center w-full px-1 mt-2">
            {/* Heart */}
            <div
              className={`p-1 ${nowPlaying?.loved ? "opacity-100" : "opacity-70"} text-current`}
              title={nowPlaying?.loved ? `Liked by ${username}` : undefined}
            >
              <Heart
                className="w-4.5 h-4.5"
                style={{
                  fill: nowPlaying?.loved ? accentColor : "transparent",
                  color: nowPlaying?.loved ? accentColor : "currentColor",
                }}
              />
            </div>

            {/* Media controls group */}
            <div className="flex items-center gap-6 sm:gap-8">
              {/* Prev Button */}
              <div className="text-current opacity-30 scale-[2] transform origin-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 26 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="currentColor"
                    d="M23.120291 14.390625Q23.120291 15.051636 22.773672 15.381592Q22.427053 15.711548 21.955618 15.711548Q21.532644 15.711548 21.127493 15.474243L12.723562 10.581665Q12.248953 10.304077 12.013235 10.02594Q11.777517 9.7478027 11.777517 9.359375Q11.777517 8.9685059 12.013235 8.6915894Q12.248953 8.4146729 12.723562 8.137085L21.127493 3.2445068Q21.532644 3.0072021 21.955618 3.0072021Q22.427053 3.0072021 22.773672 3.3358765Q23.120291 3.6645508 23.120291 4.3227539L23.120291 14.390625ZM11.828909 14.390625Q11.828909 15.051636 11.484976 15.381592Q11.141043 15.711548 10.664236 15.711548Q10.241262 15.711548 9.8361111 15.474243L1.4375515 10.581665Q0.95757103 10.304077 0.72185326 10.02594Q0.48613548 9.7478027 0.48613548 9.359375Q0.48613548 8.9685059 0.72185326 8.6915894Q0.95757103 8.4146729 1.4375515 8.137085L9.8361111 3.2445068Q10.241262 3.0072021 10.664236 3.0072021Q11.141043 3.0072021 11.484976 3.3358765Q11.828909 3.6645508 11.828909 4.3227539L11.828909 14.390625Z"
                  />
                </svg>
              </div>

              {/* Play/Pause Button */}
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-current scale-[2.5] transform origin-center">
                {isPlaying ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 30"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill="currentColor"
                      d="M5.2159152 25.857758Q4.2902789 25.857758 3.8349948 25.39246Q3.3797107 24.927162 3.3797107 24.013161L3.3797107 6.3514938Q3.3797107 5.4376831 3.8408122 4.9764862Q4.3019137 4.5152893 5.2159152 4.5152893L8.1419783 4.5152893Q9.0437727 4.5152893 9.5090704 4.9697151Q9.9743681 5.4241409 9.9743681 6.3514938L9.9743681 24.013161Q9.9743681 24.927162 9.5090704 25.39246Q9.0437727 25.857758 8.1419783 25.857758L5.2159152 25.857758ZM14.732059 25.857758Q13.810428 25.857758 13.348945 25.39246Q12.887462 24.927162 12.887462 24.013161L12.887462 6.3514938Q12.887462 5.4376831 13.352759 4.9764862Q13.818057 4.5152893 14.732059 4.5152893L17.649921 4.5152893Q18.563732 4.5152893 19.024834 4.9697151Q19.485935 5.4241409 19.485935 6.3514938L19.485935 24.013161Q19.485935 24.927162 19.024834 25.39246Q18.563732 25.857758 17.649921 25.857758L14.732059 25.857758Z"
                    />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    fill="currentColor"
                  >
                    <path d="M128 104.3v303.4c0 6.4 6.5 10.4 11.7 7.2l240.5-151.7c5.1-3.2 5.1-11.1 0-14.3L139.7 97.2c-5.2-3.3-11.7.7-11.7 7.1z" />
                  </svg>
                )}
              </div>

              {/* Next Button */}
              <div className="text-current opacity-75 scale-[2] transform origin-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 26 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill="currentColor"
                    d="M2.1897488 14.390625L2.1897488 4.3227539Q2.1897488 3.6645508 2.5375881 3.3358765Q2.8854275 3.0072021 3.3569851 3.0072021Q3.7798367 3.0072021 4.184988 3.2445068L12.588919 8.137085Q13.061087 8.4146729 13.296804 8.6915894Q13.532522 8.9685059 13.532522 9.359375Q13.532522 9.7478027 13.296804 10.02594Q13.061087 10.304077 12.588919 10.581665L4.184988 15.474243Q3.7798367 15.711548 3.3569851 15.711548Q2.8854275 15.711548 2.5375881 15.381592Q2.1897488 15.051636 2.1897488 14.390625ZM13.481131 14.390625L13.481131 4.3227539Q13.481131 3.6645508 13.826284 3.3358765Q14.171438 3.0072021 14.648245 3.0072021Q15.071218 3.0072021 15.47637 3.2445068L23.874929 8.137085Q24.352468 8.4146729 24.588186 8.6915894Q24.823904 8.9685059 24.823904 9.359375Q24.823904 9.7478027 24.588186 10.02594Q24.352468 10.304077 23.874929 10.581665L15.47637 15.474243Q15.071218 15.711548 14.648245 15.711548Q14.171438 15.711548 13.826284 15.381592Q13.481131 15.051636 13.481131 14.390625Z"
                  />
                </svg>
              </div>
            </div>

            {/* AirPlay Icon only */}
            <div className="flex items-center opacity-70 text-current">
              <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="currentColor"
                  transform="translate(-9.53674e-07 0)"
                  fillRule="evenodd"
                  d="M0 9.9642096C0 12.6082 1.04041 15.0197 2.72947 16.798C2.90257 16.986601 3.13833 16.9827 3.29866 16.785801L3.79582 16.235901C3.9367399 16.0623 3.9284201 15.882 3.7913799 15.7211C2.38252 14.2057 1.508 12.1787 1.508 9.9642096C1.508 5.3554702 5.3310499 1.52021 9.9642096 1.52021C14.5974 1.52021 18.420401 5.3554702 18.420401 9.9642096C18.420401 12.1749 17.5459 14.2057 16.1409 15.7172C16 15.8781 15.9917 16.058399 16.132601 16.235901L16.629801 16.785801C16.7901 16.978901 17.025801 16.986601 17.1989 16.798C18.888 15.0197 19.9284 12.6082 19.9284 9.9642096C19.9284 4.5021501 15.4629 0 9.9642096 0C4.4655299 0 0 4.5021501 0 9.9642096ZM9.4931402 11.979C9.7367201 11.6988 10.1834 11.6988 10.4353 11.979L16.3528 18.6805C16.6819 19.058399 16.4827 19.602699 15.9628 19.602699L3.9656501 19.602699C3.44575 19.602699 3.2465601 19.058399 3.5755899 18.6805L9.4931402 11.979ZM9.9642096 2.7832C13.9248 2.7832 17.145201 6.0280299 17.145201 9.9642096C17.145201 11.7742 16.474899 13.4128 15.3557 14.6829C15.1826 14.8915 14.9391 14.8831 14.7749 14.6867L14.2655 14.133C14.124 13.9715 14.1368 13.7868 14.266 13.6215C15.1173 12.6388 15.625 11.3647 15.625 9.9642096C15.625 6.8691401 13.0715 4.3034101 9.9642096 4.3034101C6.8569298 4.3034101 4.3034101 6.8691401 4.3034101 9.9642096C4.3034101 11.3609 4.8150401 12.6388 5.6623802 13.6337C5.7877698 13.799 5.80442 13.9799 5.66294 14.1413L5.16189 14.6867C4.9976802 14.8792 4.7458301 14.8915 4.5727301 14.6829C3.4535201 13.4128 2.7832 11.7742 2.7832 9.9642096C2.7832 6.0280299 6.0036101 2.7832 9.9642096 2.7832ZM9.9642096 5.5664101C12.3867 5.5664101 14.362 7.5539098 14.362 9.9642096C14.362 10.9242 14.0501 11.8148 13.5047 12.52C13.3515 12.7602 13.0847 12.7641 12.9044 12.5516L12.379 12.0029C12.2491 11.857 12.2536 11.6916 12.3473 11.5341C12.6603 11.0879 12.8418 10.5424 12.8418 9.9642096C12.8418 8.3950195 11.5334 7.0866199 9.9642096 7.0866199C8.3950195 7.0866199 7.0866199 8.3950195 7.0866199 9.9642096C7.0866199 10.5385 7.2680898 11.0879 7.58108 11.5341C7.67485 11.6916 7.6792998 11.857 7.5494599 12.0029L7.0240002 12.5478C6.8436999 12.7602 6.57688 12.7602 6.4237599 12.5283C5.8782701 11.8064 5.5664101 10.9242 5.5664101 9.9642096C5.5664101 7.5539098 7.5416999 5.5664101 9.9642096 5.5664101Z"
                />
              </svg>
            </div>
          </div>
        </div>
      );
    }

    if (layout === "compact") {
      const itemUrl = getNowPlayingRedirectUrl();
      const ContainerTag = clickable && username ? "a" : "div";
      return (
        <ContainerTag
          href={clickable && username ? itemUrl : undefined}
          target={clickable && username ? "_blank" : undefined}
          rel={clickable && username ? "noopener noreferrer" : undefined}
          className={`p-4 flex items-center gap-4 w-full min-h-[90px] ${containerClasses} ${clickable && username ? "cursor-pointer hover:opacity-95 no-underline" : ""}`}
          style={containerStyle}
        >
          {showCover && (
            <div className="relative shrink-0 w-12 h-12">
              <img
                src={albumCover}
                alt={nowPlaying?.album || "Album cover"}
                className={`w-full h-full object-cover shadow-md ${isPlaying && animated ? "rounded-full animate-[spin_10s_linear_infinite]" : "rounded-md"}`}
              />
              {isPlaying && animated && (
                <div className="absolute inset-0 m-auto w-3 h-3 bg-zinc-950 rounded-full border border-white/40"></div>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-500 text-white animate-pulse">
                {isPlaying ? "PLAYING" : "RECENTLY"}
              </span>
            </div>
            <h4 className="font-bold text-sm truncate leading-tight mt-1">
              {nowPlaying?.name || "No Track playing"}
            </h4>
            <p className={`text-xs truncate ${textClass}`}>
              {nowPlaying?.artist || "Unknown Artist"}
            </p>
          </div>
        </ContainerTag>
      );
    }

    const itemUrl = getNowPlayingRedirectUrl();
    const ContainerTag = clickable && username ? "a" : "div";
    return (
      <ContainerTag
        href={clickable && username ? itemUrl : undefined}
        target={clickable && username ? "_blank" : undefined}
        rel={clickable && username ? "noopener noreferrer" : undefined}
        className={`p-6 flex flex-col md:flex-row items-center gap-6 w-full ${containerClasses} ${clickable && username ? "cursor-pointer hover:opacity-95 no-underline" : ""}`}
        style={containerStyle}
      >
        {/* Vinyl / Cover disc effect */}
        <div className="relative shrink-0 group">
          {isPlaying && animated && (
            <div className="absolute inset-0 w-32 h-32 rounded-full border-4 border-dashed border-red-500/30 animate-[spin_30s_linear_infinite] pointer-events-none scale-110"></div>
          )}
          <div className="relative w-32 h-32 shadow-2xl overflow-hidden rounded-full border-2 border-white/10 bg-black/40 flex items-center justify-center">
            {/* Spinning vinyl record background */}
            <div className="absolute inset-1 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center">
              <div className="absolute inset-6 rounded-full border border-dashed border-zinc-700"></div>
              <div className="absolute inset-10 rounded-full border border-zinc-800"></div>
            </div>
            {showCover && (
              <img
                src={albumCover}
                alt={nowPlaying?.album || "Album cover"}
                className={`absolute w-[76%] h-[76%] object-cover rounded-full shadow-inner ${isPlaying && animated ? "animate-[spin_8s_linear_infinite]" : ""}`}
              />
            )}
            {/* Vinyl record center hole */}
            <div className="absolute w-5 h-5 bg-zinc-950 rounded-full border-2 border-white/20 flex items-center justify-center z-10">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left min-w-0 w-full">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <span
              className="text-xs uppercase font-extrabold tracking-widest px-2 py-0.5 rounded shadow-sm text-white"
              style={{ backgroundColor: accentColor }}
            >
              {isPlaying ? "NOW PLAYING" : "LAST PLAYED"}
            </span>
            {isPlaying && animated && (
              <div className="flex items-end gap-[3px] h-3.5 px-1">
                <span className="w-[3px] h-2 bg-red-500 rounded-full animate-[equalizer_0.8s_ease-in-out_infinite_alternate]"></span>
                <span className="w-[3px] h-3.5 bg-red-500 rounded-full animate-[equalizer_1.2s_ease-in-out_infinite_alternate_0.2s]"></span>
                <span className="w-[3px] h-1.5 bg-red-500 rounded-full animate-[equalizer_1s_ease-in-out_infinite_alternate_0.4s]"></span>
                <span className="w-[3px] h-3 bg-red-500 rounded-full animate-[equalizer_0.9s_ease-in-out_infinite_alternate_0.1s]"></span>
              </div>
            )}
          </div>

          <h3 className="font-extrabold text-lg md:text-xl truncate leading-tight tracking-tight">
            {nowPlaying?.name || "Nothing listening to right now"}
          </h3>
          <p
            className={`text-sm md:text-base font-semibold mt-1 truncate ${textClass}`}
          >
            by {nowPlaying?.artist || "Unknown Artist"}
          </p>
          {nowPlaying?.album && (
            <p
              className={`text-xs mt-1 truncate italic opacity-85 ${textClass}`}
            >
              Album: {nowPlaying.album}
            </p>
          )}
          {!isPlaying && nowPlaying?.date && (
            <p
              className={`text-[10px] mt-2 opacity-60 font-semibold ${textClass}`}
            >
              Played: {nowPlaying.date}
            </p>
          )}
        </div>
      </ContainerTag>
    );
  }

  if (type === "userprofile") {
    if (!userProfile) return null;
    return (
      <div
        className={`p-6 w-full ${containerClasses} animate-in fade-in zoom-in-95 duration-500`}
        style={containerStyle}
      >
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <div
              className="absolute -inset-1 rounded-full opacity-30 blur-lg"
              style={{ backgroundColor: accentColor }}
            ></div>
            <img
              src={
                userProfile.image ||
                "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=250&h=250&fit=crop"
              }
              alt={userProfile.name}
              className="relative w-28 h-28 rounded-full object-cover border-4 border-current/10 shadow-xl"
            />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-black mb-1">
              {userProfile.realname || userProfile.name}
            </h2>
            <a
              href={userProfile.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-sm font-semibold hover:underline flex items-center justify-center md:justify-start gap-1 opacity-80 ${textClass}`}
            >
              <User className="w-4 h-4" /> @{userProfile.name}
            </a>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
              <div className="bg-current/5 px-4 py-2 rounded-xl text-center">
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">
                  Scrobbles
                </p>
                <p
                  className="text-lg font-black"
                  style={{ color: accentColor }}
                >
                  {userProfile.playcount.toLocaleString()}
                </p>
              </div>
              <div className="bg-current/5 px-4 py-2 rounded-xl text-center">
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">
                  Country
                </p>
                <p className="text-lg font-black">
                  {userProfile.country || "-"}
                </p>
              </div>
              {userProfile.registered && (
                <div className="bg-current/5 px-4 py-2 rounded-xl text-center hidden sm:block">
                  <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">
                    Joined
                  </p>
                  <p className="text-sm font-bold mt-1">
                    {userProfile.registered}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "topgenres") {
    return (
      <div
        className={`w-full h-full flex flex-wrap content-start items-center gap-2 p-6 justify-center overflow-y-auto custom-scrollbar ${containerClasses}`}
        style={containerStyle}
      >
        {topTags.map((tag, idx) => (
          <div
            key={idx}
            className="px-4 py-2 rounded-full border border-current/10 shadow-sm animate-in fade-in zoom-in-95 duration-500 hover:scale-[1.02] transition-transform"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <span className="font-extrabold text-sm uppercase tracking-wide">
              #{tag.name}
            </span>
            <span className={`ml-2 text-xs opacity-60 ${textClass}`}>
              ({tag.count})
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (type === "weeklystats") {
    const maxPlaycount = Math.max(...weeklyStats.map((s) => s.playcount), 1);
    return (
      <div
        className={`w-full flex flex-col p-6 overflow-hidden ${containerClasses}`}
        style={containerStyle}
      >
        <h3 className="font-extrabold text-lg flex items-center gap-2 shrink-0 pb-3 mb-3 border-b border-white/10">
          <Music className="w-5 h-5" style={{ color: accentColor }} /> Weekly
          Top
        </h3>
        <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
          {weeklyStats.map((stat, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 animate-in fade-in zoom-in-95 duration-500"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-sm overflow-hidden shrink-0 shadow">
                <img
                  src={stat.image}
                  alt={stat.artist}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-end mb-1">
                  <div className="truncate pr-4">
                    <p className="font-bold text-sm truncate">{stat.name}</p>
                    <p className={`text-xs opacity-80 truncate ${textClass}`}>
                      {stat.artist}
                    </p>
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{ color: accentColor }}
                  >
                    {stat.playcount}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-current/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: showBars
                        ? `${(stat.playcount / maxPlaycount) * 100}%`
                        : "0%",
                      backgroundColor: accentColor,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Views for Top Stats (Tracks, Artists, Albums, etc)
  const renderItems = () => {
    const isGrid = layout === "grid" || layout === "carousel";

    if (
      type === "toptracks" ||
      type === "recenttracks" ||
      type === "lovedtracks"
    ) {
      return tracks.map((track, idx) => {
        const itemUrl = getRedirectUrl(track);
        const RowTag = clickable && username ? "a" : "div";
        if (layout === "immersive-grid") {
          return (
            <RowTag
              key={idx}
              href={clickable && username ? itemUrl : undefined}
              target={clickable && username ? "_blank" : undefined}
              rel={clickable && username ? "noopener noreferrer" : undefined}
              className={`group relative aspect-square w-full overflow-hidden block ${clickable && username ? "cursor-pointer" : ""}`}
            >
              {track.image ? (
                <img
                  src={track.image}
                  alt={track.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <Music className="w-8 h-8 opacity-60" />
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 sm:p-3 z-10">
                <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-tight">
                  {track.name}
                </h4>
                <p className="text-[10px] sm:text-xs mt-0.5 text-white/80 truncate">
                  {track.artist}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  {showPlaycount && (
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: accentColor }}
                    >
                      {type === "recenttracks"
                        ? formatRelativeTime(track.uts, track.date)
                        : type === "lovedtracks"
                          ? "Loved"
                          : getScrobbleText(track.plays || 0)}
                    </span>
                  )}
                  {showLoved && track.loved && (
                    <Heart
                      className="w-3.5 h-3.5 fill-current text-red-500"
                      style={{ color: accentColor }}
                    />
                  )}
                </div>
              </div>
            </RowTag>
          );
        }
        if (isGrid) {
          return (
            <RowTag
              key={idx}
              href={clickable && username ? itemUrl : undefined}
              target={clickable && username ? "_blank" : undefined}
              rel={clickable && username ? "noopener noreferrer" : undefined}
              className={`group flex flex-col items-center text-center p-2 rounded hover:bg-white/5 transition-all no-underline ${clickable && username ? "cursor-pointer hover:opacity-95" : ""} ${layout === "carousel" ? "min-w-[130px] snap-center shrink-0" : ""}`}
            >
              {showCover && (
                <div className="w-20 h-20 bg-white/10 rounded-lg shrink-0 overflow-hidden flex items-center justify-center shadow-md relative">
                  {track.image ? (
                    <img
                      src={track.image}
                      alt={track.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <Music className="w-8 h-8 opacity-60" />
                  )}
                  {track.previewUrl && (
                    <button
                      onClick={(e) => togglePreview(track.previewUrl!, e)}
                      className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity z-10 cursor-pointer ${
                        playingPreview === track.previewUrl
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {playingPreview === track.previewUrl ? (
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 30"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          className="text-white animate-pulse"
                        >
                          <path d="M5.2159152 25.857758Q4.2902789 25.857758 3.8349948 25.39246Q3.3797107 24.927162 3.3797107 24.013161L3.3797107 6.3514938Q3.3797107 5.4376831 3.8408122 4.9764862Q4.3019137 4.5152893 5.2159152 4.5152893L8.1419783 4.5152893Q9.0437727 4.5152893 9.5090704 4.9697151Q9.9743681 5.4241409 9.9743681 6.3514938L9.9743681 24.013161Q9.9743681 24.927162 9.5090704 25.39246Q9.0437727 25.857758 8.1419783 25.857758L5.2159152 25.857758ZM14.732059 25.857758Q13.810428 25.857758 13.348945 25.39246Q12.887462 24.927162 12.887462 24.013161L12.887462 6.3514938Q12.887462 5.4376831 13.352759 4.9764862Q13.818057 4.5152893 14.732059 4.5152893L17.649921 4.5152893Q18.563732 4.5152893 19.024834 4.9697151Q19.485935 5.4241409 19.485935 6.3514938L19.485935 24.013161Q19.485935 24.927162 19.024834 25.39246Q18.563732 25.857758 17.649921 25.857758L14.732059 25.857758Z" />
                        </svg>
                      ) : (
                        <svg
                          width="32"
                          height="32"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 512 512"
                          fill="currentColor"
                          className="text-white"
                        >
                          <path d="M128 104.3v303.4c0 6.4 6.5 10.4 11.7 7.2l240.5-151.7c5.1-3.2 5.1-11.1 0-14.3L139.7 97.2c-5.2-3.3-11.7.7-11.7 7.1z" />
                        </svg>
                      )}
                    </button>
                  )}
                  {showLoved && track.loved && (
                    <div
                      className="absolute right-1 bottom-1 bg-black/60 p-0.5 rounded-full backdrop-blur-sm border border-white/10 flex items-center justify-center cursor-help z-10"
                      title={`Liked by ${username}`}
                    >
                      <Heart
                        className="w-3 h-3 fill-current text-red-500"
                        style={{ color: accentColor }}
                      />
                    </div>
                  )}
                </div>
              )}
              <h4 className="font-bold text-xs mt-2.5 w-full line-clamp-2 leading-snug">
                {track.name}
              </h4>
              <p
                className={`text-[10px] mt-1 w-full truncate opacity-80 ${textClass}`}
              >
                {track.artist}
              </p>
              {showPlaycount && (
                <span
                  className="text-[10px] font-semibold mt-2.5 opacity-90 flex items-center justify-center"
                  style={{ color: accentColor }}
                >
                  {type === "recenttracks" ? (
                    <span title={track.date} className="cursor-help">
                      {formatRelativeTime(track.uts, track.date)}
                    </span>
                  ) : type === "lovedtracks" ? (
                    <span
                      className="flex items-center gap-1 cursor-help"
                      title={track.date}
                    >
                      <Heart className="w-3 h-3 fill-current text-red-500" />{" "}
                      {formatRelativeTime(track.uts, track.date) || "Loved"}
                    </span>
                  ) : (
                    getScrobbleText(track.plays || 0)
                  )}
                </span>
              )}
            </RowTag>
          );
        }

        return (
          <RowTag
            key={idx}
            href={clickable && username ? itemUrl : undefined}
            target={clickable && username ? "_blank" : undefined}
            rel={clickable && username ? "noopener noreferrer" : undefined}
            className={`group flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-all no-underline ${clickable && username ? "cursor-pointer hover:opacity-95" : ""}`}
          >
            <span className="font-extrabold text-sm w-5 text-center opacity-75">
              {idx + 1}
            </span>
            {showCover && (
              <div className="w-10 h-10 bg-white/10 rounded shrink-0 overflow-hidden flex items-center justify-center relative">
                {track.image ? (
                  <img
                    src={track.image}
                    alt={track.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="w-4 h-4" />
                )}
                {track.previewUrl && (
                  <button
                    onClick={(e) => togglePreview(track.previewUrl!, e)}
                    className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity z-10 cursor-pointer ${
                      playingPreview === track.previewUrl
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {playingPreview === track.previewUrl ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 30"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        className="text-white animate-pulse"
                      >
                        <path d="M5.2159152 25.857758Q4.2902789 25.857758 3.8349948 25.39246Q3.3797107 24.927162 3.3797107 24.013161L3.3797107 6.3514938Q3.3797107 5.4376831 3.8408122 4.9764862Q4.3019137 4.5152893 5.2159152 4.5152893L8.1419783 4.5152893Q9.0437727 4.5152893 9.5090704 4.9697151Q9.9743681 5.4241409 9.9743681 6.3514938L9.9743681 24.013161Q9.9743681 24.927162 9.5090704 25.39246Q9.0437727 25.857758 8.1419783 25.857758L5.2159152 25.857758ZM14.732059 25.857758Q13.810428 25.857758 13.348945 25.39246Q12.887462 24.927162 12.887462 24.013161L12.887462 6.3514938Q12.887462 5.4376831 13.352759 4.9764862Q13.818057 4.5152893 14.732059 4.5152893L17.649921 4.5152893Q18.563732 4.5152893 19.024834 4.9697151Q19.485935 5.4241409 19.485935 6.3514938L19.485935 24.013161Q19.485935 24.927162 19.024834 25.39246Q18.563732 25.857758 17.649921 25.857758L14.732059 25.857758Z" />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 512 512"
                        fill="currentColor"
                        className="text-white"
                      >
                        <path d="M128 104.3v303.4c0 6.4 6.5 10.4 11.7 7.2l240.5-151.7c5.1-3.2 5.1-11.1 0-14.3L139.7 97.2c-5.2-3.3-11.7.7-11.7 7.1z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs truncate leading-snug">
                {track.name}
              </h4>
              <p className={`text-[10px] truncate ${textClass}`}>
                {track.artist}
              </p>
            </div>
            <div className="text-right flex items-center gap-1.5 justify-end">
              {showLoved && track.loved && (
                <span title={`Liked by ${username}`}>
                  <Heart
                    className="w-3.5 h-3.5 fill-current text-red-500 cursor-help"
                    style={{ color: accentColor }}
                  />
                </span>
              )}
              {showPlaycount && (
                <span className="text-[10px] font-semibold opacity-75 flex items-center">
                  {type === "recenttracks" ? (
                    <span title={track.date} className="cursor-help">
                      {formatRelativeTime(track.uts, track.date)}
                    </span>
                  ) : type === "lovedtracks" ? (
                    <span
                      className="flex items-center gap-1 cursor-help"
                      title={track.date}
                    >
                      {formatRelativeTime(track.uts, track.date) || "Loved"}
                    </span>
                  ) : (
                    getScrobbleText(track.plays || 0)
                  )}
                </span>
              )}
            </div>
          </RowTag>
        );
      });
    }

    if (type === "topartists") {
      return artists.map((artist, idx) => {
        const itemUrl = getArtistRedirectUrl(artist.name);
        const RowTag = clickable && username ? "a" : "div";
        if (layout === "immersive-grid") {
          return (
            <RowTag
              key={idx}
              href={clickable && username ? itemUrl : undefined}
              target={clickable && username ? "_blank" : undefined}
              rel={clickable && username ? "noopener noreferrer" : undefined}
              className={`group relative aspect-square w-full overflow-hidden block ${clickable && username ? "cursor-pointer" : ""}`}
            >
              {artist.image ? (
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <User className="w-8 h-8 opacity-60" />
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 sm:p-3 z-10">
                <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-tight">
                  {artist.name}
                </h4>
                <div className="flex items-center justify-between mt-1.5">
                  {showPlaycount && (
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: accentColor }}
                    >
                      {getScrobbleText(artist.playcount)}
                    </span>
                  )}
                </div>
              </div>
            </RowTag>
          );
        }
        if (isGrid) {
          return (
            <RowTag
              key={idx}
              href={clickable && username ? itemUrl : undefined}
              target={clickable && username ? "_blank" : undefined}
              rel={clickable && username ? "noopener noreferrer" : undefined}
              className={`group flex flex-col items-center text-center p-2 rounded hover:bg-white/5 transition-all no-underline ${clickable && username ? "cursor-pointer hover:opacity-95" : ""} ${layout === "carousel" ? "min-w-[130px] snap-center shrink-0" : ""}`}
            >
              {showCover && (
                <div className="w-20 h-20 bg-white/10 rounded-full shrink-0 overflow-hidden flex items-center justify-center border border-white/5 shadow-md">
                  {artist.image ? (
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 opacity-60" />
                  )}
                </div>
              )}
              <h4 className="font-bold text-xs mt-2.5 w-full line-clamp-2 leading-snug">
                {artist.name}
              </h4>
              {showPlaycount && (
                <span
                  className="text-[10px] font-semibold mt-2.5 opacity-90"
                  style={{ color: accentColor }}
                >
                  {getScrobbleText(artist.playcount)}
                </span>
              )}
            </RowTag>
          );
        }

        return (
          <RowTag
            key={idx}
            href={clickable && username ? itemUrl : undefined}
            target={clickable && username ? "_blank" : undefined}
            rel={clickable && username ? "noopener noreferrer" : undefined}
            className={`flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-all no-underline ${clickable && username ? "cursor-pointer hover:opacity-95" : ""}`}
          >
            <span className="font-extrabold text-sm w-5 text-center opacity-75">
              {idx + 1}
            </span>
            {showCover && (
              <div className="w-10 h-10 bg-white/10 rounded-full shrink-0 overflow-hidden flex items-center justify-center border border-white/5">
                {artist.image ? (
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs truncate leading-snug">
                {artist.name}
              </h4>
            </div>
            <div className="text-right">
              {showPlaycount && (
                <span className="text-[10px] font-semibold opacity-75">
                  {getScrobbleText(artist.playcount)}
                </span>
              )}
            </div>
          </RowTag>
        );
      });
    }

    if (type === "topalbums") {
      return albums.map((album, idx) => {
        const itemUrl = getAlbumRedirectUrl(album.artist, album.name);
        const RowTag = clickable && username ? "a" : "div";
        if (layout === "immersive-grid") {
          return (
            <RowTag
              key={idx}
              href={clickable && username ? itemUrl : undefined}
              target={clickable && username ? "_blank" : undefined}
              rel={clickable && username ? "noopener noreferrer" : undefined}
              className={`group relative aspect-square w-full overflow-hidden block ${clickable && username ? "cursor-pointer" : ""}`}
            >
              {album.image ? (
                <img
                  src={album.image}
                  alt={album.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <Disc className="w-8 h-8 opacity-60" />
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 sm:p-3 z-10">
                <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-tight">
                  {album.name}
                </h4>
                <p className="text-[10px] sm:text-xs mt-0.5 text-white/80 truncate">
                  {album.artist}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: accentColor }}
                  >
                    {getScrobbleText(album.playcount)}
                  </span>
                </div>
              </div>
            </RowTag>
          );
        }
        if (isGrid) {
          return (
            <RowTag
              key={idx}
              href={clickable && username ? itemUrl : undefined}
              target={clickable && username ? "_blank" : undefined}
              rel={clickable && username ? "noopener noreferrer" : undefined}
              className={`group flex flex-col items-center text-center p-2 rounded hover:bg-white/5 transition-all no-underline ${clickable && username ? "cursor-pointer hover:opacity-95" : ""} ${layout === "carousel" ? "min-w-[130px] snap-center shrink-0" : ""}`}
            >
              {showCover && (
                <div className="w-20 h-20 bg-white/10 rounded-lg shrink-0 overflow-hidden flex items-center justify-center shadow-md">
                  {album.image ? (
                    <img
                      src={album.image}
                      alt={album.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Disc className="w-8 h-8 opacity-60" />
                  )}
                </div>
              )}
              <h4 className="font-bold text-xs mt-2.5 w-full line-clamp-2 leading-snug">
                {album.name}
              </h4>
              <p
                className={`text-[10px] mt-1 w-full truncate opacity-80 ${textClass}`}
              >
                {album.artist}
              </p>
              {showPlaycount && (
                <span
                  className="text-[10px] font-semibold mt-2.5 opacity-90"
                  style={{ color: accentColor }}
                >
                  {getScrobbleText(album.playcount)}
                </span>
              )}
            </RowTag>
          );
        }

        return (
          <RowTag
            key={idx}
            href={clickable && username ? itemUrl : undefined}
            target={clickable && username ? "_blank" : undefined}
            rel={clickable && username ? "noopener noreferrer" : undefined}
            className={`flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-all no-underline ${clickable && username ? "cursor-pointer hover:opacity-95" : ""}`}
          >
            <span className="font-extrabold text-sm w-5 text-center opacity-75">
              {idx + 1}
            </span>
            {showCover && (
              <div className="w-10 h-10 bg-white/10 rounded shrink-0 overflow-hidden flex items-center justify-center">
                {album.image ? (
                  <img
                    src={album.image}
                    alt={album.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Disc className="w-4 h-4" />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs truncate leading-snug">
                {album.name}
              </h4>
              <p className={`text-[10px] truncate ${textClass}`}>
                {album.artist}
              </p>
            </div>
            <div className="text-right">
              {showPlaycount && (
                <span className="text-[10px] font-semibold opacity-75">
                  {getScrobbleText(album.playcount)}
                </span>
              )}
            </div>
          </RowTag>
        );
      });
    }

    return null;
  };

  const itemsToRender =
    layout === "carousel" && autoScroll
      ? [...(renderItems() || []), ...(renderItems() || [])].map((el, i) => (
          <div key={`dup-${i}`} className="shrink-0">
            {el}
          </div>
        ))
      : renderItems();

  const periodLabels: Record<string, string> = {
    "7day": "Last 7 Days",
    "1month": "Last 30 Days",
    "12month": "Last Year",
    overall: "All Time",
  };

  const typeLabels: Record<string, string> = {
    toptracks: "Top Tracks",
    topartists: "Top Artists",
    topalbums: "Top Albums",
    recenttracks: "Recent Tracks",
    lovedtracks: "Loved Tracks",
  };

  return (
    <div
      className={`p-3 sm:p-5 w-full h-full flex flex-col overflow-hidden ${containerClasses}`}
      style={containerStyle}
    >
      <style>{getScrollbarCSS()}</style>
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0">
        <h3 className="font-extrabold text-xs sm:text-sm tracking-wider flex items-center gap-2 truncate">
          <Play
            className="w-4 h-4 fill-current text-red-500"
            style={{ color: accentColor }}
          />
          <span className="truncate">
            {showUsername ? (
              <>
                <a
                  href={`https://www.last.fm/user/${username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lowercase hover:underline"
                  style={{ color: accentColor }}
                >
                  {username.toLowerCase()}
                </a>
                <span>'s {typeLabels[type]}</span>
              </>
            ) : (
              typeLabels[type]
            )}
          </span>
        </h3>
        <span
          className={`text-[10px] px-2 py-0.5 bg-white/5 rounded-full ${textClass}`}
        >
          {periodLabels[period]}
        </span>
      </div>
      {layout === "list" ? (
        <div className="flex flex-col w-full flex-1 min-h-0 p-2 sm:p-4 overflow-y-auto custom-scrollbar gap-2">
          {itemsToRender}
        </div>
      ) : layout === "carousel" ? (
        <div
          ref={carouselRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`flex w-full flex-1 min-h-0 p-2 sm:p-4 overflow-x-auto custom-scrollbar gap-3 pb-6 ${autoScroll ? "snap-none" : "snap-x snap-mandatory"}`}
          style={{
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
            maskImage:
              "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
          }}
        >
          {itemsToRender}
        </div>
      ) : (
        <div
          className={`grid ${layout === "immersive-grid" ? "gap-0 p-0 content-start auto-rows-max" : "gap-3 p-2 sm:p-4 content-start auto-rows-max"} flex-1 min-h-0 overflow-y-auto custom-scrollbar w-full`}
          style={{
            gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, max(85px, calc(100% / ${cols} - ${layout === "immersive-grid" ? "0px" : "12px"}))), 1fr))`,
          }}
        >
          {itemsToRender}
        </div>
      )}
    </div>
  );
}
