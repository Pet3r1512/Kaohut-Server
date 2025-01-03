import { Hono } from "hono";
import { auth } from "./utils/auth";

const app = new Hono<{
    Variables: {
        user: typeof auth.$Infer.Session.user | null;
        session: typeof auth.$Infer.Session.session | null
    }
}>();

export default app;