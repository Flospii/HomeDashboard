import { defineEventHandler, getQuery, createError } from "h3";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const url = query.url as string;

  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: "URL is required",
    });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const xml = await response.text();

    // Simple regex to extract titles from RSS items
    // This is a basic implementation to avoid adding dependencies
    const items: { title: string; pubDate: string }[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemContent = match[1];
      if (!itemContent) continue;

      // Handle both plain text and CDATA titles
      const titleMatch =
        /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/.exec(
          itemContent
        );
      const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(itemContent);

      if (titleMatch && titleMatch[1]) {
        // Basic HTML entity decoding for common entities
        let title = titleMatch[1]
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .trim();

        if (title) {
          items.push({
            title,
            pubDate: (pubDateMatch && pubDateMatch[1]) || "",
          });
        }
      }

      // Limit to 10 items per feed to keep the ticker manageable
      if (items.length >= 10) break;
    }

    return items;
  } catch (error: any) {
    console.error(`Error fetching RSS feed from ${url}:`, error);
    return []; // Return empty array on error instead of throwing to keep the ticker running
  }
});
