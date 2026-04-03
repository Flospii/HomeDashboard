import { directusFetch } from '../../utils/directus';

export default defineEventHandler(async (event) => {
  // get folders
  try {
    const res = await directusFetch<{ data: any[] }>(event, '/folders?limit=-1');
    return res.data || [];
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.message || 'Failed to fetch folders',
    });
  }
});
