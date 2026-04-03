import { defineNitroPlugin } from "nitropack/runtime";
import { configManager } from "../utils/config";
import { backgroundController } from "../utils/backgroundController";

export default defineNitroPlugin(async (nitroApp) => {
  const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
  const DIRECTUS_INTERNAL_URL = process.env.DIRECTUS_INTERNAL_URL || DIRECTUS_URL;

  try {
    console.log(
      "[Server] DirectusSetup | Checking if 'dashboard_config' collection exists...",
    );

    // Authenticate using the default admin credentials we set in docker-compose.yml
    const authRes = await fetch(`${DIRECTUS_INTERNAL_URL}/auth/login`, {
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

    // Find the Public policy (Directus 11 requirement)
    let publicPolicyId: string | null = null;
    try {
      const policiesRes = await fetch(`${DIRECTUS_INTERNAL_URL}/policies?limit=-1`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const policiesJson = await policiesRes.json();
      const policies = policiesJson.data || [];
      
      // Find public policy by name or properties
      const publicPolicy = policies.find((p: any) => 
        p.name === "Public" || 
        p.name?.toLowerCase() === "public" || 
        p.name === "Public Policy" ||
        (p.admin_access === false && p.app_access === true && !p.role)
      );
      
      if (publicPolicy) {
        publicPolicyId = publicPolicy.id;
      } else {
        // Fallback: Check /access to see what's linked to the null/public role
        const accessRes = await fetch(`${DIRECTUS_INTERNAL_URL}/access?filter[role][_null]=true`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const accessJson = await accessRes.json();
        publicPolicyId = accessJson.data?.[0]?.policy || null;
      }
      
      if (!publicPolicyId) {
        const newPolicyRes = await fetch(`${DIRECTUS_INTERNAL_URL}/policies`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ 
             name: "Public", 
             icon: "public", 
             description: "Auto-generated public access policy",
             app_access: true,
             admin_access: false
          })
        });
        if (newPolicyRes.ok) {
          const newPolicyJson = await newPolicyRes.json();
          publicPolicyId = newPolicyJson.data?.id;
          
          // Link it to the "null" role (Public)
          await fetch(`${DIRECTUS_INTERNAL_URL}/access`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ role: null, policy: publicPolicyId })
          });
        }
      }
      
      if (publicPolicyId) {
         console.log(`[Server] DirectusSetup | Public Policy active: ${publicPolicyId}`);
      }
    } catch (e) {
      console.error("[Server] DirectusSetup | Error during Public policy discovery:", e);
    }

    const revokePublicAccess = async (collection: string, action: string) => {
      if (!publicPolicyId) return;
      try {
        const checkRes = await fetch(`${DIRECTUS_INTERNAL_URL}/permissions?filter[collection][_eq]=${collection}&filter[policy][_eq]=${publicPolicyId}&filter[action][_eq]=${action}`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        const checkJson = await checkRes.json();
        if (checkJson.data && checkJson.data.length > 0) {
          console.log(`[Server] DirectusSetup | Revoking Public ${action.toUpperCase()} from ${collection}...`);
          for (const perm of checkJson.data) {
            await fetch(`${DIRECTUS_INTERNAL_URL}/permissions/${perm.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` }
            });
          }
        }
      } catch (e) {
        console.error(`[Server] DirectusSetup | Failed to revoke ${action} for ${collection}`, e);
      }
    };

    const grantPublicAccess = async (collection: string, action: string = "read") => {
      if (!publicPolicyId) return;
      try {
        // Check if permission already exists to avoid duplicates/errors
        const checkRes = await fetch(`${DIRECTUS_INTERNAL_URL}/permissions?filter[collection][_eq]=${collection}&filter[policy][_eq]=${publicPolicyId}&filter[action][_eq]=${action}`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        const checkJson = await checkRes.json();
        if (checkJson.data && checkJson.data.length > 0) return;

        console.log(`[Server] DirectusSetup | Granting Public ${action.toUpperCase()} to ${collection}...`);
        const res = await fetch(`${DIRECTUS_INTERNAL_URL}/permissions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            collection,
            action,
            fields: ["*"],
            policy: publicPolicyId
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          console.error(`[Server] DirectusSetup | Failed to grant ${action} for ${collection} | Status: ${res.status} | ${err}`);
        } else {
          console.log(`[Server] DirectusSetup | Successfully granted Public ${action.toUpperCase()} to ${collection}`);
        }
      } catch (e) {
        console.error(`[Server] DirectusSetup | Failed to grant ${action} for ${collection}`, e);
      }
    };

    // Check if the collection already exists
    const collRes = await fetch(`${DIRECTUS_INTERNAL_URL}/collections/dashboard_config`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (collRes.status === 403 || collRes.status === 404 || (await collRes.json()).errors) {
      console.log(
        "[Server] DirectusSetup | Collection not found. Creating it automatically...",
      );

      // Auto-create the collection with all required fields in one API call
      const createRes = await fetch(`${DIRECTUS_INTERNAL_URL}/collections`, {
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
        console.log("[Server] DirectusSetup | Successfully provisioned 'dashboard_config'!");
        
        await grantPublicAccess("dashboard_config", "read");
        await grantPublicAccess("directus_files", "read");
        await grantPublicAccess("directus_files", "create");
        await grantPublicAccess("directus_folders", "read");

        // Seed the initial fallback data so it's not empty
        const initialConfig = configManager.getConfig();
        console.log("[Server] DirectusSetup | Seeding initial configuration...");
        
        const seedRes = await fetch(`${DIRECTUS_INTERNAL_URL}/items/dashboard_config`, {
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
          const errorText = await seedRes.text();
          console.error("[Server] DirectusSetup | Failed to seed default data | Status:", seedRes.status, "| Error:", errorText);
          
          // Try without ID just in case there's an auto-increment mismatch
          console.log("[Server] DirectusSetup | Retrying seed without explicit ID...");
          await fetch(`${DIRECTUS_INTERNAL_URL}/items/dashboard_config`, {
             method: "POST",
             headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
             },
             body: JSON.stringify({
                background: initialConfig.background,
                language: initialConfig.language,
                modules: initialConfig.modules
             })
          });
        }
      }
    } else {
      console.log(
        "[Server] DirectusSetup | 'dashboard_config' already exists. Synchronizing permissions...",
      );
      
      await grantPublicAccess("dashboard_config", "read");
      await revokePublicAccess("dashboard_config", "create");
      await revokePublicAccess("dashboard_config", "update");
      await grantPublicAccess("directus_files", "read");
      await grantPublicAccess("directus_files", "create");
      await grantPublicAccess("directus_folders", "read");

      const itemRes = await fetch(`${DIRECTUS_INTERNAL_URL}/items/dashboard_config/1`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!itemRes.ok) {
        console.log("[Server] DirectusSetup | Row 1 is missing! Seeding it now...");
        const initialConfig = configManager.getConfig();
        
        const seedRes = await fetch(`${DIRECTUS_INTERNAL_URL}/items/dashboard_config`, {
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
          const errorText = await seedRes.text();
          console.error("[Server] DirectusSetup | Failed to seed default data | Status:", seedRes.status, "| Error:", errorText);
          
          // Try without ID just in case
          console.log("[Server] DirectusSetup | Retrying seed without explicit ID...");
          await fetch(`${DIRECTUS_INTERNAL_URL}/items/dashboard_config`, {
             method: "POST",
             headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
             },
             body: JSON.stringify({
                background: initialConfig.background,
                language: initialConfig.language,
                modules: initialConfig.modules
             })
          });
        }
      }
    }
    
    // Always ensure the controller is in sync after the check loop
    await backgroundController.reconfigure();
  } catch (e) {
    console.error("[Server] DirectusSetup | Auto-setup encountered an error:", e);
  }
});
