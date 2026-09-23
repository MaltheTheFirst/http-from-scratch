import type { 
    RouteHandler,
    AuthenticatedRouteHandler,
} from "../router/router.js"
import { sendJson } from "../http/send-json.js"
import { AuthenticatedRequestContext } from "../http/request-context.js";

export function requireAuth(
    handler: AuthenticatedRouteHandler
): RouteHandler {

    return async (req, res, params, url, context) => {

        if (context.session === undefined) {
            res.statusCode = 401;
            sendJson(res, { error: "Unauthorized" });
            return;
        }

        const authenticatedContext: AuthenticatedRequestContext = {
            session: context.session
        };

        await handler(req, res, params, url, authenticatedContext);
    }
}
