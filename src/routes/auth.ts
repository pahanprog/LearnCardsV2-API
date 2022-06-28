import { Router } from "express";

import * as authController from "../controllers/auth";

require("../config/passport");

const router = Router();

router.post("/register", authController.postRegister);

router.post("/login", authController.postLogin);

export default router;