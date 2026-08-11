import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

// 1. Gather all static route URLs
function getRoutes() {
  const urls = [
    "/",
    "/pricing",
    "/policies",
    "/example/rich-ceo",
    "/example/pop-star",
    "/example/king-josun",
  ];

  function scan(dir, routePrefix = "") {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const fullPath = path.join(dir, file);

      if (fs.statSync(fullPath).isDirectory()) {
        scan(fullPath, `${routePrefix}/${file}`);
        return;
      }

      if (!file.endsWith(".md")) return;
      if (file.endsWith("-en.md")) return;

      const slug = file.replace(".md", "");
      urls.push(`${routePrefix}/${slug}`);
    });
  }

  scan("./src/data");
  return Array.from(new Set(urls));
}

async function main() {
  const routes = getRoutes();
  console.log(`[SSG Prerender] Starting pre-rendering for ${routes.length} routes...`);

  // Path setup
  const clientDir = path.resolve("dist/client");
  const ssrDir = path.resolve("dist/ssr");
  const finalDistDir = path.resolve("dist");

  const templatePath = path.join(clientDir, "index.html");
  if (!fs.existsSync(templatePath)) {
    console.error(`[SSG Prerender Error] Template not found at ${templatePath}`);
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, "utf-8");

  // Import entry-server bundle
  const serverEntryPath = path.join(ssrDir, "entry-server.js");
  const serverEntryUrl = pathToFileURL(serverEntryPath).href;
  const { render } = await import(serverEntryUrl);

  let successCount = 0;

  for (let routeUrl of routes) {
    try {
      const { appHtml, helmet } = render(routeUrl);

      let html = template;

      // Extract helmet tags
      const titleStr = helmet?.title ? helmet.title.toString() : "";
      const metaStr = helmet?.meta ? helmet.meta.toString() : "";
      const linkStr = helmet?.link ? helmet.link.toString() : "";
      const scriptStr = helmet?.script ? helmet.script.toString() : "";
      const htmlAttrsStr = helmet?.htmlAttributes ? helmet.htmlAttributes.toString() : "";
      const bodyAttrsStr = helmet?.bodyAttributes ? helmet.bodyAttributes.toString() : "";

      // Replace <html> attributes if available
      if (htmlAttrsStr) {
        html = html.replace("<html", `<html ${htmlAttrsStr}`);
      }

      // Replace <body> attributes if available
      if (bodyAttrsStr) {
        html = html.replace("<body", `<body ${bodyAttrsStr}`);
      }

      // Inject helmet head tags
      const headContent = [titleStr, metaStr, linkStr, scriptStr].filter(Boolean).join("\n    ");

      // Remove any default title tag from raw template if helmet supplied a new one
      if (titleStr) {
        html = html.replace(/<title>[\s\S]*?<\/title>/i, "");
      }

      // Inject head content before </head>
      html = html.replace("</head>", `  ${headContent}\n</head>`);

      // Inject rendered app HTML into #root
      html = html.replace(
        /<div id="root">[\s\S]*?<\/div>/,
        `<div id="root">${appHtml}</div>`
      );

      // Save output
      let destPath;
      if (routeUrl === "/") {
        destPath = path.join(clientDir, "index.html");
      } else {
        const routeFolder = path.join(clientDir, routeUrl.slice(1));
        fs.mkdirSync(routeFolder, { recursive: true });
        destPath = path.join(routeFolder, "index.html");
      }

      fs.writeFileSync(destPath, html, "utf-8");
      successCount++;
    } catch (err) {
      console.error(`[SSG Prerender Error] Failed rendering route ${routeUrl}:`, err);
    }
  }

  console.log(`[SSG Prerender] Successfully pre-rendered ${successCount}/${routes.length} pages.`);

  // Merge dist/client contents into final dist directory
  console.log("[SSG Prerender] Copying generated files to final dist directory...");

  function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      fs.readdirSync(src).forEach((childItemName) => {
        copyRecursiveSync(
          path.join(src, childItemName),
          path.join(dest, childItemName)
        );
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  copyRecursiveSync(clientDir, finalDistDir);

  // Clean up temporary folders
  fs.rmSync(clientDir, { recursive: true, force: true });
  fs.rmSync(ssrDir, { recursive: true, force: true });

  console.log("[SSG Prerender] Pre-rendering complete!");
}

main().catch((e) => {
  console.error("[SSG Prerender Fatal Error]", e);
  process.exit(1);
});
