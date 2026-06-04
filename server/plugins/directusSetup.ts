import { defineNitroPlugin } from "nitropack/runtime";
import { configManager } from "../utils/config";
import { backgroundController } from "../utils/backgroundController";
import { getDirectusUrl } from "../utils/directus";
import {
  createDirectus,
  rest,
  login,
  readCollections,
  createCollection,
  readPermissions,
  createPermission,
  deletePermission,
  readPolicies,
  createPolicy,
  readItems,
  createItem,
  readItem,
  staticToken,
} from "@directus/sdk";

export default defineNitroPlugin(async (nitroApp) => {
  try {
    console.log(
      "[Server] DirectusSetup | Checking if 'dashboard_config' collection exists...",
    );

    // Initialize the SDK client for internal setup
    const client = createDirectus(getDirectusUrl()).with(rest());

    // Authenticate using the default admin credentials
    let authResult;
    try {
      authResult = await client.request(
        login({ email: process.env.DIRECTUS_EMAIL || "", password: process.env.DIRECTUS_PASSWORD || "" }),
      );
      console.log("[Server] DirectusSetup | Authenticated using default admin account.");
    } catch (e) {
      console.log(
        "[Server] DirectusSetup | Could not authenticate using default admin account. Assuming custom setup.",
      );
      return;
    }

    const token = authResult.access_token;
    if (!token) return;

    // Use the token for subsequent requests
    const adminClient = client.with(staticToken(token));

    // Find the Public policy (Directus 11+ requirement)
    let publicPolicyId: string | null = null;
    try {
      const policies = await adminClient.request(readPolicies({ limit: -1 }));

      const publicPolicy = policies.find(
        (p: any) =>
          p.name === "Public" ||
          p.name?.toLowerCase() === "public" ||
          p.name === "Public Policy" ||
          (p.admin_access === false && p.app_access === true && !p.role),
      );

      if (publicPolicy) {
        publicPolicyId = publicPolicy.id;
      } else {
        // Fallback: Check /access via raw request to avoid 'core collection' restrictions
        const access = (await adminClient.request(() => ({
          method: "GET",
          path: "/access",
          params: { filter: { role: { _null: true } } },
        }))) as any;
        publicPolicyId =
          access?.data?.[0]?.policy || access?.[0]?.policy || null;
      }

      if (!publicPolicyId) {
        console.log("[Server] DirectusSetup | Creating Public Policy...");
        const newPolicy = await adminClient.request(
          createPolicy({
            name: "Public",
            icon: "public",
            description: "Auto-generated public access policy",
            app_access: true,
            admin_access: false,
          }),
        );
        publicPolicyId = newPolicy.id;

        // Link it to the "null" role (Public) via raw request
        await adminClient.request(() => ({
          method: "POST",
          path: "/access",
          body: JSON.stringify({
            role: null,
            policy: publicPolicyId,
          }),
        }));
      }

      if (publicPolicyId) {
        console.log(
          `[Server] DirectusSetup | Public Policy active: ${publicPolicyId}`,
        );
      }
    } catch (e) {
      console.error(
        "[Server] DirectusSetup | Error during Public policy discovery:",
        e,
      );
    }

    const grantPublicAccess = async (
      collection: string,
      action: string = "read",
    ) => {
      if (!publicPolicyId) return;
      try {
        const existing = await adminClient.request(
          readPermissions({
            filter: {
              collection: { _eq: collection },
              policy: { _eq: publicPolicyId },
              action: { _eq: action },
            },
          }),
        );

        if (existing && existing.length > 0) return;

        console.log(
          `[Server] DirectusSetup | Granting Public ${action.toUpperCase()} to ${collection}...`,
        );
        await adminClient.request(
          createPermission({
            collection,
            action,
            fields: ["*"],
            policy: publicPolicyId,
          }),
        );
        console.log(
          `[Server] DirectusSetup | Successfully granted Public ${action.toUpperCase()} to ${collection}`,
        );
      } catch (e) {
        console.error(
          `[Server] DirectusSetup | Failed to grant ${action} for ${collection}`,
          e,
        );
      }
    };

    // Check if the collection exists
    let collectionExists = false;
    try {
      const cols = (await adminClient.request(readCollections())) as any[];
      if (cols && Array.isArray(cols)) {
        collectionExists = cols.some(
          (c: any) => c.collection === "dashboard_config",
        );
      }
    } catch (e) {}

    if (!collectionExists) {
      console.log(
        "[Server] DirectusSetup | Collection not found. Creating it automatically...",
      );

      await adminClient.request(
        createCollection({
          collection: "dashboard_config",
          meta: {
            icon: "settings",
            note: "Home Dashboard Configuration",
            display_template: "{{id}}",
            singleton: false,
          },
          schema: {},
          fields: [
            {
              field: "id",
              type: "string",
              meta: { hidden: true, interface: "input", readonly: true },
              schema: { is_primary_key: true, has_auto_increment: false },
            },
            {
              field: "background",
              type: "json",
              meta: { interface: "input-code" },
            },
            {
              field: "language",
              type: "string",
              meta: { interface: "input" },
            },
            {
              field: "modules",
              type: "json",
              meta: { interface: "input-code" },
            },
          ],
        }),
      );

      console.log(
        "[Server] DirectusSetup | Successfully provisioned 'dashboard_config'!",
      );

      await grantPublicAccess("dashboard_config", "read");
      await grantPublicAccess("directus_files", "read");
      await grantPublicAccess("directus_files", "create");
      await grantPublicAccess("directus_folders", "read");

      // Seed initial data
      const initialConfig = configManager.getConfig();
      console.log("[Server] DirectusSetup | Seeding initial configuration...");
      try {
        await adminClient.request(
          createItem("dashboard_config", {
            id: "1",
            background: initialConfig.background,
            language: initialConfig.language,
            modules: initialConfig.modules,
          }),
        );
        console.log(
          "[Server] DirectusSetup | Successfully seeded default configuration!",
        );
      } catch (e) {
        console.error(
          "[Server] DirectusSetup | Failed to seed default data, retrying without explicit ID...",
        );
        await adminClient.request(
          createItem("dashboard_config", {
            background: initialConfig.background,
            language: initialConfig.language,
            modules: initialConfig.modules,
          }),
        );
      }
    } else {
      console.log(
        "[Server] DirectusSetup | 'dashboard_config' already exists. Synchronizing permissions...",
      );

      await grantPublicAccess("dashboard_config", "read");
      await grantPublicAccess("directus_files", "read");
      await grantPublicAccess("directus_files", "create");
      await grantPublicAccess("directus_folders", "read");

      // Ensure row 1 exists
      try {
        await adminClient.request(readItem("dashboard_config", "1"));
      } catch (e) {
        console.log(
          "[Server] DirectusSetup | Row 1 is missing! Seeding it now...",
        );
        const initialConfig = configManager.getConfig();
        await adminClient
          .request(
            createItem("dashboard_config", {
              id: "1",
              background: initialConfig.background,
              language: initialConfig.language,
              modules: initialConfig.modules,
            }),
          )
          .catch(() => {
            return adminClient.request(
              createItem("dashboard_config", {
                background: initialConfig.background,
                language: initialConfig.language,
                modules: initialConfig.modules,
              }),
            );
          });
        console.log(
          "[Server] DirectusSetup | Successfully seeded default configuration!",
        );
      }
    }

    // Always ensure the controller is in sync
    await backgroundController.reconfigure();
  } catch (e) {
    console.error(
      "[Server] DirectusSetup | Auto-setup encountered an error:",
      e,
    );
  }
});
