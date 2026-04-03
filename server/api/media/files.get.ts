import { directusFetch } from '../../utils/directus';

export default defineEventHandler(async (event) => {
  try {
    const res = await directusFetch<{ data: any[] }>(event, '/files?limit=-1');
    const directusUrl = process.env.DIRECTUS_URL || 'http://localhost:8055';
    
    return res.data
      .filter((file: any) => {
        const t = file.type || '';
        const n = (file.filename_download || file.title || '').toLowerCase();
        return t.startsWith('image/') || t.startsWith('video/') || n.match(/\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|webm|ogg)$/);
      })
      .map((file: any) => {
        const t = file.type || '';
        const n = (file.filename_download || file.title || '').toLowerCase();
        return {
          id: file.id,
          url: `${directusUrl}/assets/${file.id}`,
          type: (t.startsWith('video/') || n.match(/\.(mp4|mov|webm|ogg)$/)) ? "video" : "image",
          folder: typeof file.folder === 'string' ? file.folder : file.folder?.id || "root",
        };
      });
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.message || 'Failed to fetch files',
    });
  }
});
