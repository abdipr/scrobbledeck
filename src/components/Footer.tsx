import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { FaGithub } from "react-icons/fa6";
import { SiBuymeacoffee } from "react-icons/si";
import { Code2, Shield, FileText, Heart } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-12 py-8 border-t border-border/40 bg-background/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left side: Copyright & Social */}
        <div className="flex flex-col md:flex-row items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4" />
            <span>
              &copy; {currentYear}{" "}
              <a
                href="https://abdi.cc"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                abdipr.
              </a>
            </span>
          </div>
          <span className="hidden md:inline text-border/60">|</span>
          <div className="flex items-center gap-4 md:gap-3">
            <a
              href="https://github.com/abdipr/scrobbledeck"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
            >
              <FaGithub className="w-4 h-4 group-hover:text-primary transition-colors" />
              <span>MIT Licensed</span>
            </a>
            <span className="text-border/60">|</span>
            <a
              href="https://buymeacoffee.com/abdipr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
            >
              <SiBuymeacoffee className="w-4 h-4 group-hover:text-[#FFDD00] transition-colors" />
              <span>Support</span>
            </a>
          </div>
        </div>

        {/* Right side: Links (Alert Dialogs) */}
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-sm font-medium">
          {/* About */}
          <AlertDialog>
            <AlertDialogTrigger className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 outline-none">
              About
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle>About ScrobbleDeck</AlertDialogTitle>
                <AlertDialogDescription className="leading-relaxed mt-3 space-y-3">
                  <p>
                    ScrobbleDeck is an open-source aesthetic widget generator
                    for your Last.fm profile.
                  </p>
                  <p>
                    Built to be embedded into Notion, personal websites, or
                    GitHub readmes, it transforms your listening habits into a
                    highly customizable, beautiful visual experience inspired by
                    modern design trends.
                  </p>
                  <p>
                    Created with{" "}
                    <Heart className="w-4 h-4 text-red-500 fill-red-500 inline-block align-text-bottom mx-1" />{" "}
                    by abdipr.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-6">
                <AlertDialogCancel className="w-full sm:w-auto">
                  Close
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Privacy Policy */}
          <AlertDialog>
            <AlertDialogTrigger className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 outline-none">
              Privacy Policy
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Privacy Policy
                </AlertDialogTitle>
                <AlertDialogDescription className="leading-relaxed mt-3 space-y-3">
                  <p>
                    <strong>We don't collect or store your data.</strong>
                  </p>
                  <p>
                    ScrobbleDeck runs entirely in your browser. When you
                    generate a widget, it fetches your listening data directly
                    from the Last.fm public API on the fly.
                  </p>
                  <p>
                    We do not track, log, or monetize your activity. What you
                    scrobble remains between you and Last.fm.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-6">
                <AlertDialogCancel className="w-full sm:w-auto">
                  I Understand
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Terms of Service */}
          <AlertDialog>
            <AlertDialogTrigger className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 outline-none">
              Terms of Service
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Terms of Service
                </AlertDialogTitle>
                <AlertDialogDescription className="leading-relaxed mt-3 space-y-3">
                  <p>
                    By using ScrobbleDeck, you agree to respect the Last.fm API
                    terms of service.
                  </p>
                  <p>
                    This tool is provided "as is", without warranty of any kind.
                    As an open-source project under the MIT License, you are
                    free to use, modify, and distribute the code, provided you
                    include the original copyright notice.
                  </p>
                  <p>
                    Please do not abuse the widget endpoints to spam or overload
                    the Last.fm API.
                  </p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-6">
                <AlertDialogCancel className="w-full sm:w-auto">
                  Agree & Close
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </footer>
  );
}
