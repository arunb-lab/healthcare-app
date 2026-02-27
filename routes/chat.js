const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { authMiddleware } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.use(authMiddleware);

router.get("/available-doctors", chatController.getAvailableDoctors);
router.get("/available-patients", chatController.getAvailablePatients);
router.get("/conversations", chatController.listConversations);
router.post("/conversations", chatController.getOrCreateConversation);
router.get("/conversations/:conversationId/messages", chatController.getMessages);
router.post("/conversations/:conversationId/messages", chatController.sendMessage);
router.post(
  "/conversations/:conversationId/prescription",
  upload.single("prescription"),
  chatController.uploadPrescription
);

module.exports = router;
