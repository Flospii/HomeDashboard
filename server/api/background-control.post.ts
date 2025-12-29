import { defineEventHandler, readBody, createError } from "h3";
import { eventBus } from "../utils/eventBus";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body || !body.command) {
    throw createError({
      statusCode: 400,
      statusMessage: "Command is required",
    });
  }

  // Emit the command to the event bus
  eventBus.emit("background-command", body);

  return { success: true };
});
