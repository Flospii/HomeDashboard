import { defineNitroPlugin } from "nitropack/runtime";
import { configManager } from "../utils/config";
import { backgroundController } from "../utils/backgroundController";

export default defineNitroPlugin(async (nitroApp) => {
  const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";

  // Defer execution to ensure Directus has enough time to finish booting its internal DB migrations
  setTimeout(async () => {
    try {
      console.log(
        "[Server] DirectusSetup | Checking if 'dashboard_config' collection exists...",
      );

      // Authenticate using the default admin credentials we set in docker-compose.yml
      const authRes = await fetch(`${DIRECTUS_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@example.com",
          password: "admin",
        }),
      });

      const authJson = await authRes.json();

      if (!authJson.data?.access_token) {
        console.log(
          "[Server] DirectusSetup | Could not authenticate using default admin account. Assuming custom setup.",
        );
        return;
      }

      const token = authJson.data.access_token;

      const grantPublicRead = async (collection: string) => {
        try {
          // Check if permission already exists to avoid duplicates/errors
          const checkRes = await fetch(`${DIRECTUS_URL}/permissions?filter[collection][_eq]=${collection}&filter[role][_null]=true&filter[action][_eq]=read`, {
             headers: { Authorization: `Bearer ${token}` }
          });
          const checkJson = await checkRes.json();
          if (checkJson.data && checkJson.data.length > 0) return;

          console.log(`[Server] DirectusSetup | Granting Public READ to ${collection}...`);
          await fetch(`${DIRECTUS_URL}/permissions`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              collection,
              action: "read",
              fields: ["*"],
              role: null
            }),
          });
        } catch (e) {
          console.error(`[Server] DirectusSetup | Failed to grant permissions for ${collection}`, e);
        }
      };

      // Check if the collection already exists
      const collRes = await fetch(`${DIRECTUS_URL}/collections/dashboard_config`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (collRes.status === 403 || collRes.status === 404 || (await collRes.json()).errors) {
        console.log(
          "[Server] DirectusSetup | Collection not found. Creating it automatically...",
        );

        // Auto-create the collection with all required fields in one API call
        const createRes = await fetch(`${DIRECTUS_URL}/collections`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            collection: "dashboard_config",
            meta: {
              collection: "dashboard_config",
              icon: "settings",
              note: "Home Dashboard Configuration",
              display_template: "{{id}}",
              hidden: false,
              singleton: false,
            },
            schema: {
              name: "dashboard_config",
            },
            fields: [
              {
                field: "id",
                type: "string",
                meta: {
                  hidden: true,
                  interface: "input",
                  readonly: true,
                },
                schema: {
                  is_primary_key: true,
                  has_auto_increment: false,
                },
              },
              {
                field: "background",
                type: "json",
                meta: {
                  interface: "input-code",
                },
              },
              {
                field: "language",
                type: "string",
                meta: {
                  interface: "input",
                },
              },
              {
                field: "modules",
                type: "json",
                meta: {
                  interface: "input-code",
                },
              },
            ],
          }),
        });

        if (createRes.ok) {
          console.log("[Server] DirectusSetup | Successfully provisionsed 'dashboard_config'!");
          
          await grantPublicRead("dashboard_config");
          await grantPublicRead("directus_files");

          // Seed the initial fallback data so it's not empty
          const initialConfig = configManager.getConfig();
          
          const seedRes = await fetch(`${DIRECTUS_URL}/items/dashboard_config`, {
             method: "POST",
             headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
             },
             body: JSON.stringify({
                id: "1",
                background: initialConfig.background,
                language: initialConfig.language,
                modules: initialConfig.modules
             })
          });
          
          if (seedRes.ok) {
            console.log("[Server] DirectusSetup | Successfully seeded default configuration!");
          } else {
            console.error("[Server] DirectusSetup | Failed to seed default data", await seedRes.text());
          }
        }
      } else {
        console.log(
          "[Server] DirectusSetup | 'dashboard_config' already exists. Synchronizing permissions...",
        );
        
        await grantPublicRead("dashboard_config");
        await grantPublicRead("directus_files");

        const itemRes = await fetch(`${DIRECTUS_URL}/items/dashboard_config/1`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!itemRes.ok) {
          console.log("[Server] DirectusSetup | Row 1 is missing! Seeding it now...");
          const initialConfig = configManager.getConfig();
          
          const seedRes = await fetch(`${DIRECTUS_URL}/items/dashboard_config`, {
             method: "POST",
             headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
             },
             body: JSON.stringify({
                id: "1",
                background: initialConfig.background,
                language: initialConfig.language,
                modules: initialConfig.modules
             })
          });
          
          if (seedRes.ok) {
            console.log("[Server] DirectusSetup | Successfully seeded default configuration!");
          } else {
            console.error("[Server] DirectusSetup | Failed to seed default data", await seedRes.text());
          }
        }
      }
      
      // Always ensure the controller is in sync after the check loop
      await backgroundController.reconfigure();
    } catch (e) {
      console.error("[Server] DirectusSetup | Auto-setup encountered an error:", e);
    }
  }, 10000); // 10s gives Directus docker container plenty of time to boot first
});
