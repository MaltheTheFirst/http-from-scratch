import crypto from "node:crypto";

type Session = {
    username: string;
};

const sessions = new Map<string, Session>();

export function createSession(username: string): string {
    const sessionId = crypto.randomUUID();

    const session: Session = {
        username
    }

    sessions.set(sessionId, session);
    return sessionId;
}

export function getSession(sessionId: string): Session | undefined {
    return sessions.get(sessionId);
}