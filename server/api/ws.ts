import { defineWebSocketHandler } from "h3";
import { backgroundController } from "../utils/backgroundController";
import type { DashboardConfig } from "../../app/types/config";

const peers = new Set<any>();

/**
 * Broadcasts the current background status to all connected clients.
 */
export async function broadcastStatus() {
  const status = await backgroundController.getStatus();
  console.log(
    `[Server] WebSocket | Broadcast | Status (stateId: ${status.stateId})`
  );
  const message = JSON.stringify({ type: "status", data: status });
  for (const peer of peers) {
    peer.send(message);
  }
}

/**
 * Broadcasts the dashboard configuration to all connected clients.
 * @param config The new configuration object.
 */
export function broadcastConfig(config: DashboardConfig) {
  console.log(`[Server] WebSocket | Broadcast | Config`);
  const message = JSON.stringify({ type: "config", data: config });
  for (const peer of peers) {
    peer.send(message);
  }
}

// Listen for background state changes and broadcast them
backgroundController.setOnStateChange(() => {
  broadcastStatus();
});

export default defineWebSocketHandler({
  async open(peer) {
    peers.add(peer);
    console.log(`[Server] WebSocket | Client Connected (Total: ${peers.size})`);
    // Send initial status immediately upon connection
    const status = await backgroundController.getStatus();
    peer.send(JSON.stringify({ type: "status", data: status }));
  },
  close(peer) {
    peers.delete(peer);
    console.log(
      `[Server] WebSocket | Client Disconnected (Total: ${peers.size})`
    );
  },
  error(peer, error) {
    console.error("[Server] WebSocket | Error", error);
    peers.delete(peer);
  },
  message(peer, message) {
    // Incoming messages from clients are not handled yet
  },
});
