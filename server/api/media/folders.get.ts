import { createDirectusClient } from '../../utils/directus';
import { readFolders } from '@directus/sdk';

export default defineEventHandler(async (event) => {
  try {
    const client = createDirectusClient(event);
    const folders = await client.request(readFolders({ limit: -1 }));
    return folders || [];
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.message || 'Failed to fetch folders',
    });
  }
});

