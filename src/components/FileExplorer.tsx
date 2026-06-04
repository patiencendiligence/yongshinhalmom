import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Folder, FolderOpen, FileText, MoreVertical, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface FileItem {
  slug: string;
  filename: string;
  titleKo: string;
  titleEn: string;
}

export interface CategoryInfo {
  key: string;
  name: string;
  items: FileItem[];
}

export const fileTreeData: CategoryInfo[] = [
  {
    key: "basic",
    name: "basic",
    items: [
      { slug: "what-is-daewoon", filename: "what-is-daewoon.md", titleKo: "대운이란 무엇인가?", titleEn: "What is Daewoon?" },
      { slug: "what-is-ilgan", filename: "what-is-ilgan.md", titleKo: "일간이란 무엇인가?", titleEn: "What is Ilgan?" },
      { slug: "what-is-saju", filename: "what-is-saju.md", titleKo: "사주란 무엇인가?", titleEn: "What is Saju?" },
      { slug: "what-is-sipsin", filename: "what-is-sipsin.md", titleKo: "십성이란 무엇인가?", titleEn: "What is Sipsin?" },
      { slug: "what-is-yongshin", filename: "what-is-yongshin.md", titleKo: "용신이란 무엇인가?", titleEn: "What is Yongshin?" },
    ]
  },
  {
    key: "element",
    name: "element",
    items: [
      { slug: "earth", filename: "earth.md", titleKo: "토(土) - 흙", titleEn: "Earth (Soil)" },
      { slug: "fire", filename: "fire.md", titleKo: "화(火) - 불", titleEn: "Fire" },
      { slug: "metal", filename: "metal.md", titleKo: "금(金) - 쇠", titleEn: "Metal" },
      { slug: "water", filename: "water.md", titleKo: "수(水) - 물", titleEn: "Water" },
      { slug: "wood", filename: "wood.md", titleKo: "목(木) - 나무", titleEn: "Wood (Tree)" }
    ]
  }
];

export interface ThemeColors {
  text: string;           // Title text color
  border: string;         // Borders / Active indicator
  borderMuted: string;    // Soft divider borders
  bgLight: string;        // Light alert/blockquote backgrounds
  badgeText: string;      // Color for the active file badge text
  badgeBg: string;        // Active folder background highlight
  bullet: string;         // Eastern-themed bullet bullet character
  themeName: string;      // English representation word
  accentBg: string;       // Accent bg color
}

export function getThemeColors(category?: string, slug?: string): ThemeColors {
  if (category === "element") {
    switch (slug) {
      case "wood":
        return {
          text: "text-mythic-green dark:text-emerald-400",
          border: "border-mythic-green/50 dark:border-emerald-500/30",
          borderMuted: "border-mythic-green/15 dark:border-emerald-500/15",
          bgLight: "bg-mythic-green/5 dark:bg-emerald-950/10",
          badgeText: "text-emerald-700 dark:text-emerald-400",
          badgeBg: "bg-mythic-green/10 dark:bg-emerald-950/30",
          accentBg: "bg-mythic-green dark:bg-emerald-500",
          bullet: "🪵",
          themeName: "Wood"
        };
      case "fire":
        return {
          text: "text-mythic-red dark:text-rose-400",
          border: "border-mythic-red/50 dark:border-rose-500/30",
          borderMuted: "border-mythic-red/15 dark:border-rose-500/15",
          bgLight: "bg-mythic-red/5 dark:bg-rose-950/10",
          badgeText: "text-red-700 dark:text-rose-400",
          badgeBg: "bg-mythic-red/10 dark:bg-rose-950/30",
          accentBg: "bg-mythic-red dark:bg-rose-500",
          bullet: "🔥",
          themeName: "Fire"
        };
      case "earth":
        return {
          text: "text-mythic-gold dark:text-mythic-gold",
          border: "border-mythic-gold/50 dark:border-mythic-gold/30",
          borderMuted: "border-mythic-gold/15 dark:border-mythic-gold/15",
          bgLight: "bg-mythic-gold/5 dark:bg-mythic-gold/5",
          badgeText: "text-amber-800 dark:text-mythic-gold",
          badgeBg: "bg-mythic-gold/10 dark:bg-mythic-gold/20",
          accentBg: "bg-mythic-gold dark:bg-mythic-gold",
          bullet: "⛰️",
          themeName: "Earth"
        };
      case "metal":
        return {
          text: "text-holo-cyan dark:text-holo-cyan",
          border: "border-holo-cyan/50 dark:border-holo-cyan/30",
          borderMuted: "border-holo-cyan/15 dark:border-holo-cyan/15",
          bgLight: "bg-holo-cyan/5 dark:bg-holo-cyan/5",
          badgeText: "text-cyan-700 dark:text-holo-cyan",
          badgeBg: "bg-holo-cyan/15 dark:bg-holo-cyan/15",
          accentBg: "bg-holo-cyan dark:bg-holo-cyan",
          bullet: "🪙",
          themeName: "Metal"
        };
      case "water":
        return {
          text: "text-[#9d00ff] dark:text-holo-pink",
          border: "border-[#9d00ff]/50 dark:border-holo-pink/30",
          borderMuted: "border-[#9d00ff]/15 dark:border-holo-pink/15",
          bgLight: "bg-[#9d00ff]/5 dark:bg-holo-pink/5",
          badgeText: "text-purple-700 dark:text-holo-pink",
          badgeBg: "bg-[#9d00ff]/10 dark:bg-holo-pink/15",
          accentBg: "bg-[#9d00ff] dark:bg-holo-pink",
          bullet: "🌊",
          themeName: "Water"
        };
    }
  }

  // Fallback for Saju Basics (Elegant Traditional Golden/Amber Guidance)
  return {
    text: "text-mythic-gold dark:text-mythic-gold",
    border: "border-mythic-gold/50 dark:border-mythic-gold/30",
    borderMuted: "border-mythic-gold/15 dark:border-mythic-gold/15",
    bgLight: "bg-mythic-gold/5 dark:bg-mythic-gold/5",
    badgeText: "text-amber-800 dark:text-mythic-gold",
    badgeBg: "bg-mythic-gold/10 dark:bg-mythic-gold/20",
    accentBg: "bg-mythic-gold dark:bg-mythic-gold",
    bullet: "✦",
    themeName: "Guidance"
  };
}

interface FileExplorerProps {
  currentCategory?: string;
  currentSlug?: string;
  lang?: "ko" | "en";
  onSelect?: () => void; // Callback for mobile closing
}

export default function FileExplorer({
  currentCategory,
  currentSlug,
  lang = "ko",
  onSelect
}: FileExplorerProps) {
  const navigate = useNavigate();
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    basic: true,
    element: true,
  });

  const toggleFolder = (key: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleFileClick = (categoryKey: string, slug: string) => {
    navigate(`/${categoryKey}/${slug}`);
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <div className="w-full font-mono text-sm leading-relaxed select-none">
      {/* Search/Header simulation or clean title */}
      <div className="mb-6 pb-4">
        <h3 className="text-xs uppercase tracking-[0.2em] font-sans font-black text-ink-black/50 dark:text-white/40">
          {lang === "ko" ? "용신할멈의 지혜" : "The Wisdom of the Dragon Goddess"}
        </h3>
      </div>

      <div className="space-y-4">
        {fileTreeData.map((category) => {
          const isExpanded = expandedFolders[category.key];
          const isElementCat = category.key === "element";
          
          return (
            <div key={category.key} className="space-y-1">
              {/* Category Folder Header */}
              <button
                onClick={() => toggleFolder(category.key)}
                className="flex items-center gap-2 w-full text-left text-ink-black/80 dark:text-white/80 hover:text-ink-black dark:hover:text-white transition-colors group py-1 rounded"
              >
                <span className="text-ink-black/40 dark:text-white/30 group-hover:text-ink-black/70 dark:group-hover:text-white/60 transition-colors">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
                <span className={isElementCat ? "text-holo-cyan" : "text-mythic-gold"}>
                  {isExpanded ? (
                    <FolderOpen className="w-4 h-4" />
                  ) : (
                    <Folder className="w-4 h-4" />
                  )}
                </span>
                <span className="font-sans font-medium tracking-wide text-xs uppercase tracking-widest opacity-80">
                  {category.name}
                </span>
              </button>

              {/* Collapsible File List */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden pl-4 ml-2 space-y-1"
                  >
                    {category.items.map((item) => {
                      const isActive =
                        currentCategory === category.key && currentSlug === item.slug;
                      
                      const itemTheme = getThemeColors(category.key, item.slug);
                      
                      return (
                        <button
                          key={item.slug}
                          onClick={() => handleFileClick(category.key, item.slug)}
                          className={`flex items-center justify-between w-full text-left py-1.5 px-2.5 rounded transition-all group ${
                            isActive
                              ? `bg-ink-black/5 dark:bg-white/5 ${itemTheme.text} border-l-2 ${itemTheme.border} font-bold`
                              : "text-ink-black/60 dark:text-white/55 hover:bg-ink-black/5 dark:hover:bg-white/5 hover:text-ink-black dark:hover:text-white"
                          }`}
                          title={`${lang === "ko" ? item.titleKo : item.titleEn}`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden mr-2">
                            <FileText className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? itemTheme.text : "text-ink-black/40 dark:text-white/30"
                            }`} />
                            <div className="flex flex-col min-w-0">
                              <span className="truncate text-xs font-mono">
                                {lang === "ko" ? item.titleKo : item.titleEn}
                              </span>
                            </div>
                          </div>

                          {/* Placeholder 3-dot action item menu (rendered like screenshot) */}
                          <div className={`opacity-0 group-hover:opacity-100 transition-opacity pr-1 ${isActive ? "opacity-40" : ""}`}>
                            <MoreVertical className="w-3.5 h-3.5 text-ink-black/40 dark:text-white/30 hover:text-ink-black dark:hover:text-white shrink-0" />
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
