import { getDirectusUrl } from "../../utils/directus";
import { proxyRequest } from "h3";
import { joinURL } from "ufo";

export default defineEventHandler(async (event) => {
  const directusUrl = getDirectusUrl();
  
  // Extract the internal path by removing the /api/directus prefix
  const path = event.path.replace(/^\/api\/directus/, "");
  const target = joinURL(directusUrl, path);

  // Proxy the request to the real Directus instance
  // This preserves headers, body, and query parameters
  return proxyRequest(event, target);
});
