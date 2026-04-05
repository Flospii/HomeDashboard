import { getDirectusInternalUrl } from "../../../utils/directus";
import { proxyRequest } from "h3";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "File ID is required",
    });
  }

  const directusUrl = getDirectusInternalUrl();

  const assetUrl = `${directusUrl}/assets/${id}`;

  return proxyRequest(event, assetUrl);
});
