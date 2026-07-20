"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How does Naira billing work without a dollar card?",
    answer:
      "You top up your account balance in local Naira using standard card payments or bank transfers. Tokens are deducted from your balance in real time as you code.",
  },
  {
    question: "How is pay-as-you-go cheaper than a ₦28,000 subscription?",
    answer:
      "Flat-rate subscriptions charge full price regardless of activity. With GBAM, you only pay for the exact input and output tokens your CLI requests consume—averaging ~₦4,500/month for most developers.",
  },
  {
    question: "How do I install and link the CLI?",
    answer:
      "Run `curl -fsSL https://gbam.dev/install.sh | bash` or `npm i -g gbam-dev`. Once installed, type `/login` and proceed to connect your terminal to your web dashboard account.",
  },
  {
    question: "Can I set spending limits to control my costs?",
    answer:
      "Yes. You can set hard daily or monthly spending caps in your dashboard settings. Once reached, requests pause automatically so you never overspend.",
  },
  {
    question: "Do I need Node.js installed on my machine?",
    answer:
      "Yes. GBAM requires Node.js (or Bun) installed on macOS, Linux, or Windows to run globally from your terminal. If you do not have Node.js using install.sh would automatically install bun for a seamless running",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="border-t border-border bg-card/20">
      <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
        <div className="text-center">
          <p className="text-sm font-medium text-primary">GOT QUESTIONS?</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-muted-foreground">
            Everything you need to know about billing, installation, and token tracking.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-2xl border border-border bg-card/70 backdrop-blur transition-colors hover:border-primary/30"
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between gap-4 p-6 text-left"
                >
                  <span className="font-display text-lg font-medium tracking-tight">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`size-5 text-primary transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-border/50 px-6 pb-6 pt-4 text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}