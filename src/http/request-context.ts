import type { Session } from "../sessions/session-store.js";

export type RequestContext = {
    session: Session | undefined;
}