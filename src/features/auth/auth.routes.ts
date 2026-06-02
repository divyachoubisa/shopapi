import { protect, requireAdmin } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { login, promoteUser, register } from "./auth.controller";
import { Router } from "express";
import { LoginSchema, RegisterSchema } from "./auth.schema";

const router = Router();

router.post("/register", validate(RegisterSchema), register);
router.post("/login", validate(LoginSchema), login);

router.patch("/promote/:userId", protect, requireAdmin, promoteUser);

export default router;
