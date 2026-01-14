import { defineEventHandler, readBody } from "h3";
import { backgroundController } from "../../utils/backgroundController";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { action, item, index } = body;

  console.log(
    `[Server] API | POST /api/background/waiting-list | Action: ${action}`
  );

  if (action === "add" && item) {
    backgroundController.addToWaitingList(item);
    return { success: true };
  }

  if (action === "remove" && typeof index === "number") {
    backgroundController.removeFromWaitingList(index);
    return { success: true };
  }

  return { success: false, error: "Invalid action" };
});
