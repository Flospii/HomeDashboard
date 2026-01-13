import { defineWebSocketHandler } from "h3";
import { backgroundController } from "../utils/backgroundController";
import type { DashboardConfig } from "../../app/types/config";

const peers = new Set<any>();

/**
 * Broadcasts the current background status to all connected clients.
 */
export function broadcastStatus() {
  const status = backgroundController.getStatus();
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
  open(peer) {
    peers.add(peer);
    // Send initial status immediately upon connection
    const status = backgroundController.getStatus();
    peer.send(JSON.stringify({ type: "status", data: status }));
  },
  close(peer) {
    peers.delete(peer);
  },
  error(peer, error) {
    console.error("[ws] error", peer, error);
    peers.delete(peer);
  },
  message(peer, message) {
    // Incoming messages from clients are not handled yet
  },
});
