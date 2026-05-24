import { protect, requireAdmin } from "../../middlewares/auth.middleware";
import { login, promoteUser, register } from "./auth.controller";
import { Router } from "express";
const router = Router();
router.post("/register", register);
router.post("/login", login);
router.patch("/promote/:userId", protect, requireAdmin, promoteUser);
export default router;
