import { createDirectusClient } from '../../utils/directus';
import { createFolder } from '@directus/sdk';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  try {
    const client = createDirectusClient(event);
    return await client.request(createFolder(body));
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.message || 'Failed to create folder',
    });
  }
});

