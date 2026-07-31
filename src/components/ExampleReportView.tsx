import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Sparkles, Compass, ShieldCheck } from "lucide-react";
import { EXAMPLE_REPORTS } from "../data/exampleReports";
import { Language } from "../lib/translations";

interface ExampleReportViewProps {
  lang?: Language;
}

export default function ExampleReportView({ lang = "ko" }: ExampleReportViewProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const report = slug ? EXAMPLE_REPORTS[slug] : undefined;

  if (!report) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center text-ink-black dark:text-white">
        <h1 className="text-2xl font-serif font-bold mb-4">
          {lang === "en" ? "Example report not found" : "존재하지 않는 예시 리포트입니다."}
        </h1>
        <Link
          to="/"
          className="px-6 py-3 bg-pink-100 text-ink-black dark:bg-white/10 dark:text-white font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all"
        >
          {lang === "en" ? "Return to Home" : "홈으로 돌아가기"}
        </Link>
      </div>
    );
  }

  const isEn = lang === "en";
  const title = isEn ? report.titleEn : report.titleKo;
  const subtitle = isEn ? report.subtitleEn : report.subtitleKo;
  const description = isEn ? report.descriptionEn : report.descriptionKo;
  const canonicalUrl = `https://yongshinhalmom.vercel.app/example/${report.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "url": canonicalUrl,
    "publisher": {
      "@type": "Organization",
      "name": "용신할멈",
      "logo": {
        "@type": "ImageObject",
        "url": "https://yongshinhalmom.vercel.app/assets/yongshin.png"
      }
    },
    "mainEntityOfPage": canonicalUrl
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12 text-ink-black dark:text-white transition-colors duration-300">
      <Helmet>
        <title>{`${title} | ${isEn ? "Yongshin Halmeom" : "용신할멈 명리비책"}`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={`${title} | 용신할멈`} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-ink-black/10 dark:border-white/10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-ink-black/70 dark:text-white/70 hover:text-ink-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isEn ? "Back to Home" : "홈으로 돌아가기"}</span>
        </button>
        <span className="text-[11px] font-mono tracking-widest text-ink-black/40 dark:text-white/40 uppercase">
          Sample Saju Report
        </span>
      </div>

      {/* Report Container */}
      <article className="bg-[#FAF7EF] dark:bg-[#0B0F17] border border-ink-black/15 dark:border-white/15 p-6 md:p-10 shadow-xl rounded-none relative overflow-hidden">
        {/* Top Badge */}
        <div className="flex items-center justify-between mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-500/10 dark:bg-cyan-500/10 text-pink-700 dark:text-cyan-300 border border-pink-500/20 dark:border-cyan-500/20 text-[10px] font-black tracking-widest uppercase">
            <Compass className="w-3 h-3" />
            {isEn ? "Verified Saju Analysis Example" : "용신할멈 명리비책 예시 리포트"}
          </span>
          <span className="text-[10px] font-mono text-ink-black/40 dark:text-white/40">
            {report.subjectInfo.dataPattern}
          </span>
        </div>

        {/* Header Title */}
        <header className="mb-8 text-center pb-6 border-b border-ink-black/10 dark:border-white/10">
          <h1 className="text-2xl md:text-4xl font-serif font-black tracking-tight mb-2 leading-tight">
            {title}
          </h1>
          <p className="text-xs md:text-sm font-sans text-ink-black/60 dark:text-white/60 tracking-wide">
            {subtitle}
          </p>
        </header>

        {/* Grandma Advice Box */}
        <section className="mb-8 p-6 bg-[#F3ECE0] dark:bg-[#141B28] border-l-4 border-amber-600 dark:border-cyan-500 relative">
          <div className="text-[11px] font-black tracking-widest uppercase text-amber-800 dark:text-cyan-400 mb-2 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isEn ? "Grandma's Advice" : "할멈의 조언"}</span>
          </div>
          <p className="text-sm md:text-base font-sans leading-relaxed text-ink-black/90 dark:text-white/90 whitespace-pre-line font-medium mb-4">
            {report.grandmaAdvice.quote}
          </p>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-ink-black/10 dark:border-white/10 text-center text-xs">
            <div className="bg-white/60 dark:bg-black/30 p-2">
              <span className="block text-[10px] font-bold text-ink-black/40 dark:text-white/40 mb-0.5">COLOR</span>
              <span className="font-bold text-ink-black dark:text-white">{report.grandmaAdvice.color}</span>
            </div>
            <div className="bg-white/60 dark:bg-black/30 p-2">
              <span className="block text-[10px] font-bold text-ink-black/40 dark:text-white/40 mb-0.5">ITEM</span>
              <span className="font-bold text-ink-black dark:text-white">{report.grandmaAdvice.item}</span>
            </div>
            <div className="bg-white/60 dark:bg-black/30 p-2">
              <span className="block text-[10px] font-bold text-ink-black/40 dark:text-white/40 mb-0.5">FOOD</span>
              <span className="font-bold text-ink-black dark:text-white">{report.grandmaAdvice.food}</span>
            </div>
          </div>
        </section>

        {/* Saju Subject Box */}
        <section className="mb-10 p-4 bg-white/50 dark:bg-black/20 border border-ink-black/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-ink-black/50 dark:text-white/50 mr-2">사주 대상자:</span>
            <span className="font-bold">{report.subjectInfo.birthDate}</span>
          </div>
          <div>
            <span className="font-bold text-ink-black/50 dark:text-white/50 mr-2">Data Pattern:</span>
            <span className="font-mono font-bold text-amber-700 dark:text-cyan-300">{report.subjectInfo.dataPattern}</span>
          </div>
        </section>

        {/* Chapters Section (CHAPTER 01 to CHAPTER 06) */}
        <div className="space-y-8">
          {report.chapters.map((ch, idx) => (
            <section key={idx} className="p-6 bg-white/70 dark:bg-[#111622] border border-ink-black/10 dark:border-white/10 transition-all hover:border-ink-black/20 dark:hover:border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-mono font-black tracking-widest text-amber-700 dark:text-cyan-400 uppercase bg-amber-100 dark:bg-cyan-950/60 px-2.5 py-0.5 border border-amber-300 dark:border-cyan-800">
                  {ch.number}
                </span>
                <h2 className="text-lg md:text-xl font-serif font-bold text-ink-black dark:text-white">
                  {ch.title}
                </h2>
              </div>
              <p className="text-sm md:text-base font-sans leading-relaxed text-ink-black/80 dark:text-white/80 whitespace-pre-line">
                {ch.content}
              </p>
              {ch.link && (
                <div className="mt-4 pt-3 border-t border-ink-black/5 dark:border-white/5">
                  <Link
                    to={ch.link.url}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 dark:text-cyan-300 hover:underline"
                  >
                    <span>{ch.link.label}</span>
                  </Link>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Call To Action Box */}
        <section className="mt-12 p-8 text-center bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 dark:from-pink-950/20 dark:to-cyan-950/20 border border-pink-300/30 dark:border-cyan-500/30">
          <h3 className="text-lg md:text-xl font-serif font-bold mb-2">
            {isEn ? "Get Your Own Personal Saju Report" : "나만의 정밀 사주팔자 리포트 풀어보기"}
          </h3>
          <p className="text-xs md:text-sm text-ink-black/70 dark:text-white/70 mb-6 max-w-md mx-auto">
            {isEn 
              ? "Yongshin Halmeom analyzes your exact birth date & time according to authentic Eastern astrology."
              : "용신할멈이 자네의 생년월시와 명리 기운을 바탕으로 타고난 성향, 재물, 커리어, 건강을 찬찬히 풀어드리네."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-4 bg-ink-black text-white dark:bg-white dark:text-black font-black text-xs uppercase tracking-[0.3em] hover:opacity-90 transition-all shadow-lg"
          >
            {isEn ? "Start Free Reading Now" : "무료 사주 분석 시작하기"}
          </button>
        </section>
      </article>

      {/* Navigation between other example reports */}
      <nav className="mt-10 p-6 bg-[#FAF7EF] dark:bg-[#0B0F17] border border-ink-black/10 dark:border-white/10">
        <h4 className="text-xs font-black tracking-widest uppercase text-ink-black/50 dark:text-white/50 mb-4 text-center">
          {isEn ? "Other Sample Saju Reports" : "다른 명리 예시 리포트 살펴보기"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {Object.values(EXAMPLE_REPORTS).map((item) => {
            const isCurrent = item.slug === report.slug;
            return (
              <Link
                key={item.slug}
                to={`/example/${item.slug}`}
                className={`p-3 border text-center transition-all ${
                  isCurrent
                    ? "border-amber-600 dark:border-cyan-400 bg-amber-500/10 dark:bg-cyan-500/10 font-bold"
                    : "border-ink-black/10 dark:border-white/10 hover:border-ink-black/30 dark:hover:border-white/30 bg-white/40 dark:bg-black/20"
                }`}
              >
                <div className="font-serif font-bold mb-1">{item.titleKo}</div>
                <div className="text-[10px] text-ink-black/50 dark:text-white/50">{item.subtitleKo}</div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
