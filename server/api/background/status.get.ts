import { defineEventHandler } from "h3";
import { backgroundController } from "../../utils/backgroundController";

export default defineEventHandler(async () => {
  console.log(
    `[Server] API | GET /api/background/status`
  );
  return backgroundController.getStatus();
});
