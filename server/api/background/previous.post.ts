import { defineEventHandler } from "h3";
import { backgroundController } from "../../utils/backgroundController";

export default defineEventHandler(async () => {
  await backgroundController.previous();
  return backgroundController.getStatus();
});
