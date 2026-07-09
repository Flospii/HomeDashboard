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
  readPolicies,
  createPolicy,
  createItem,
  readItem,
  staticToken,
} from "@directus/sdk";

export default defineNitroPlugin(async (nitroApp) => {
  const maxRetries = 10;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      attempt++;
      console.log(
        `[Server] DirectusSetup | Checking if 'dashboard_config' collection exists (Attempt ${attempt}/${maxRetries})...`,
      );

      // Initialize the SDK client for internal setup
      const client = createDirectus(getDirectusUrl()).with(rest());

      // Authenticate using the default admin credentials
      let authResult;
      try {
        authResult = await client.request(
          login({
            email: process.env.DIRECTUS_EMAIL || "",
            password: process.env.DIRECTUS_PASSWORD || "",
          }),
        );
        console.log(
          "[Server] DirectusSetup | Authenticated using default admin account.",
        );
      } catch (e: any) {
        const msg = (e.message || e || "").toString();
        // If it's a credentials / permissions error, abort setup (retrying won't fix it)
        if (msg.includes("invalid") || msg.includes("credentials") || msg.includes("Forbidden") || e?.response?.status === 401) {
          console.log(
            "[Server] DirectusSetup | Could not authenticate. Assuming custom setup or admin credentials changed.",
          );
          return;
        }
        console.log(`[Server] DirectusSetup | Authentication failed due to connection issue: ${msg}`);
        throw e;
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
      } catch (e: any) {
        console.error(
          "[Server] DirectusSetup | Error during Public policy discovery:",
          e.message || e,
        );
        throw e;
      }

      const grantPublicAccess = async (
        collection: string,
        action: string = "read",
      ) => {
        if (!publicPolicyId) return;
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
      };

      // Check if the collection exists
      const cols = (await adminClient.request(readCollections())) as any[];
      const collectionExists = cols && Array.isArray(cols) && cols.some(
        (c: any) => c.collection === "dashboard_config",
      );

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
        } catch (e: any) {
          console.error(
            "[Server] DirectusSetup | Failed to seed default data, retrying without explicit ID:",
            e.message || e,
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
        } catch (e: any) {
          const status = e?.response?.status;
          const code = e?.errors?.[0]?.extensions?.code;
          const isNotFound = status === 404 || code === 'RECORD_NOT_FOUND' || (e.message && e.message.includes("Record not found"));

          if (isNotFound) {
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
              .catch((err: any) => {
                console.log(
                  "[Server] DirectusSetup | Seeding row 1 failed (might have been created concurrently):",
                  err.message || err,
                );
              });
            console.log(
              "[Server] DirectusSetup | Successfully seeded default configuration!",
            );
          } else {
            console.error(
              "[Server] DirectusSetup | Error verifying if Row 1 exists, skipping seeding to avoid overwriting:",
              e.message || e,
            );
            throw e; // Propagate to retry loop
          }
        }
      }

      // Always ensure the controller is in sync
      await backgroundController.reconfigure();

      console.log("[Server] DirectusSetup | Auto-setup completed successfully.");
      break;
    } catch (e: any) {
      console.error(
        `[Server] DirectusSetup | Auto-setup encountered an error on attempt ${attempt}:`,
        e.message || e,
      );
      if (attempt < maxRetries) {
        console.log("[Server] DirectusSetup | Retrying in 5 seconds...");
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        console.error(
          "[Server] DirectusSetup | Max retries reached. Auto-setup failed.",
        );
      }
    }
  }
});
