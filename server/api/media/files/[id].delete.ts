import { directusFetch } from '../../../utils/directus';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'File ID is required' });
  }
  
  try {
    await directusFetch(event, `/files/${id}`, {
      method: 'DELETE'
    });
    return { success: true };
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.message || 'Failed to delete file',
    });
  }
});
