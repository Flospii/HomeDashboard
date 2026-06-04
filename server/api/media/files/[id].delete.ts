import { createDirectusClient } from '../../../utils/directus';
import { deleteFile } from '@directus/sdk';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'File ID is required' });
  }
  
  try {
    const client = createDirectusClient(event);
    await client.request(deleteFile(id));
    return { success: true };
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.message || 'Failed to delete file',
    });
  }
});

