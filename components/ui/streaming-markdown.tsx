"use client";

import { cn } from "@/lib/utils";

interface Props {
  content: string;
  className?: string;
}

export function StreamingMarkdown({ content, className }: Props) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="mt-7 mb-3 text-[13px] font-semibold uppercase tracking-widest text-gray-400 first:mt-0">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="mt-4 mb-1.5 text-[13px] font-semibold text-gray-900">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const bullets: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        bullets.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="mb-3 space-y-1.5 pl-0">
          {bullets.map((b, bi) => (
            <li key={bi} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-gray-700">
              <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-brand/40" />
              <span dangerouslySetInnerHTML={{ __html: formatInline(b) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="mb-3 space-y-1.5 pl-0 counter-reset-list">
          {items.map((item, ii) => (
            <li key={ii} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-gray-700">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500">
                {ii + 1}
              </span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (line.trim() === "") {
      // skip blank lines between sections
    } else {
      elements.push(
        <p key={i} className="mb-3 text-[13px] leading-relaxed text-gray-700"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      );
    }
    i++;
  }

  return (
    <div className={cn("prose-nutra", className)}>
      {elements}
    </div>
  );
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[12px] text-gray-800">$1</code>');
}
