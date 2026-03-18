import { Router, type IRouter } from "express";
import healthRouter from "./health";
import appointmentsRouter from "./appointments";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/appointments", appointmentsRouter);

export default router;
