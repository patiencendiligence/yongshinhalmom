import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Helmet } from "react-helmet-async";
import { markdownModules } from "../lib/markdownLoader";
import { ArrowLeft, Menu, X, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Language } from "../lib/translations";
import FileExplorer, { getThemeColors, fileTreeData } from "../components/FileExplorer";
import { filterContentByLanguage } from "../utils/sajuUtils";


function getRelatedPosts(currentCategory: string, currentSlug: string) {
  const allItems: Array<{ category: string, slug: string, titleKo: string, titleEn: string }> = [];
  
  fileTreeData.forEach(cat => {
    cat.items.forEach(item => {
      allItems.push({
        category: cat.key,
        slug: item.slug,
        titleKo: item.titleKo,
        titleEn: item.titleEn
      });
    });
  });

  // Filter out current post
  const candidates = allItems.filter(item => !(item.category === currentCategory && item.slug === currentSlug));

  // Match a steady hash from current directory keys
  let hash = 0;
  const combinedStr = (currentCategory || "") + (currentSlug || "");
  for (let i = 0; i < combinedStr.length; i++) {
    hash = combinedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const selected: typeof candidates = [];
  
  // 1. Pick one from same category is highly relevant
  const sameCat = candidates.filter(item => item.category === currentCategory);
  if (sameCat.length > 0) {
    const idx = hash % sameCat.length;
    selected.push(sameCat[idx]);
  }

  // 2. Pick from other categories
  const otherCat = candidates.filter(item => item.category !== currentCategory);
  const categoriesGrouped: Record<string, typeof candidates> = {};
  otherCat.forEach(item => {
    if (!categoriesGrouped[item.category]) {
      categoriesGrouped[item.category] = [];
    }
    categoriesGrouped[item.category].push(item);
  });

  const catKeys = Object.keys(categoriesGrouped).sort();
  
  let attemptIdx = 0;
  while (selected.length < 4 && otherCat.length > 0) {
    const nextCatKey = catKeys[(hash + attemptIdx) % catKeys.length];
    const catGroup = categoriesGrouped[nextCatKey];
    if (catGroup && catGroup.length > 0) {
      const itemIdx = (hash + attemptIdx) % catGroup.length;
      const chosen = catGroup[itemIdx];
      if (!selected.some(s => s.category === chosen.category && s.slug === chosen.slug)) {
        selected.push(chosen);
      }
    }
    attemptIdx++;
    if (attemptIdx > 40) {
      for (const item of otherCat) {
        if (selected.length >= 4) break;
        if (!selected.some(s => s.category === item.category && s.slug === item.slug)) {
          selected.push(item);
        }
      }
      break;
    }
  }

  while (selected.length < 4 && candidates.length > selected.length) {
    const fallbackItem = candidates.find(item => !selected.some(s => s.category === item.category && s.slug === item.slug));
    if (fallbackItem) {
      selected.push(fallbackItem);
    } else {
      break;
    }
  }

  return selected.slice(0, 4);
}

function getSeoDisplayTitle(item: { category: string, slug: string, titleKo: string, titleEn: string }, isKo: boolean) {
  if (!isKo) {
    return item.titleEn;
  }
  
  const title = item.titleKo;
  if (item.category === "basic") {
    if (title.endsWith("?")) {
      return `${title.slice(0, -1)} 보는 법과 해석 가이드`;
    }
    return `${title} 깊게 이해하기`;
  }
  if (item.category === "element") {
    const parsed = title.split(" - ");
    if (parsed.length > 1) {
      return `${parsed[0]} 오행 특징 (${parsed[1]}의 기운)`;
    }
    return `${title} 오행의 성격과 활용`;
  }
  if (item.category === "ilgan") {
    const hanjaMap: Record<string, string> = {
      "갑목": "갑목(甲木)", "을목": "을목(乙木)",
      "병화": "병화(丙火)", "정화": "정화(丁火)",
      "무토": "무토(戊土)", "기토": "기토(己土)",
      "경금": "경금(庚金)", "신금": "신금(辛金)",
      "임수": "임수(壬水)", "계수": "계수(癸水)"
    };
    const styled = hanjaMap[title] || title;
    return `${styled} 일간의 성격과 특징 풀이`;
  }
  if (item.category === "ilju") {
    return `${title} 특징과 사주명리 해석`;
  }
  if (item.category === "sipseong") {
    const hanjaMap: Record<string, string> = {
      "비견": "비견(比肩)", "겁재": "겁재(劫財)",
      "식신": "식신(食神)", "상관": "상관(傷官)",
      "편재": "편재(偏財)", "정재": "정재(正財)",
      "편관": "편관(偏官)", "정관": "정관(正官)",
      "편인": "편인(偏印)", "정인": "정인(正인)"
    };
    const styled = hanjaMap[title] || title;
    return `${styled}의 뜻과 사주 성향 정리`;
  }
  return title;
}


export default function SeoPage({
  onBack,
  lang = "ko"
}:{
  onBack: () => void,
  lang?: Language
}) {
  const { category, slug } = useParams();

  const [content, setContent] = useState("");
  const [seoTitle, setSeoTitle] = useState("용신할멈 | YongshinHalmom");
  const [seoDesc, setSeoDesc] = useState("용신할멈의 사주명리 분석, 일주 해석, 오행 분석, 용신 풀이");
  const [isMobileExplorerOpen, setIsMobileExplorerOpen] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  const currentLang = lang || 'ko';
  const backLabel = currentLang === 'ko' ? "돌아가기" : "Back";
  const explorerLabel = currentLang === 'ko' ? "👵 용신할멈 서재" : "👵 Halmeom Library";

  // Resolve dynamic theme colors for current active document
  const theme = getThemeColors(category, slug);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  useEffect(() => {
    let path = `../data/${category}/${slug}.md`;
    if (lang === "en") {
      const enPath = `../data/${category}/${slug}-en.md`;
      if (markdownModules[enPath]) {
        path = enPath;
      }
    }

    const loader = markdownModules[path];

    if (!loader) {
      setContent(lang === "en" ? "# Document not found" : "# 없는 문서라네");
      return;
    }

    loader().then((text: any) => {
      const filtered = filterContentByLanguage(text, lang);
      setContent(filtered);

      // Extract a clean title and description for SEO
      const lines = filtered.split('\n').map(l => l.trim());
      const titleLine = lines.find(line => line.startsWith('# '));
      const pageTitle = titleLine ? titleLine.replace(/^#\s*/, '').trim() : (slug || "");

      const cleanLines = lines.filter(line => line && !line.startsWith('#') && !line.startsWith('<!--') && !line.startsWith('---') && !line.startsWith('>'));
      const pageDesc = cleanLines.length > 0 
        ? cleanLines[0].replace(/[*_`\[\]]/g, '').substring(0, 150) + "..." 
        : (lang === "en" ? "Explore traditional Saju wisdom with Yongshin Halmeom." : "용신할멈과 함께 알아보는 전통 사주명리 지혜.");

      setSeoTitle(pageTitle);
      setSeoDesc(pageDesc);
    });
    // Scroll back to top whenever active document page shifts
    window.scrollTo(0, 0);
  }, [category, slug, lang]);

  // Sprite grid positioning for O-Hang elements (3 columns, 2 rows)
  const getOHangBackgroundPosition = (elementSlug: string): string => {
    switch (elementSlug) {
      case "earth":
        return "0% 0%"; // Column 1, Row 1
      case "fire":
        return "50% 0%"; // Column 2, Row 1
      case "water":
        return "100% 0%"; // Column 3, Row 1
      case "metal":
        return "0% 100%"; // Column 1, Row 2 (금/금/목 에서 첫번째 금)
      case "wood":
        return "100% 100%"; // Column 3, Row 2 (금/금/목 에서 목)
      default:
        return "0% 0%";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 animate-fade-in" style={{minWidth: '98vw', wordBreak: 'keep-all'}}>
        <Helmet>
          <title>{seoTitle} - {lang === "en" ? "Yongshin Halmeom" : "용신할멈"}</title>
          <meta name="description" content={seoDesc} />
          <meta property="og:title" content={`${seoTitle} - ${lang === "en" ? "Yongshin Halmeom" : "용신할멈"}`} />
          <meta property="og:description" content={seoDesc} />
          <meta property="og:image" content="https://yongshinhalmom.vercel.app/assets/yongshin.png" />
          <link
            rel="canonical"
            href={`https://yongshinhalmom.vercel.app/${category}/${slug}`}
          />

      {seoTitle && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": seoTitle,
              "description": seoDesc,
              "url": `https://yongshinhalmom.vercel.app/${category}/${slug}`,
              "author": {
                "@type": "Organization",
                "name": "용신할멈"
              },
              "publisher": {
                "@type": "Organization",
                "name": "용신할멈"
              },
              "inLanguage": lang,
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://yongshinhalmom.vercel.app/${category}/${slug}`
              }
            })}
          </script>
      )}
        </Helmet>
      {/* Top Header Panel: Navigation Back & Mobile Explorer Toggle */}
      <div className="flex items-start justify-between gap-4 mt-12 mb-8 pb-4 border-b border-ink-black/10 dark:border-white/10">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-3 text-ink-black/55 dark:text-white/40 hover:text-ink-black dark:hover:text-white transition-all uppercase tracking-[0.5em] text-[10px] font-black group py-2"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
          {backLabel}
        </motion.button>

        {/* Mobile Explorer Drawer Trigger */}
        <button
          onClick={() => setIsMobileExplorerOpen(true)}
          className={`lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-lg bg-ink-black/5 dark:bg-white/5 border border-ink-black/10 dark:border-white/10 text-xs font-sans font-bold hover:bg-ink-black/10 dark:hover:bg-white/10 transition-all text-ink-black dark:text-white`}
        >
          <Menu className="w-4 h-4 shrink-0" />
          <span>{explorerLabel}</span>
        </button>
      </div>

      {/* Main Grid: Left sidebar (desktop) + Right article */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
        {/* Desktop Sidebar File Explorer */}
        <aside className="hidden lg:block sticky top-8 bg-ink-black/[0.02] dark:bg-white/[0.01] rounded-xl p-5 self-start backdrop-blur-sm">
          <FileExplorer
            currentCategory={category}
            currentSlug={slug}
            lang={currentLang}
          />
        </aside>

        {/* Markdown Content Viewer */}
        <article className="prose prose-lg max-w-none text-ink-black/90 dark:text-white/95 leading-relaxed">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <>
                  {category === "element" && (
                    <div 
                      className="w-full max-w-[465px] aspect-[465/384] mb-8 overflow-hidden rounded-xl border border-ink-black/10 dark:border-white/10 relative shadow-sm hover:shadow-md transition-shadow duration-300 bg-cream/30 dark:bg-zinc-900/30"
                    >
                      <div 
                        className="absolute inset-0 select-none pointer-events-none"
                        style={{
                          backgroundImage: "url('/assets/o-hang.png')",
                          backgroundSize: "300% 200%",
                          backgroundPosition: getOHangBackgroundPosition(slug || ""),
                          backgroundRepeat: "no-repeat"
                        }}
                      />
                    </div>
                  )}
                  <h1 className={`text-3xl sm:text-4xl font-serif font-black mb-8 ${theme.text} tracking-tight border-b ${theme.borderMuted} pb-4`}>
                    {children}
                  </h1>
                </>
              ),

              h2: ({ children }) => (
                <h2 className="text-2xl font-serif font-bold mt-12 mb-5 text-ink-black dark:text-white tracking-tight flex items-center gap-3">
                  <span className={`w-1.5 h-6 ${theme.accentBg} rounded-full inline-block shrink-0`} />
                  {children}
                </h2>
              ),

              h3: ({ children }) => (
                <h3 className={`text-xl font-sans font-bold mt-8 mb-4 text-ink-black/90 dark:text-white/90`}>
                  {children}
                </h3>
              ),

              p: ({ children }) => (
                <p className="leading-8 mb-6 text-ink-black/80 dark:text-white/80 font-sans">
                  {children}
                </p>
              ),

              ul: ({ children }) => (
                <ul className="list-none pl-1 space-y-3 mb-6">
                  {children}
                </ul>
              ),

              li: ({ children }) => (
                <li className="flex gap-2.5 items-start text-ink-black/80 dark:text-white/80 text-sm sm:text-base">
                  <span className={`w-1.5 h-1.5 ${theme.accentBg} rounded-full inline-block shrink-0 mt-2`} />
                  <span className="leading-relaxed text-left">{children}</span>
                </li>
              ),

              blockquote: ({ children }) => (
                <blockquote className={`border-l-4 ${theme.border} pl-5 pr-4 py-4 italic my-8 ${theme.bgLight} rounded-r-xl text-ink-black/75 dark:text-white/75 relative overflow-hidden font-editorial`}>
                  <div className="absolute top-0 right-0 p-2 text-4xl opacity-10 dark:opacity-15 font-black select-none pointer-events-none">
                    👵
                  </div>
                  {children}
                </blockquote>
              ),
              
              hr: () => (
                <hr className={`my-10 ${theme.borderMuted}`} />
              )
            }}
          >
            {content}
          </ReactMarkdown>

          {/* Related Posts Section for Internal Link Strength (SEO) */}
          <div className={`mt-16 pt-12 border-t ${theme.borderMuted}`}>
            <h4 className="text-base font-serif font-black tracking-wider text-ink-black/80 dark:text-white/85 mb-8 flex items-center gap-3">
              <span className={`w-1.5 h-6 ${theme.accentBg} rounded-full inline-block`} />
              <span>{lang === "ko" ? "같이 읽어보면 좋은 사주 이야기" : "Related Posts"}</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {getRelatedPosts(category || "", slug || "").map((related) => {
                const isKo = lang === "ko";
                const displayTitle = getSeoDisplayTitle(related, isKo);
                const relatedTheme = getThemeColors(related.category, related.slug);
                const pathUrl = `/${related.category}/${related.slug}`;
                const categoryNamesKo: Record<string, string> = {
                  basic: "사주 기초",
                  element: "오행 분석",
                  ilgan: "일간 분석",
                  ilju: "일주론",
                  sipseong: "십성 풀이"
                };
                
                return (
                  <Link
                    key={`${related.category}-${related.slug}`}
                    to={pathUrl}
                    className={`block p-5 rounded-xl border border-ink-black/10 dark:border-white/10 hover:border-ink-black/20 dark:hover:border-white/20 hover:scale-[1.01] transition-all bg-white/45 dark:bg-zinc-900/40 hover:bg-white/85 dark:hover:bg-zinc-900/60 shadow-sm group`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className={`text-[10px] font-sans font-black tracking-widest uppercase ${relatedTheme.text}`}>
                        {lang === "ko" ? categoryNamesKo[related.category] || related.category : related.category}
                      </span>
                      <span className="text-xs opacity-50 font-sans group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </div>
                    <span className="text-sm font-sans font-bold text-ink-black/85 dark:text-white/90 group-hover:text-ink-black dark:group-hover:text-white transition-colors">
                      {displayTitle}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </article>
      </div>

      {/* Mobile Drawer (Responsive slide over) */}
      <AnimatePresence>
        {isMobileExplorerOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileExplorerOpen(false)}
              className="fixed inset-0 z-50 bg-black backdrop-blur-sm lg:hidden"
            />

            {/* Sidebar Content drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[300px] max-w-[85vw] bg-cream dark:bg-dark-deep border-r border-ink-black/15 dark:border-white/15 p-6 shadow-2xl overflow-y-auto lg:hidden"
            >
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-ink-black/10 dark:border-white/10">
                <span className={`font-serif font-black text-sm ${theme.text} tracking-wide`}>
                  {lang === "ko" ? "👵 용신할멈 서재" : "👵 Halmeom Library"}
                </span>
                <button
                  onClick={() => setIsMobileExplorerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-ink-black/5 dark:hover:bg-white/5 transition-colors text-ink-black/50 dark:text-white/40 hover:text-ink-black dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <FileExplorer
                currentCategory={category}
                currentSlug={slug}
                lang={currentLang}
                onSelect={() => setIsMobileExplorerOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Scroll to Top button with theme-aware colors & hover bounce */}
      <AnimatePresence>
        {showScrollToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 15 }}
            onClick={scrollToTop}
            className={`fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-xl border backdrop-blur-md transition-all duration-300 group
              bg-cream/90 dark:bg-zinc-900/90 active:scale-95
              ${theme.border} ${theme.text} hover:bg-cream dark:hover:bg-zinc-850`}
            aria-label="Scroll to top"
            title={currentLang === 'ko' ? "맨 위로 이동" : "Scroll to top"}
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

