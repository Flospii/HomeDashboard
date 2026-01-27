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
    const items: {
      title: string;
      description: string;
      pubDate: string;
      formattedDate: string;
      formattedTime: string;
    }[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemContent = match[1];
      if (!itemContent) continue;

      // Handle both plain text and CDATA titles/descriptions
      const titleMatch =
        /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/.exec(
          itemContent,
        );
      const descMatch =
        /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/.exec(
          itemContent,
        );
      const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(itemContent);

      if (titleMatch && titleMatch[1]) {
        // Basic HTML entity decoding for common entities
        const decode = (str: string) =>
          str
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/<[^>]*>/g, "") // Strip HTML tags
            .trim();

        let title = decode(titleMatch[1]);
        let description = descMatch ? decode(descMatch[1]) : "";

        if (title) {
          const rawPubDate = (pubDateMatch && pubDateMatch[1]) || "";
          let formattedDate = "";
          let formattedTime = "";

          if (rawPubDate) {
            try {
              const date = new Date(rawPubDate);
              if (!isNaN(date.getTime())) {
                // Format: DD.MM.
                const day = String(date.getDate()).padStart(2, "0");
                const month = String(date.getMonth() + 1).padStart(2, "0");
                formattedDate = `${day}.${month}.`;

                // Format: HH:mm
                const hours = String(date.getHours()).padStart(2, "0");
                const minutes = String(date.getMinutes()).padStart(2, "0");
                formattedTime = `${hours}:${minutes}`;
              }
            } catch (e) {
              // Fallback to empty strings if parsing fails
            }
          }

          items.push({
            title,
            description,
            pubDate: rawPubDate,
            formattedDate,
            formattedTime,
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
