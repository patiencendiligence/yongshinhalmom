import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface PdfGeneratorParams {
  displayDetailed: boolean;
  userData: any;
  translations: any;
  zodiacGuardians: string;
  lang: string;
}

export async function generateReportPdf({
  displayDetailed,
  userData,
  translations,
  zodiacGuardians,
  lang,
}: PdfGeneratorParams) {
  try {
    // Create a temporary, off-screen style node
    const pdfStyle = document.createElement("style");
    pdfStyle.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght=0,900;1,700&family=Noto+Serif+KR:wght=700;900&display=swap');

      .pdf-page {
        width: 1200px;
        height: 1697px;
        padding: 80px 100px;
        background-color: #000000 !important;
        color: #ffffff !important;
        box-sizing: border-box !important;
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        overflow: hidden !important;
        font-family: ui-sans-serif, system-ui, sans-serif !important;
        -webkit-print-color-adjust: exact !important;
      }
      .pdf-page * {
        box-shadow: none !important;
        text-shadow: none !important;
        transition: none !important;
        word-break: break-word !important;
      }
      .pdf-page h1, .pdf-page h2, .pdf-page h3, .pdf-page h4, .pdf-page .font-serif {
        font-family: 'Playfair Display', 'Noto Serif KR', serif !important;
      }
      .pdf-page header {
        border-bottom: 2px solid rgba(255, 255, 255, 0.15) !important;
        padding-bottom: 40px !important;
        margin-bottom: 40px !important;
      }
      .pdf-page header h1 {
        font-size: 64px !important;
        line-height: 1.0 !important;
        font-weight: 900 !important;
        font-style: italic !important;
        letter-spacing: -0.04em !important;
        margin-bottom: 30px !important;
      }
      .pdf-page header p {
        font-size: 20px !important;
        line-height: 1.5 !important;
        color: rgba(255, 255, 255, 0.5) !important;
        font-style: italic !important;
      }
      .pdf-page .mythic-gradient-text {
        color: #ffd60a !important;
      }
      .pdf-page .manse-ryeok-badge {
        border-left: 2px solid rgba(255, 255, 255, 0.2) !important;
        padding-left: 30px !important;
        margin-bottom: 60px !important;
      }
      .pdf-page .manse-ryeok-badge div:first-child {
        font-size: 11px !important;
        letter-spacing: 0.5em !important;
        text-transform: uppercase !important;
        color: rgba(255, 255, 255, 0.4) !important;
        margin-bottom: 8px !important;
      }
      .pdf-page .manse-ryeok-badge div:last-child {
        font-size: 32px !important;
        font-weight: 900 !important;
        font-style: italic !important;
        color: rgba(255, 255, 255, 0.9) !important;
      }
      .pdf-card {
        background: #0d0d0d !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 20px !important;
        padding: 40px !important;
        margin-bottom: 30px !important;
        display: flex !important;
        flex-direction: column !important;
      }
      .pdf-card-red {
        background: #ff3b30 !important;
        border: none !important;
        border-radius: 20px !important;
        padding: 40px !important;
        margin-bottom: 30px !important;
        display: flex !important;
        flex-direction: column !important;
      }
      .pdf-card-red * {
        color: #ffffff !important;
      }
      .pdf-card-red .chapter-label {
        color: rgba(255, 255, 255, 0.6) !important;
      }
      .pdf-card h3, .pdf-card-red h3 {
        font-size: 32px !important;
        font-weight: 900 !important;
        font-style: italic !important;
        margin-bottom: 24px !important;
        line-height: 1.1 !important;
      }
      .pdf-card .chapter-label {
        font-size: 11px !important;
        letter-spacing: 0.5em !important;
        color: rgba(255, 255, 255, 0.3) !important;
        text-transform: uppercase !important;
        margin-bottom: 12px !important;
        font-weight: 900 !important;
      }
      .pdf-page .markdown-container p {
        color: rgba(255, 255, 255, 0.82) !important;
        font-size: 16px !important;
        line-height: 1.7 !important;
        margin-bottom: 14px !important;
      }
      .pdf-page .markdown-container h1,
      .pdf-page .markdown-container h2,
      .pdf-page .markdown-container h3 {
        color: #ffd60a !important;
        font-weight: bold !important;
        margin-top: 20px !important;
        margin-bottom: 10px !important;
      }
      .pdf-page .markdown-container h1 { font-size: 24px !important; }
      .pdf-page .markdown-container h2 { font-size: 20px !important; }
      .pdf-page .markdown-container h3 { font-size: 18px !important; }

      .pdf-page table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin-top: 16px !important;
        margin-bottom: 16px !important;
      }
      .pdf-page th, .pdf-page td {
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        padding: 10px 14px !important;
        font-size: 14px !important;
        text-align: left !important;
      }
      .pdf-page th {
        background-color: rgba(255, 255, 255, 0.05) !important;
        font-weight: bold !important;
        color: #ffffff !important;
      }
      .pdf-page td {
        color: rgba(255, 255, 255, 0.8) !important;
      }
      .pdf-page ul, .pdf-page ol {
        margin-left: 20px !important;
        margin-top: 10px !important;
        margin-bottom: 10px !important;
        list-style-type: disc !important;
      }
      .pdf-page li {
        font-size: 15px !important;
        margin-bottom: 6px !important;
        color: rgba(255, 255, 255, 0.8) !important;
      }
      .pdf-warning {
        background-color: rgba(255, 59, 48, 0.05) !important;
        border: 1px solid #ff3b30 !important;
        padding: 30px !important;
        border-radius: 16px !important;
        display: flex !important;
        align-items: flex-start !important;
        gap: 24px !important;
        margin-top: auto !important;
      }
      .pdf-warning div {
        color: rgba(255, 255, 255, 0.8) !important;
        font-size: 14px !important;
        line-height: 1.6 !important;
      }
      .pdf-warning .text-mythic-red {
        color: #ff3b30 !important;
        font-weight: 900 !important;
        margin-bottom: 8px !important;
        font-size: 12px !important;
        letter-spacing: 0.1em !important;
      }
      .pdf-footer {
        position: absolute !important;
        bottom: 50px !important;
        left: 100px !important;
        right: 100px !important;
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
        padding-top: 20px !important;
        font-size: 10px !important;
        color: rgba(255, 255, 255, 0.3) !important;
        font-family: monospace !important;
      }
      .pdf-footer * {
        color: rgba(255, 255, 255, 0.3) !important;
      }
      .pdf-page .zodiac-container {
        background: rgba(255,255,255,0.02) !important;
        border: 1px solid rgba(255,255,255,0.08) !important;
        border-radius: 24px !important;
        padding: 10px !important;
        display: inline-block !important;
      }
      .pdf-page .zodiac-illustration {
        width: 128px !important;
        height: 176px !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
        border-radius: 8px !important;
        background-color: #0c0c0c !important;
        background-image: url("${zodiacGuardians}") !important;
        background-size: 768px 352px !important;
        display: block !important;
      }
    `;
    document.head.appendChild(pdfStyle);

    // Create temporary off-screen container inside DOM body
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "-9999px";
    tempContainer.style.width = "1200px";
    document.body.appendChild(tempContainer);

    // Gather live elements from the page
    const liveHeader = document.querySelector("#report-content header");
    const liveBadge = document.querySelector("#report-content .manse-ryeok-badge");
    const liveCards = Array.from(document.querySelectorAll("#report-grid > div"));
    const filteredCards = liveCards.filter(
      card => !card.getAttribute('data-premium-lock') && !card.querySelector('[data-premium-lock="true"]')
    );
    const liveWarning = document.querySelector("#report-content .opacity-30.bg-white") || 
                        document.querySelector("#report-content .bg-white\\/10") || 
                        document.querySelector("#report-content .mb-16.p-6");

    const pages: HTMLDivElement[] = [];
    const totalPages = displayDetailed ? 6 : 3;

    const createPdfPage = (pageNumber: number) => {
      const pageDiv = document.createElement("div");
      pageDiv.className = "pdf-page";
      
      const footer = document.createElement("div");
      footer.className = "pdf-footer";
      footer.innerHTML = `
        <div>© 2026 Yongshinhalmom. LIFESTYLE ANALYSIS REPORT.</div>
        <div>${lang === "ko" ? `페이지 ${pageNumber} / 전체 ${totalPages}` : `PAGE ${pageNumber} OF ${totalPages}`}</div>
      `;
      pageDiv.appendChild(footer);
      return pageDiv;
    };

    // PAGE 1: Corporate Editorial Title Cover & Lunar/Solar Signatures
    const page1 = createPdfPage(1);
    if (liveHeader) {
      const clonedHeader = liveHeader.cloneNode(true) as HTMLElement;
      clonedHeader.style.padding = "0";
      clonedHeader.style.border = "none";
      clonedHeader.style.display = "flex";
      clonedHeader.style.justifyContent = "space-between";
      clonedHeader.style.alignItems = "flex-start";
      page1.insertBefore(clonedHeader, page1.lastChild);
    }
    if (liveBadge) {
      const clonedBadge = liveBadge.cloneNode(true) as HTMLElement;
      clonedBadge.className = "manse-ryeok-badge";
      page1.insertBefore(clonedBadge, page1.lastChild);
    }
    pages.push(page1);

    // PAGE 2: Detailed Chapter 1 (Detailed Saju analysis)
    const page2 = createPdfPage(2);
    if (filteredCards[0]) {
      const clonedCard = filteredCards[0].cloneNode(true) as HTMLElement;
      clonedCard.className = "pdf-card flex-1";
      const chapterLabel = clonedCard.querySelector('.chapter-label');
      if (chapterLabel) {
        chapterLabel.innerHTML = lang === "ko" ? "무료 요약 / 01장" : "FREE / CHAPTER 01";
      }
      page2.insertBefore(clonedCard, page2.lastChild);
    }
    pages.push(page2);

    if (displayDetailed) {
      // PAGE 3: Today's Report & Overview
      const page3 = createPdfPage(3);
      if (filteredCards[1]) {
        const clonedCard1 = filteredCards[1].cloneNode(true) as HTMLElement;
        clonedCard1.className = "pdf-card";
        const label = clonedCard1.querySelector('.chapter-label');
        if (label) {
          label.innerHTML = lang === "ko" ? "02장" : "CHAPTER 02";
        }
        page3.insertBefore(clonedCard1, page3.lastChild);
      }
      if (filteredCards[2]) {
        const clonedCard2 = filteredCards[2].cloneNode(true) as HTMLElement;
        clonedCard2.className = "pdf-card";
        const label = clonedCard2.querySelector('.chapter-label');
        if (label) {
          label.innerHTML = lang === "ko" ? "03장" : "CHAPTER 03";
        }
        page3.insertBefore(clonedCard2, page3.lastChild);
      }
      pages.push(page3);

      // PAGE 4: Solar Year Calendar / Monthly Matrix
      const page4 = createPdfPage(4);
      if (filteredCards[3]) {
        const clonedCard3 = filteredCards[3].cloneNode(true) as HTMLElement;
        clonedCard3.className = "pdf-card flex-1";
        const label = clonedCard3.querySelector('.chapter-label');
        if (label) {
          label.innerHTML = lang === "ko" ? "04장" : "CHAPTER 04";
        }
        page4.insertBefore(clonedCard3, page4.lastChild);
      }
      pages.push(page4);

      // PAGE 5: Daily Wellbeing Triad (Health, Love (Red), Career)
      const page5 = createPdfPage(5);
      if (filteredCards[4]) {
        const clonedCard4 = filteredCards[4].cloneNode(true) as HTMLElement;
        clonedCard4.className = "pdf-card";
        const label = clonedCard4.querySelector('.chapter-label');
        if (label) {
          label.innerHTML = lang === "ko" ? "05장" : "CHAPTER 05";
        }
        page5.insertBefore(clonedCard4, page5.lastChild);
      }
      if (filteredCards[5]) {
        const clonedCard5 = filteredCards[5].cloneNode(true) as HTMLElement;
        clonedCard5.className = "pdf-card-red";
        const label = clonedCard5.querySelector('.chapter-label');
        if (label) {
          label.innerHTML = lang === "ko" ? "06장" : "CHAPTER 06";
        }
        page5.insertBefore(clonedCard5, page5.lastChild);
      }
      if (filteredCards[6]) {
        const clonedCard6 = filteredCards[6].cloneNode(true) as HTMLElement;
        clonedCard6.className = "pdf-card";
        const label = clonedCard6.querySelector('.chapter-label');
        if (label) {
          label.innerHTML = lang === "ko" ? "07장" : "CHAPTER 07";
        }
        page5.insertBefore(clonedCard6, page5.lastChild);
      }
      pages.push(page5);

      // PAGE 6: Remedies & Oracle Advice + Medical warnings
      const page6 = createPdfPage(6);
      if (filteredCards[7]) {
        const clonedCard7 = filteredCards[7].cloneNode(true) as HTMLElement;
        clonedCard7.className = "pdf-card flex-1";
        const label = clonedCard7.querySelector('.chapter-label');
        if (label) {
          label.innerHTML = lang === "ko" ? "08장" : "CHAPTER 08";
        }
        page6.insertBefore(clonedCard7, page6.lastChild);
      }
      if (liveWarning) {
        const clonedWarning = liveWarning.cloneNode(true) as HTMLElement;
        clonedWarning.className = "pdf-warning";
        const alertLabel = clonedWarning.querySelector('.uppercase');
        if (alertLabel) {
          alertLabel.className = "text-mythic-red uppercase";
        }
        page6.insertBefore(clonedWarning, page6.lastChild);
      }
      pages.push(page6);
    } else {
      // Simple/Basic structures (3 Pages total)
      const page3 = createPdfPage(3);
      if (filteredCards[1]) {
        const clonedCard1 = filteredCards[1].cloneNode(true) as HTMLElement;
        clonedCard1.className = "pdf-card";
        const label = clonedCard1.querySelector('.chapter-label');
        if (label) {
          label.innerHTML = lang === "ko" ? "02장" : "CHAPTER 02";
        }
        page3.insertBefore(clonedCard1, page3.lastChild);
      }
      if (filteredCards[2]) {
        const clonedCard2 = filteredCards[2].cloneNode(true) as HTMLElement;
        clonedCard2.className = "pdf-card";
        const label = clonedCard2.querySelector('.chapter-label');
        if (label) {
          label.innerHTML = lang === "ko" ? "03장" : "CHAPTER 03";
        }
        page3.insertBefore(clonedCard2, page3.lastChild);
      }
      if (liveWarning) {
        const clonedWarning = liveWarning.cloneNode(true) as HTMLElement;
        clonedWarning.className = "pdf-warning";
        const alertLabel = clonedWarning.querySelector('.uppercase');
        if (alertLabel) {
          alertLabel.className = "text-mythic-red uppercase";
        }
        page3.insertBefore(clonedWarning, page3.lastChild);
      }
      pages.push(page3);
    }

    // Append standard children to temp DOM
    pages.forEach(p => tempContainer.appendChild(p));

    const illustrations = tempContainer.querySelectorAll(".zodiac-illustration");
    illustrations.forEach(el => {
      const htmlEl = el as HTMLElement;
      const col = parseInt(htmlEl.dataset.col || '0', 10);
      const row = parseInt(htmlEl.dataset.row || '0', 10);
      htmlEl.style.width = '128px';
      htmlEl.style.height = '176px';
      htmlEl.style.backgroundImage = `url("${zodiacGuardians}")`;
      htmlEl.style.backgroundSize = '768px 352px';
      htmlEl.style.backgroundPosition = `-${col * 128}px -${row * 176}px`;
      htmlEl.style.backgroundRepeat = 'no-repeat';
    });

    // Pre-clean inline styles of cloned elements to avoid any oklch/oklab/color properties causing issues
    const allClonedElements = tempContainer.querySelectorAll('*');
    allClonedElements.forEach(el => {
      const htmlEl = el as HTMLElement;
      const inlineStyle = htmlEl.getAttribute('style');
      if (inlineStyle && (inlineStyle.includes('oklch') || inlineStyle.includes('oklab') || inlineStyle.includes('color(') || inlineStyle.includes('color-mix(') || inlineStyle.includes('light-dark('))) {
        const parts = inlineStyle.split(';');
        const filteredParts = parts.filter(p => !p.includes('oklch') && !p.includes('oklab') && !p.includes('color(') && !p.includes('color-mix(') && !p.includes('light-dark('));
        htmlEl.setAttribute('style', filteredParts.join(';'));
      }
    });

    // Cleanse all <style> elements of modern oklch / oklab/color colors to prevent html2canvas crashes
    const styleEls = Array.from(document.querySelectorAll('style'));
    const originalStyles = styleEls.map(style => ({
       el: style,
       text: style.textContent || ""
    }));

    // Handle any linked stylesheets that might contain modern colors (useful for production bundles)
    const linksToRestore: { link: HTMLLinkElement; disabled: boolean }[] = [];
    const tempStyles: HTMLStyleElement[] = [];

    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
    for (const link of links) {
      try {
        const response = await fetch(link.href);
        const text = await response.text();
        if (text.includes("oklch") || text.includes("oklab") || text.includes("color(") || text.includes("color-mix(") || text.includes("light-dark(")) {
          linksToRestore.push({ link, disabled: link.disabled });
          link.disabled = true;

          const parts = text.split(";");
          const safeParts = parts.filter(p => !p.includes("oklch") && !p.includes("oklab") && !p.includes("color(") && !p.includes("color-mix(") && !p.includes("light-dark("));
          
          const tempStyle = document.createElement("style");
          tempStyle.textContent = safeParts.join(";");
          document.head.appendChild(tempStyle);
          tempStyles.push(tempStyle);
        }
      } catch (e) {
        // Fall back gracefully if CORS prevents fetching the linked stylesheet
      }
    }

    // Render each page via canvas
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    try {
      styleEls.forEach((style) => {
        const text = style.textContent || "";
        if (text.includes("oklch") || text.includes("oklab") || text.includes("color(") || text.includes("color-mix(") || text.includes("light-dark(")) {
          const parts = text.split(";");
          const safeParts = parts.filter(p => !p.includes("oklch") && !p.includes("oklab") && !p.includes("color(") && !p.includes("color-mix(") && !p.includes("light-dark("));
          style.textContent = safeParts.join(";");
        }
      });

      for (let i = 0; i < pages.length; i++) {
         const pageEl = pages[i];
         const canvas = await html2canvas(pageEl, {
           backgroundColor: "#000000",
           scale: 2,
           useCORS: true,
           allowTaint: false,
           logging: false,
           width: 1200,
           height: 1697
         });
         
         const imgData = canvas.toDataURL("image/png");
         if (i > 0) {
           pdf.addPage();
         }
         pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }
    } finally {
      // Restore all original style node contents so the live UI is not disrupted
      originalStyles.forEach(({ el, text }) => {
        el.textContent = text;
      });

      // Restore original links and remove temporary style tags
      linksToRestore.forEach(({ link, disabled }) => {
        link.disabled = disabled;
      });
      tempStyles.forEach(style => {
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      });
    }

    const cleanDate = (userData?.birthDate || "").replace(/[^0-9]/g, "");
    pdf.save(`yongshin_report_${cleanDate || "anon"}.pdf`);

    // Cleanup
    document.body.removeChild(tempContainer);
    document.head.removeChild(pdfStyle);
  } catch (error) {
    console.error("[pdfGenerator] PDF generation error:", error);
    throw error;
  }
}
