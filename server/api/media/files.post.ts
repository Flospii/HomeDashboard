import { proxyRequest } from "h3";
import { getDirectusToken, getDirectusUrl } from "../../utils/directus";

export default defineEventHandler(async (event) => {
  const token = getDirectusToken(event);
  const baseUrl = getDirectusUrl();
  const url = `${baseUrl}/files`;

  // Inject the Directus API token into the forwarded request headers if we have one
  if (token) {
    event.node.req.headers["authorization"] = `Bearer ${token}`;
  }

  // Forward the host header properly for Directus if needed, though usually proxyRequest handles it.
  // We'll safely delete host so fetch recalculates it for the target URL
  delete event.node.req.headers["host"];

  try {
    // Stream the multipart form data payload straight to the backend
    // bypassing Nuxt's memory buffer (readMultipartFormData) to support large files
    return await proxyRequest(event, url);
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: error?.message || "Failed to upload file",
    });
  }
});
