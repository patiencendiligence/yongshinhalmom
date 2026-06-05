import fs from "fs";
import path from "path";

const DOMAIN = "https://yongshinhalmom.vercel.app";

const urls = [
  "",
  "/pricing",
  "/policies",
];

function scan(dir, routePrefix = "") {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      scan(fullPath, `${routePrefix}/${file}`);
      return;
    }

    if (!file.endsWith(".md")) return;

    const slug = file.replace(".md", "");

    urls.push(`${routePrefix}/${slug}`);
  });
}

scan("./src/data");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urls
  .map(
    (url) => `
<url>
  <loc>${DOMAIN}${url}</loc>
</url>`
  )
  .join("")}

</urlset>
`;

fs.writeFileSync("./public/sitemap.xml", xml);

console.log(`Generated sitemap (${urls.length} urls)`);