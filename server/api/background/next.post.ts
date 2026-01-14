import { defineEventHandler } from "h3";
import { backgroundController } from "../../utils/backgroundController";

export default defineEventHandler(async () => {
  console.log("[Server] API | POST /api/background/next");
  await backgroundController.next();
  return backgroundController.getStatus();
});
