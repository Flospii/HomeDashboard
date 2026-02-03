import { defineEventHandler } from "h3";
import { backgroundController } from "../../utils/backgroundController";

export default defineEventHandler(async () => {
  console.log("[Server] API | POST /api/background/pause");
  const isPaused = backgroundController.togglePause();
  return { isPaused };
});
