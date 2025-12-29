import { EventEmitter } from "node:events";

class GlobalEventBus extends EventEmitter {}

// Use a global variable to ensure the same instance is used across HMR and different modules
const globalForEventBus = global as unknown as { eventBus: GlobalEventBus };

export const eventBus = globalForEventBus.eventBus || new GlobalEventBus();

if (process.env.NODE_ENV !== "production") {
  globalForEventBus.eventBus = eventBus;
}
