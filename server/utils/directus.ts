import { H3Event, getCookie, getHeader } from "h3";
import {
  createDirectus,
  rest,
  staticToken,
  type DirectusFile,
  type DirectusFolder,
} from "@directus/sdk";

/**
 * Define the structure of our Directus instance for the SDK.
 * This ensures that built-in collections and our custom ones are fully typed.
 */
export interface DashboardSchema {
  dashboard_config: any[];
}

export const getDirectusToken = (event: H3Event) => {
  // First check Authorization header
  const authHeader = getHeader(event, "Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  // nuxt-directus default cookie name
  const token = getCookie(event, "directus_access_token");

  return token || undefined;
};

export const getDirectusUrl = () => {
  return process.env.DIRECTUS_URL || "http://localhost:8055";
};

/**
 * Creates a Directus SDK client instance.
 * @param event Optional H3Event to extract the user's token from.
 *              If not provided, uses DIRECTUS_SERVER_TOKEN for server-side admin access.
 */
export const createDirectusClient = (event?: H3Event) => {
  const url = getDirectusUrl();
  const client = createDirectus<DashboardSchema>(url).with(rest());

  const userToken = event ? getDirectusToken(event) : undefined;
  const serverToken = process.env.DIRECTUS_SERVER_TOKEN;

  if (userToken && userToken !== "undefined" && userToken !== "null") {
    return client.with(staticToken(userToken));
  } else if (serverToken) {
    return client.with(staticToken(serverToken));
  }

  return client;
};
