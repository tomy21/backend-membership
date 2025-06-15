import express from "express";
import { protect } from "../../middleware/member/authMiddleware.js";
import {
  GetNotification,
  MarkNotificationAsRead,
} from "../../controller/Members/NotificationController.js";

const router = express.Router();

router.route("/notification-get").get(protect, GetNotification);

router.route("/notification-read/:id").put(protect, MarkNotificationAsRead);

export default router;
