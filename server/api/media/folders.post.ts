import { directusFetch } from '../../utils/directus';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  try {
    const res = await directusFetch<{ data: any }>(event, '/folders', {
      method: 'POST',
      body
    });
    return res;
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.message || 'Failed to create folder',
    });
  }
});
