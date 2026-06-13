import { useState, useEffect } from "react";
import { Sun, Moon, Star } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Header() {
  // Theme states
  const [appTheme, setAppTheme] = useState<"dark" | "light">("dark");
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    const savedTheme = Cookies.get("app-theme") as "dark" | "light";
    if (savedTheme) {
      setAppTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const initialTheme = systemPrefersDark ? "dark" : "light";
      setAppTheme(initialTheme);
      document.documentElement.classList.toggle(
        "dark",
        initialTheme === "dark",
      );
      Cookies.set("app-theme", initialTheme, { expires: 365 });
    }

    // Fetch GitHub stars
    fetch("https://api.github.com/repos/abdipr/scrobbledeck")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.stargazers_count === "number") {
          setStars(data.stargazers_count);
        }
      })
      .catch((err) => console.error("Failed to fetch GitHub stars:", err));
  }, []);

  const toggleAppTheme = () => {
    const newTheme = appTheme === "dark" ? "light" : "dark";
    setAppTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    Cookies.set("app-theme", newTheme, { expires: 365 });
  };

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/android-chrome-192x192.png"
            alt="ScrobbleDeck Logo"
            className="w-8 h-8 drop-shadow-md"
          />
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-red-500 to-rose-400 bg-clip-text text-transparent">
              ScrobbleDeck
            </h1>
            <p className="text-[9px] text-muted-foreground font-semibold tracking-wider uppercase leading-none mt-0.5">
              Last.fm Widget Lab
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={toggleAppTheme}
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8"
              >
                {appTheme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Toggle theme mode</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <a
                href="https://github.com/abdipr/scrobbledeck"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-semibold px-3 py-1.5 border border-border rounded-full hover:bg-muted/50"
              >
                <FaGithub className="w-3.5 h-3.5" />
                <span>Star</span>
                {stars !== null && (
                  <div className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded-full ml-1">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <span className="font-bold text-[10px] leading-none">
                      {stars}
                    </span>
                  </div>
                )}
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Star on GitHub</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
