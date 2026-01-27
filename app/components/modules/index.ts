import type { ModuleDefinition } from "./BaseModule";

// Automatically import all module definitions from subdirectories
const modules = import.meta.glob<{ [key: string]: ModuleDefinition }>(
  "./*/index.ts",
  { eager: true },
);

export const AVAILABLE_MODULES: ModuleDefinition[] = Object.entries(modules)
  .map(([path, module]) => {
    // Skip BaseModule as it only contains the interface and base component
    if (path.includes("BaseModule")) return null;

    // Find the export that ends with 'ModuleDefinition'
    const definitionKey = Object.keys(module).find((key) =>
      key.endsWith("ModuleDefinition"),
    );

    return definitionKey ? module[definitionKey] : null;
  })
  .filter((m): m is ModuleDefinition => m !== null);

export const getModuleDefinition = (id: string) => {
  return AVAILABLE_MODULES.find((m) => m.id === id);
};
