import { directusFetch } from '../../../utils/directus';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const body = await readBody(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Folder ID is required' });
  }
  
  try {
    const res = await directusFetch<{ data: any }>(event, `/folders/${id}`, {
      method: 'PATCH',
      body
    });
    return res;
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.message || 'Failed to rename folder',
    });
  }
});
