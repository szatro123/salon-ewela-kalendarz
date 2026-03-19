import { Router, type IRouter } from "express";
import healthRouter from "./health";
import appointmentsRouter from "./appointments";
import smsRouter from "./sms";
import testSmsplanetRouter from "./test-smsplanet";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/appointments", appointmentsRouter);
router.use("/sms", smsRouter);
router.use("/test-smsplanet", testSmsplanetRouter);

export default router;
