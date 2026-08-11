// src/lib/markdownLoader.ts

export const markdownModules = import.meta.glob(
  "../data/**/*.md",
  {
    query: "?raw",
    import: "default",
    eager: true,
  }
) as Record<string, string>;
