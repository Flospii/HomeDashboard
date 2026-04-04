import { createDirectusClient, getDirectusUrl } from "../../utils/directus";
import { readFiles } from "@directus/sdk";

export default defineEventHandler(async (event) => {
  try {
    const client = createDirectusClient(event);
    const files = (await client.request(
      readFiles({
        limit: -1,
        fields: [
          "id",
          "type",
          "filename_download",
          "title",
          "metadata",
          { folder: ["id"] },
        ],
      }),
    )) as any[];
    const directusUrl = getDirectusUrl();

    return (files || [])
      .filter((file) => {
        const t = file.type || "";
        const n = (file.filename_download || file.title || "").toLowerCase();
        return (
          t.startsWith("image/") ||
          t.startsWith("video/") ||
          n.match(/\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|webm|ogg)$/)
        );
      })
      .map((file) => {
        const t = file.type || "";
        const n = (file.filename_download || file.title || "").toLowerCase();
        return {
          id: file.id,
          type:
            t.startsWith("video/") || n.match(/\.(mp4|mov|webm|ogg)$/)
              ? "video"
              : "image",
          folder:
            typeof file.folder === "string"
              ? file.folder
              : file.folder?.id || "root",
        };
      });
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.message || "Failed to fetch files",
    });
  }
});
