"use client";

import { Check, Copy, Loader2, Terminal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const INSTALL_METHODS = {
  script: {
    id: "script",
    label: "install.sh",
    command: "curl -fsSL https://gbam.dev/install.sh | bash",
    badge: "macOS • Windows",
  },
  npm: {
    id: "npm",
    label: "npm",
    command: "npm i -g gbam-dev",
    badge: "macOS • Windows · Requires Node.js",
  },
} as const;

type InstallMethodKey = keyof typeof INSTALL_METHODS;

function fallbackCopy(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export function InstallCommandCard() {
  const [activeMethod, setActiveMethod] = useState<InstallMethodKey>("script");
  const [copied, setCopied] = useState(false);

  const currentInstaller = INSTALL_METHODS[activeMethod];

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentInstaller.command);
      } else {
        fallbackCopy(currentInstaller.command);
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-card/85 p-3 shadow-[0_0_0_1px_rgba(57,255,136,0.08),0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur">
      <div className="mb-3 flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.22em] text-primary uppercase">Quick Install</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose your preferred installation method to set up GBAM.
          </p>
        </div>

        {/* Method Switcher Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-black/40 p-1 self-start sm:self-auto">
          {(Object.keys(INSTALL_METHODS) as InstallMethodKey[]).map((key) => {
            const isActive = activeMethod === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveMethod(key);
                  setCopied(false);
                }}
                className={`rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                {INSTALL_METHODS[key].label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-border bg-black/55 px-4 py-3 text-left font-mono text-sm text-primary">
          <code className="block whitespace-nowrap">{currentInstaller.command}</code>
        </div>

        <Button
          type="button"
          size="lg"
          onClick={handleCopy}
          aria-live="polite"
          className="min-w-32 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

export function DemoShowcase() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
  };

  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-[#081019] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_100px_rgba(0,0,0,0.55)]">
      {/* Window Controls Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>

        <p className="text-[10px] font-medium tracking-[0.18em] text-slate-300 uppercase sm:text-xs">
          gbam.dev — CLI & Web Dashboard Live Sync
        </p>

        <div className="hidden w-[52px] md:block" />
      </div>

      {/* Media Canvas Container */}
      <div className="relative aspect-[16/10] w-full bg-[radial-gradient(circle_at_top,rgba(57,255,136,0.08),transparent_32%)]">
        {/* Loading Overlay */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#081019]/90 backdrop-blur-sm">
            <div className="relative flex items-center justify-center">
              <div className="absolute -inset-4 rounded-full bg-primary/20 blur-lg animate-pulse" />
              <Loader2 className="relative size-8 animate-spin text-primary" />
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <Terminal className="size-3.5 text-primary animate-pulse" />
              <span className="animate-pulse">Loading live terminal preview...</span>
            </div>
          </div>
        )}

        {/* Pure React Fallback (Zero external assets required) */}
        {hasError ? (
          <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-4 border border-white/5 bg-black/60 p-6 text-center">
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 shadow-[0_0_30px_rgba(57,255,136,0.15)]">
              <Terminal className="size-10 text-primary" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-semibold text-foreground sm:text-base">
                GBAM Terminal & Web Sync
              </h3>
              <p className="mt-1 max-w-xs font-mono text-xs text-muted-foreground sm:max-w-sm">
                Video playback failed to load. Ensure <code className="text-primary">DemoVideo.webm</code> or <code className="text-primary">DemoVideo.mp4</code> is inside your <code className="text-primary">public/</code> directory.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleRetry}
              className="mt-1 border-primary/30 font-mono text-xs text-primary hover:bg-primary/10"
            >
              Retry Video
            </Button>
          </div>
        ) : (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            className={`block aspect-[16/10] w-full object-cover transition-opacity duration-700 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
          >
            <source src="/DemoVideo.webm" type="video/webm" />
            <source src="/DemoVideo.mp4" type="video/mp4" />
          </video>
        )}
      </div>
    </div>
  );
}