import { createDirectusClient } from '../../../utils/directus';
import { deleteFolder } from '@directus/sdk';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Folder ID is required' });
  }
  
  try {
    const client = createDirectusClient(event);
    await client.request(deleteFolder(id));
    return { success: true };
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.message || 'Failed to delete folder',
    });
  }
});

