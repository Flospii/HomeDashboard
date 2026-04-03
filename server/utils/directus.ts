import { H3Event, getCookie, getHeader, createError } from 'h3';

export const getDirectusToken = (event: H3Event) => {
  // First check Authorization header
  const authHeader = getHeader(event, 'Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  
  // nuxt-directus default cookie name
  const token = getCookie(event, 'directus_access_token');
  
  // Return undefined if no token is found, allowing public access where permitted by Directus
  return token || undefined;
};

export const getDirectusUrl = () => {
  return process.env.DIRECTUS_INTERNAL_URL || process.env.DIRECTUS_URL || 'http://localhost:8055';
};

export const directusFetch = async <T>(event: H3Event, path: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> => {
  const token = getDirectusToken(event);
  const baseUrl = getDirectusUrl();
  const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  
  const headers: Record<string, string> = { ...options.headers as any };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await $fetch(url, { ...options, headers });
    return response as unknown as T;
  } catch (err: any) {
    // If we got a 401 with a token (stale/expired cookie), retry without the token as a public request
    if (token && err?.response?.status === 401) {
      delete headers['Authorization'];
      const response = await $fetch(url, { ...options, headers });
      return response as unknown as T;
    }
    throw err;
  }
};
