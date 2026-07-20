"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const INSTALL_METHODS = {
  script: {
    id: "script",
    label: "install.sh",
    command: "curl -fsSL https://gbam.dev/install.sh | bash",
    badge: "macOS • Linux • Windows",
  },
  npm: {
    id: "npm",
    label: "npm",
    command: "npm i -g gbam-dev",
    badge: "Requires Node.js",
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
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-[#081019] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_100px_rgba(0,0,0,0.55)]">
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

      <div className="bg-[radial-gradient(circle_at_top,rgba(57,255,136,0.08),transparent_32%)]">
        {imageFailed ? (
          <img
            src="/demo-placeholder.svg"
            alt="GBAM Terminal and Web Sync Demo placeholder"
            className="block aspect-[16/10] w-full object-cover"
          />
        ) : (
          <img
            src="/demo.gif"
            alt="GBAM Terminal and Web Sync Demo"
            className="block aspect-[16/10] w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>
    </div>
  );
}