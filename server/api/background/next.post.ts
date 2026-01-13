import { defineEventHandler } from "h3";
import { backgroundController } from "../../utils/backgroundController";

export default defineEventHandler(async () => {
  await backgroundController.next();
  return backgroundController.getStatus();
});
