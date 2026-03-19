import { Router, type IRouter } from "express";
import healthRouter from "./health";
import appointmentsRouter from "./appointments";
import smsRouter from "./sms";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/appointments", appointmentsRouter);
router.use("/sms", smsRouter);

export default router;
