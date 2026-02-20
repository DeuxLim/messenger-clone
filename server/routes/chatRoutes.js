import { Router } from "express";
import ChatController from "../controllers/chat/ChatController.js";

const router = Router();

router.get("/", ChatController.getUserChats);
router.post("/", ChatController.findOrCreateChat);
router.get("/search", ChatController.searchChat);
router.get("/:id", ChatController.getChatMessages);
router.post("/:id/messages", ChatController.addChatMessage);
router.patch("/:id", ChatController.updateChat);
router.delete("/:id", ChatController.deleteChat);

export default router;
