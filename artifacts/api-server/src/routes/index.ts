import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studentsRouter from "./students";
import busesRouter from "./buses";
import routesRouter from "./routes";
import tripsRouter from "./trips";
import scansRouter from "./scans";
import smsRouter from "./sms";
import dashboardRouter from "./dashboard";
import devicesRouter from "./devices";
import whatsappRouter from "./whatsapp";

const router: IRouter = Router();

router.use(healthRouter);
router.use(studentsRouter);
router.use(busesRouter);
router.use(routesRouter);
router.use(tripsRouter);
router.use(scansRouter);
router.use(smsRouter);
router.use(dashboardRouter);
router.use(devicesRouter);
router.use(whatsappRouter);

export default router;
