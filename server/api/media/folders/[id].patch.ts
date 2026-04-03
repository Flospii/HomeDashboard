import { createDirectusClient } from '../../../utils/directus';
import { updateFolder } from '@directus/sdk';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Folder ID is required' });
  }
  
  try {
    const client = createDirectusClient(event);
    return await client.request(updateFolder(id, body));
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.message || 'Failed to update folder',
    });
  }
});

