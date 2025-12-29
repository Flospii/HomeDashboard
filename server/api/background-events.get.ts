import { defineEventHandler, setResponseHeader, createError } from "h3";
import { eventBus } from "../utils/eventBus";

export default defineEventHandler(async (event) => {
  // Set headers for SSE
  setResponseHeader(event, "Content-Type", "text/event-stream");
  setResponseHeader(event, "Cache-Control", "no-cache");
  setResponseHeader(event, "Connection", "keep-alive");

  const sendEvent = (data: any) => {
    event.node.res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const onCommand = (command: any) => {
    sendEvent(command);
  };

  eventBus.on("background-command", onCommand);

  // Keep connection alive with a heartbeat
  const heartbeat = setInterval(() => {
    event.node.res.write(": heartbeat\n\n");
  }, 30000);

  // Clean up on connection close
  event.node.res.on("close", () => {
    eventBus.off("background-command", onCommand);
    clearInterval(heartbeat);
  });

  // We need to prevent Nitro from closing the response automatically
  return new Promise(() => {});
});
