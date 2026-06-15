import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  Layout,
  Sliders,
  Palette,
  Code,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Download,
} from "lucide-react";
import { toPng } from "html-to-image";
import Footer from "./Footer";
import Header from "./Header";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ColorPicker,
  ColorPickerAlpha,
  ColorPickerEyeDropper,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerOutput,
  ColorPickerSelection,
} from "./kibo-ui/color-picker";

const TooltipWrap = ({
  children,
  content,
}: {
  children: ReactNode;
  content: string;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent>
      <p className="text-xs">{content}</p>
    </TooltipContent>
  </Tooltip>
);

export default function Customizer() {
  const handleColorChange = (rgbaArray: any, setter: (val: string) => void) => {
    if (Array.isArray(rgbaArray)) {
      const [r, g, b, a] = rgbaArray;
      const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
      let hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      if (a < 1) {
        hex += toHex(a * 255);
      }
      setter(hex);
    } else if (typeof rgbaArray === "string") {
      setter(rgbaArray);
    }
  };

  const handleThemeChange = (val: string) => {
    setTheme(val);
    applyPreset(val);
  };

  // Config states
  const [username, setUsername] = useState(
    () => Cookies.get("lastfm_username") || "",
  );

  // Save username to cookie when it changes
  useEffect(() => {
    Cookies.set("lastfm_username", username, { expires: 365 });
  }, [username]);

  const [type, setType] = useState("nowplaying"); // nowplaying | toptracks | topartists | topalbums
  const [period, setPeriod] = useState("7day");
  const [theme, setTheme] = useState("dark"); // glass | dark | light | spotify | cyberpunk | synthwave | custom
  const [bgOpen, setBgOpen] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [accentOpen, setAccentOpen] = useState(false);
  const [customBg, setCustomBg] = useState(
    "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
  );
  const [customTextColor, setCustomTextColor] = useState("#ffffff");
  const [customAccentColor, setCustomAccentColor] = useState("#ef4444");
  const [customRadius, setCustomRadius] = useState("lg"); // none | sm | md | lg | xl | full
  const [layout, setLayout] = useState("apple"); // apple | list | grid | compact
  const [limit, setLimit] = useState<number | "">(5);
  const [animated, setAnimated] = useState(true);
  const [clickable, setClickable] = useState(true);
  const [showCover, setShowCover] = useState(true);
  const [showLoved, setShowLoved] = useState(true);
  const [showUsername, setShowUsername] = useState(false);
  const [showPlaycount, setShowPlaycount] = useState(true);
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrobbleLabel, setScrobbleLabel] = useState("scrobbles");
  const [clickTarget, setClickTarget] = useState("lastfm");
  const [cols, setCols] = useState("auto");
  const [customFont, setCustomFont] = useState("Golos Text");
  const [heightMode, setHeightMode] = useState("auto");
  const [customIframeHeight, setCustomIframeHeight] = useState("500");

  // Copied state
  const [copied, setCopied] = useState(false);
  const [shareTab, setShareTab] = useState<"iframe" | "markdown" | "url">(
    "iframe",
  );
  const [previewKey, setPreviewKey] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState("180px");
  const observerRef = useRef<ResizeObserver | null>(null);

  // Google Fonts Collection
  const GOOGLE_FONTS = [
    "Golos Text",
    "Inter",
    "Outfit",
    "Plus Jakarta Sans",
    "Space Grotesk",
    "Bricolage Grotesque",
    "Instrument Serif",
    "Syne",
    "Playfair Display",
    "Fira Code",
    "Sora",
    "Montserrat",
    "DM Sans",
    "Poppins",
    "Rubik",
    "Lexend",
  ];

  useEffect(() => {
    const linkId = "g-fonts-customizer";
    if (document.getElementById(linkId)) return;
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    const families = GOOGLE_FONTS.map(
      (font) =>
        `family=${font.replace(/\s+/g, "+")}:wght@400;500;600;700;800;900`,
    ).join("&");
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    document.head.appendChild(link);
  }, []);

  // Build the embed URL query params
  const host = window.location.origin;
  const buildParams = () => {
    const params = new URLSearchParams();
    params.set("username", username);
    if (type !== "nowplaying") params.set("type", type);

    if (type !== "nowplaying") {
      if (period !== "7day") params.set("period", period);
      if (limit !== 5 && limit !== "") params.set("limit", limit.toString());
    }

    if (customBg) params.set("bg", customBg);
    if (customTextColor) params.set("textColor", customTextColor);

    if (customAccentColor) params.set("accentColor", customAccentColor);
    if (customRadius !== "lg") params.set("radius", customRadius);
    if (layout !== "list") params.set("layout", layout);
    if (!animated) params.set("animated", "false");
    if (customFont !== "Be Vietnam Pro") params.set("font", customFont);
    if (!clickable) params.set("clickable", "false");
    if (!showCover) params.set("showCover", "false");
    if (!showLoved) params.set("showLoved", "false");
    if (!showPlaycount) params.set("showPlaycount", "false");
    if (showUsername) params.set("showUsername", "true");
    if (scrobbleLabel !== "scrobbles")
      params.set("scrobbleLabel", scrobbleLabel);
    if (clickTarget !== "lastfm") params.set("clickTarget", clickTarget);

    if ((layout === "grid" || layout === "immersive-grid") && cols !== "") {
      params.set("cols", cols);
    }
    if (layout === "carousel" && autoScroll) {
      params.set("autoScroll", "true");
    }
    if (heightMode === "fixed") {
      params.set("heightMode", "fixed");
    }
    return params.toString();
  };

  const widgetUrl = `${host}/widget?${buildParams()}`;
  const [debouncedWidgetUrl, setDebouncedWidgetUrl] = useState(widgetUrl);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedWidgetUrl(widgetUrl);
    }, 500);
    return () => clearTimeout(timer);
  }, [widgetUrl]);

  const finalIframeHeight =
    heightMode === "fixed" ? `${customIframeHeight}px` : iframeHeight;
  const iframeCode = `<iframe src="${widgetUrl}" width="100%" height="${finalIframeHeight}" frameborder="0" scrolling="no" style="background: transparent;"></iframe>`;
  const markdownCode = `[My Last.fm Stats Widget](${widgetUrl})`;

  const getShareCode = () => {
    if (shareTab === "iframe") return iframeCode;
    if (shareTab === "markdown") return markdownCode;
    return widgetUrl;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getShareCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = async () => {
    if (!iframeRef.current || !iframeRef.current.contentDocument) return;
    try {
      setDownloading(true);
      const rootEl = iframeRef.current.contentDocument.getElementById("root");
      if (!rootEl) throw new Error("Root element not found inside iframe");

      const dataUrl = await toPng(rootEl, {
        cacheBust: true,
        backgroundColor: "transparent",
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });

      const link = document.createElement("a");
      link.download = `scrobbledeck-${username || "widget"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Failed to download image", e);
    } finally {
      setDownloading(false);
    }
  };

  const applyPreset = (preset: string) => {
    if (preset === "cyberpunk") {
      setCustomBg("#0f0f1a");
      setCustomTextColor("#00f0ff");
      setCustomAccentColor("#ff007f");
      setCustomRadius("none");
      setCustomFont("Space Grotesk");
    } else if (preset === "spotify") {
      setCustomBg("#121212");
      setCustomTextColor("#ffffff");
      setCustomAccentColor("#1db954");
      setCustomRadius("lg");
      setCustomFont("Plus Jakarta Sans");
    } else if (preset === "glass") {
      setCustomBg("glass");
      setCustomTextColor("#ffffff");
      setCustomAccentColor("#ef4444");
      setCustomRadius("xl");
      setCustomFont("Golos Text");
    } else if (preset === "synthwave") {
      setCustomBg("#2b0b3f");
      setCustomTextColor("#f43f5e");
      setCustomAccentColor("#d946ef");
      setCustomRadius("md");
      setCustomFont("Syne");
    } else if (preset === "dark") {
      setCustomBg("#09090b");
      setCustomTextColor("#a1a1aa");
      setCustomAccentColor("#ef4444");
      setCustomRadius("lg");
      setCustomFont("Be Vietnam Pro");
    } else if (preset === "light") {
      setCustomBg("#ffffff");
      setCustomTextColor("#71717a");
      setCustomAccentColor("#ef4444");
      setCustomRadius("lg");
      setCustomFont("Be Vietnam Pro");
    } else if (preset === "dynamic-dark") {
      setCustomBg("dynamic-dark");
      setCustomAccentColor("#ef4444");
    } else if (preset === "dynamic-light") {
      setCustomBg("dynamic-light");
      setCustomAccentColor("#ef4444");
    } else if (preset === "dracula") {
      setCustomBg("#282a36");
      setCustomTextColor("#f8f8f2");
      setCustomAccentColor("#bd93f9");
      setCustomRadius("lg");
      setCustomFont("Fira Code");
    } else if (preset === "nord") {
      setCustomBg("#2e3440");
      setCustomTextColor("#eceff4");
      setCustomAccentColor("#88c0d0");
      setCustomRadius("md");
      setCustomFont("Inter");
    } else if (preset === "catppuccin") {
      setCustomBg("#1e1e2e");
      setCustomTextColor("#cdd6f4");
      setCustomAccentColor("#cba6f7");
      setCustomRadius("xl");
      setCustomFont("Outfit");
    } else if (preset === "tokyo-night") {
      setCustomBg("#1a1b26");
      setCustomTextColor("#a9b1d6");
      setCustomAccentColor("#7aa2f7");
      setCustomRadius("lg");
      setCustomFont("Space Grotesk");
    }
  };

  const handleIframeLoad = () => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      try {
        if (heightMode === "fixed") {
          setIframeHeight(`${customIframeHeight}px`);
          return;
        }

        const body = iframe.contentWindow.document.body;
        body.style.overflow = "hidden";

        // Initial measurement
        setIframeHeight(`${body.scrollHeight}px`);

        const observer = new ResizeObserver(() => {
          setIframeHeight(`${body.scrollHeight}px`);
        });
        observer.observe(body);
        observerRef.current = observer;
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-red-500 selection:text-white">
      <Header />

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          {/* Section: Username */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                <Sliders className="w-4 h-4 text-red-500" /> 1. Last.fm Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Last.fm username..."
                  className="w-full font-semibold"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section: Widget Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                <Layout className="w-4 h-4 text-red-500" /> 2. Widget Config
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Widget Type */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Widget Type
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "nowplaying", label: "Now Playing" },
                    { id: "recenttracks", label: "Recent Tracks" },
                    { id: "toptracks", label: "Top Tracks" },
                    { id: "topartists", label: "Top Artists" },
                    { id: "topalbums", label: "Top Albums" },
                    { id: "lovedtracks", label: "Loved Tracks" },
                    { id: "userprofile", label: "User Profile" },
                    { id: "weeklystats", label: "Weekly Stats" },
                    { id: "topgenres", label: "Top Genres" },
                  ].map((item) => (
                    <Button
                      key={item.id}
                      onClick={() => {
                        setType(item.id);
                        if (item.id === "nowplaying" && layout === "grid") {
                          setLayout("apple");
                        } else if (
                          item.id === "userprofile" ||
                          item.id === "weeklystats" ||
                          item.id === "topgenres"
                        ) {
                          setLayout("list");
                        } else if (item.id !== "nowplaying") {
                          if (layout === "compact" || layout === "apple") {
                            setLayout("list");
                          }
                        }
                      }}
                      variant={type === item.id ? "default" : "outline"}
                      className={`text-xs py-2.5 ${type !== item.id ? "text-muted-foreground" : ""}`}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* If stats, show timeframe & limit options */}
              {type !== "nowplaying" && type !== "userprofile" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="period"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Timeframe
                    </Label>
                    <Select value={period} onValueChange={setPeriod}>
                      <SelectTrigger
                        id="period"
                        className="w-full bg-background border-border text-xs font-semibold"
                      >
                        <SelectValue placeholder="Timeframe" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border text-popover-foreground">
                        <SelectItem value="7day" className="text-xs">
                          7 Days
                        </SelectItem>
                        <SelectItem value="1month" className="text-xs">
                          1 Month
                        </SelectItem>
                        <SelectItem value="12month" className="text-xs">
                          1 Year
                        </SelectItem>
                        <SelectItem value="overall" className="text-xs">
                          All Time
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="limit"
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      Limit
                    </Label>
                    <Input
                      id="limit"
                      type="number"
                      min="1"
                      max="30"
                      value={limit}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setLimit("");
                        } else {
                          setLimit(Math.max(1, Math.min(30, parseInt(val))));
                        }
                      }}
                      className="w-full text-xs font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Layout Options */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Layout
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    {
                      id: "apple",
                      label: "Apple Music",
                      allowed: type === "nowplaying",
                    },
                    {
                      id: "compact",
                      label: "Compact",
                      allowed: type === "nowplaying",
                    },
                    {
                      id: "list",
                      label: "List View",
                      allowed:
                        type !== "userprofile" &&
                        type !== "weeklystats" &&
                        type !== "topgenres",
                    },
                    {
                      id: "grid",
                      label: "Grid View",
                      allowed:
                        type !== "nowplaying" &&
                        type !== "userprofile" &&
                        type !== "weeklystats" &&
                        type !== "topgenres",
                    },
                    {
                      id: "immersive-grid",
                      label: "Immersive Grid",
                      allowed:
                        type !== "nowplaying" &&
                        type !== "userprofile" &&
                        type !== "weeklystats" &&
                        type !== "topgenres",
                    },
                    {
                      id: "carousel",
                      label: "Carousel",
                      allowed:
                        type !== "nowplaying" &&
                        type !== "userprofile" &&
                        type !== "weeklystats" &&
                        type !== "topgenres",
                    },
                  ].map(
                    (item) =>
                      item.allowed && (
                        <Button
                          key={item.id}
                          onClick={() => setLayout(item.id)}
                          variant={layout === item.id ? "secondary" : "outline"}
                          className="flex-1 text-xs min-w-[80px]"
                        >
                          {item.label}
                        </Button>
                      ),
                  )}
                </div>
              </div>

              {/* Grid Columns Options (only shown for grid layout) */}
              {(layout === "grid" || layout === "immersive-grid") && (
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <Label
                    htmlFor="gridCols"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Grid Columns
                  </Label>
                  <Select value={cols} onValueChange={setCols}>
                    <SelectTrigger
                      id="gridCols"
                      className="w-full bg-background border-border text-xs font-semibold"
                    >
                      <SelectValue placeholder="Grid Columns" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      <SelectItem value="auto" className="text-xs">
                        Auto (based on limit)
                      </SelectItem>
                      <SelectItem value="2" className="text-xs">
                        2 Columns
                      </SelectItem>
                      <SelectItem value="3" className="text-xs">
                        3 Columns
                      </SelectItem>
                      <SelectItem value="4" className="text-xs">
                        4 Columns
                      </SelectItem>
                      <SelectItem value="5" className="text-xs">
                        5 Columns
                      </SelectItem>
                      <SelectItem value="6" className="text-xs">
                        6 Columns
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Height Mode Toggle */}
              <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Iframe Height Mode
                  </Label>
                  <Select value={heightMode} onValueChange={setHeightMode}>
                    <SelectTrigger className="w-full bg-background border-border text-xs font-semibold">
                      <SelectValue placeholder="Height Mode" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      <SelectItem value="auto" className="text-xs">
                        Auto (Fit Content)
                      </SelectItem>
                      <SelectItem value="fixed" className="text-xs">
                        Fixed (Internal Scroll)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {heightMode === "fixed" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Fixed Height (px)
                    </Label>
                    <Input
                      type="number"
                      value={customIframeHeight}
                      onChange={(e) => setCustomIframeHeight(e.target.value)}
                      className="w-full text-xs font-semibold"
                    />
                  </div>
                )}
              </div>

              {/* Animations Toggle */}
              <div className="flex items-center justify-between border-t border-border/60 pt-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Enable Animations
                </Label>
                <Checkbox
                  checked={animated}
                  onCheckedChange={(checked) => setAnimated(!!checked)}
                />
              </div>

              {/* Clickable Links Toggle */}
              <div className="flex items-center justify-between border-t border-border/60 pt-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Enable Clickable Links
                </Label>
                <Checkbox
                  checked={clickable}
                  onCheckedChange={(checked) => setClickable(!!checked)}
                />
              </div>

              {/* Link Click Destination (only shown if clickable) */}
              {clickable && (
                <div className="space-y-1.5 pt-4 border-t border-border/60">
                  <Label
                    htmlFor="clickTarget"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Link Click Destination
                  </Label>
                  <Select value={clickTarget} onValueChange={setClickTarget}>
                    <SelectTrigger
                      id="clickTarget"
                      className="w-full bg-background border-border text-xs font-semibold"
                    >
                      <SelectValue placeholder="Select Destination" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      <SelectItem value="lastfm" className="text-xs">
                        Last.fm (Library Profile)
                      </SelectItem>
                      <SelectItem value="spotify" className="text-xs">
                        Spotify (Search Redirect)
                      </SelectItem>
                      <SelectItem value="applemusic" className="text-xs">
                        Apple Music / iTunes Link
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Show Cover Art Toggle */}
              <div className="flex items-center justify-between border-t border-border/60 pt-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Show Cover Art
                </Label>
                <Checkbox
                  checked={showCover}
                  onCheckedChange={(checked) => setShowCover(!!checked)}
                />
              </div>

              {/* Show Liked Tracks Toggle */}
              <div className="flex items-center justify-between border-t border-border/60 pt-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Show Liked Tracks Badge
                </Label>
                <Checkbox
                  checked={showLoved}
                  onCheckedChange={(checked) => setShowLoved(!!checked)}
                />
              </div>

              {/* Show Playcounts Toggle */}
              <div className="flex items-center justify-between border-t border-border/60 pt-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Show Playcounts / Stats
                </Label>
                <Checkbox
                  checked={showPlaycount}
                  onCheckedChange={(checked) => setShowPlaycount(!!checked)}
                />
              </div>

              {/* Auto Scroll Marquee Toggle */}
              {layout === "carousel" && (
                <div className="flex items-center justify-between border-t border-border/60 pt-4">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Auto Scroll Marquee
                  </Label>
                  <Checkbox
                    checked={autoScroll}
                    onCheckedChange={(checked) => setAutoScroll(!!checked)}
                  />
                </div>
              )}

              {/* Show Username Toggle */}
              <div className="flex items-center justify-between border-t border-border/60 pt-4 pb-4">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Show Username in Title
                </Label>
                <Checkbox
                  checked={showUsername}
                  onCheckedChange={(checked) => setShowUsername(!!checked)}
                />
              </div>

              {/* Scrobble Label Customization */}
              <div className="space-y-1.5 pt-4 border-t border-border/60">
                <Label
                  htmlFor="scrobbleLabel"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Scrobble Label
                </Label>
                <Select value={scrobbleLabel} onValueChange={setScrobbleLabel}>
                  <SelectTrigger
                    id="scrobbleLabel"
                    className="w-full bg-background border-border text-xs font-semibold"
                  >
                    <SelectValue placeholder="Select Label" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground">
                    <SelectItem value="scrobbles" className="text-xs">
                      Scrobbles
                    </SelectItem>
                    <SelectItem value="plays" className="text-xs">
                      Plays
                    </SelectItem>
                    <SelectItem value="listens" className="text-xs">
                      Listens
                    </SelectItem>
                    <SelectItem value="spins" className="text-xs">
                      Spins
                    </SelectItem>
                    <SelectItem value="streams" className="text-xs">
                      Streams
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Section: Themes & Presets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                <Palette className="w-4 h-4 text-red-500" /> 3. Styling & Themes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Custom Google Font Selector */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="customFont"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Widget Font Family
                </Label>
                <Select value={customFont} onValueChange={setCustomFont}>
                  <SelectTrigger
                    id="customFont"
                    className="w-full bg-background border-border text-xs font-semibold"
                    style={{ fontFamily: `'${customFont}', sans-serif` }}
                  >
                    <SelectValue placeholder="Select Font" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground max-h-[200px]">
                    {GOOGLE_FONTS.map((font) => (
                      <SelectItem
                        key={font}
                        value={font}
                        className="text-xs"
                        style={{ fontFamily: `'${font}', sans-serif` }}
                      >
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Base Theme Option */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="theme"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Theme Mode / Presets
                  </Label>
                  <Select value={theme} onValueChange={handleThemeChange}>
                    <SelectTrigger
                      id="theme"
                      className="w-full bg-background border-border text-xs font-semibold"
                    >
                      <SelectValue placeholder="Theme Mode" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      {type === "nowplaying" && (
                        <>
                          <SelectItem value="dynamic-dark" className="text-xs">
                            Dynamic (Auto-Color Dark)
                          </SelectItem>
                          <SelectItem value="dynamic-light" className="text-xs">
                            Dynamic (Auto-Color Light)
                          </SelectItem>
                        </>
                      )}
                      <SelectItem value="dark" className="text-xs">
                        Solid Dark
                      </SelectItem>
                      <SelectItem value="light" className="text-xs">
                        Solid Light
                      </SelectItem>
                      <SelectItem value="glass" className="text-xs">
                        Glassmorphism
                      </SelectItem>
                      <SelectItem value="spotify" className="text-xs">
                        Spotify Style
                      </SelectItem>
                      <SelectItem value="cyberpunk" className="text-xs">
                        Cyberpunk Neon
                      </SelectItem>
                      <SelectItem value="synthwave" className="text-xs">
                        Synthwave Retro
                      </SelectItem>
                      <SelectItem value="dracula" className="text-xs">
                        Dracula Theme
                      </SelectItem>
                      <SelectItem value="nord" className="text-xs">
                        Nord Theme
                      </SelectItem>
                      <SelectItem value="catppuccin" className="text-xs">
                        Catppuccin Macchiato
                      </SelectItem>
                      <SelectItem value="tokyo-night" className="text-xs">
                        Tokyo Night
                      </SelectItem>
                      <SelectItem value="custom" className="text-xs">
                        Custom Colors
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="radius"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Corners (Radius)
                  </Label>
                  <Select value={customRadius} onValueChange={setCustomRadius}>
                    <SelectTrigger
                      id="radius"
                      className="w-full bg-background border-border text-xs font-semibold"
                    >
                      <SelectValue placeholder="Select Radius" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-popover-foreground">
                      <SelectItem value="none" className="text-xs">
                        Sharp Corners
                      </SelectItem>
                      <SelectItem value="sm" className="text-xs">
                        Small (sm)
                      </SelectItem>
                      <SelectItem value="md" className="text-xs">
                        Medium (md)
                      </SelectItem>
                      <SelectItem value="lg" className="text-xs">
                        Large (lg)
                      </SelectItem>
                      <SelectItem value="xl" className="text-xs">
                        Extra Large (xl)
                      </SelectItem>
                      <SelectItem value="2xl" className="text-xs">
                        Double Extra Large (2xl)
                      </SelectItem>
                      <SelectItem value="3xl" className="text-xs">
                        Triple Extra Large (3xl)
                      </SelectItem>
                      <SelectItem value="4xl" className="text-xs">
                        Quarduple Extra Large (4xl)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom Theme Colors */}
              {(theme === "custom" ||
                theme === "spotify" ||
                theme === "cyberpunk" ||
                theme === "synthwave") && (
                <div className="grid grid-cols-2 gap-4 border-t border-border/60 pt-4">
                  <div className="col-span-2 space-y-1.5">
                    <Collapsible open={bgOpen} onOpenChange={setBgOpen}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between text-xs font-semibold"
                        >
                          <span>Background Color Picker</span>
                          {bgOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2">
                        <ColorPicker
                          value={
                            customBg === "glass" ||
                            customBg.startsWith("dynamic")
                              ? "#09090b"
                              : customBg
                          }
                          onChange={(rgba) =>
                            handleColorChange(rgba, setCustomBg)
                          }
                          className="w-full max-w-sm rounded-md border border-border bg-background p-4 shadow-sm"
                        >
                          <ColorPickerSelection className="h-32 w-full" />
                          <div className="flex items-center gap-4">
                            <ColorPickerEyeDropper />
                            <div className="grid w-full gap-1">
                              <ColorPickerHue />
                              <ColorPickerAlpha />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ColorPickerOutput />
                            <ColorPickerFormat />
                          </div>
                        </ColorPicker>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <Collapsible open={textOpen} onOpenChange={setTextOpen}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between text-xs font-semibold"
                        >
                          <span>Custom Text Color</span>
                          {textOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2">
                        <ColorPicker
                          value={customTextColor}
                          onChange={(rgba) =>
                            handleColorChange(rgba, setCustomTextColor)
                          }
                          className="w-full max-w-sm rounded-md border border-border bg-background p-4 shadow-sm"
                        >
                          <ColorPickerSelection className="h-32 w-full" />
                          <div className="flex items-center gap-4">
                            <ColorPickerEyeDropper />
                            <div className="grid w-full gap-1">
                              <ColorPickerHue />
                              <ColorPickerAlpha />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ColorPickerOutput />
                            <ColorPickerFormat />
                          </div>
                        </ColorPicker>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              )}

              <div className="border-t border-border/60 pt-4 space-y-1.5">
                <Collapsible open={accentOpen} onOpenChange={setAccentOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-xs font-semibold"
                    >
                      <span>Accent / Highlight Color</span>
                      {accentOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <ColorPicker
                      value={customAccentColor}
                      onChange={(rgba) =>
                        handleColorChange(rgba, setCustomAccentColor)
                      }
                      className="w-full max-w-sm rounded-md border border-border bg-background p-4 shadow-sm"
                    >
                      <ColorPickerSelection className="h-32 w-full" />
                      <div className="flex items-center gap-4">
                        <ColorPickerEyeDropper />
                        <div className="grid w-full gap-1">
                          <ColorPickerHue />
                          <ColorPickerAlpha />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ColorPickerOutput />
                        <ColorPickerFormat />
                      </div>
                    </ColorPicker>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Preview and Embed Code Column */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          {/* Widget Live Preview */}
          <Card className="overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm uppercase font-bold tracking-widest text-muted-foreground">
                Live Widget Preview
              </CardTitle>
              <div className="flex items-center gap-1">
                <TooltipWrap content="Download as Image (PNG)">
                  <Button
                    onClick={handleDownloadImage}
                    title="Download Image"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground h-8 w-8"
                    disabled={downloading}
                  >
                    {downloading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipWrap>
                <TooltipWrap content="Refresh widget preview">
                  <Button
                    onClick={() => setPreviewKey((prev) => prev + 1)}
                    title="Refresh preview"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground h-8 w-8"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </TooltipWrap>
              </div>
            </CardHeader>

            <CardContent
              className="p-0 pb-0 w-full flex items-center justify-center relative overflow-hidden border-t border-border"
              style={{ height: iframeHeight }}
            >
              {/* Background visual element */}
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/5 dark:to-black/20 pointer-events-none"></div>

              {/* Render simulated iframe for exact URL preview */}
              <iframe
                ref={iframeRef}
                key={previewKey}
                src={debouncedWidgetUrl}
                onLoad={handleIframeLoad}
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                className="shadow-2xl w-full block"
                style={{
                  background: "transparent",
                }}
              />
            </CardContent>
            <div className="px-6 py-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground border-t border-border/40">
              <span>Auto-refreshing status every 15s</span>
            </div>
          </Card>

          {/* Embed Generator Code */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                <Code className="w-4.5 h-4.5 text-red-500" /> Share & Embed Code
              </CardTitle>
              <CardDescription>
                Select the format below to embed the widget or share a link.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={shareTab === "iframe" ? "default" : "outline"}
                  onClick={() => setShareTab("iframe")}
                  className="text-xs h-8 px-3"
                >
                  Iframe HTML
                </Button>
                <Button
                  variant={shareTab === "markdown" ? "default" : "outline"}
                  onClick={() => setShareTab("markdown")}
                  className="text-xs h-8 px-3"
                >
                  Markdown
                </Button>
                <Button
                  variant={shareTab === "url" ? "default" : "outline"}
                  onClick={() => setShareTab("url")}
                  className="text-xs h-8 px-3"
                >
                  Direct URL
                </Button>
              </div>

              <div className="relative">
                {/* Make textarea taller */}
                <Textarea
                  readOnly
                  value={getShareCode()}
                  className={`pr-12 select-all leading-relaxed font-mono text-xs ${shareTab === "url" ? "h-20" : "h-[160px]"}`}
                />
                <TooltipWrap content="Copy embed code">
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="icon"
                    className="absolute top-3 right-3 bg-background hover:bg-accent text-muted-foreground hover:text-foreground h-8 w-8"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipWrap>
              </div>

              <div className="border-t border-border/60 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground font-medium">
                  Direct Widget URL
                </span>
                <a
                  href={widgetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-red-600 active:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-600/10"
                >
                  Open Standalone Widget{" "}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
