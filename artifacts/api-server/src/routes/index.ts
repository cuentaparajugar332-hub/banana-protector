import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import scriptsRouter from "./scripts.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/s", scriptsRouter);

export default router;
