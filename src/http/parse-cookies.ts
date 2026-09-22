export function parseCookies(
    cookieHeader: string | undefined,
): Record<string, string | undefined> {
    if (cookieHeader === undefined) {
        return {};
    }

    const cookies = cookieHeader.split("; ");
    const parsedCookies: Record<string, string> = {};

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const separatorIndex = cookie.indexOf("=");

        if (separatorIndex === -1) {
            continue;
        }

        const name = cookie.slice(0, separatorIndex);
        const value = cookie.slice(separatorIndex + 1);

        parsedCookies[name] = value;
    }

    return parsedCookies;
}