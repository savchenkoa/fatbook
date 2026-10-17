const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const [compiled, baseUrl, tokenFile, phase] = process.argv.slice(2);
const { AuthSession } = require(path.join(compiled, "session.js"));
const { ApiError } = require(path.join(compiled, "client.js"));

const storage = {
    get: async () =>
        fs.existsSync(tokenFile) ? fs.readFileSync(tokenFile, "utf8") : null,
    set: async (token) => fs.writeFileSync(tokenFile, token, { mode: 0o600 }),
    remove: async () => fs.rmSync(tokenFile, { force: true }),
};
const states = [];
const changed = async (state) => {
    states.push(state);
};
const session = new AuthSession(baseUrl, storage, changed);
const failure = (status) => (error) =>
    error instanceof ApiError && error.status === status;

async function check() {
    if (phase === "basic") {
        await session.restore();
        assert.equal(states.at(-1), null);
        await session.login({
            email: " ALICE@EXAMPLE.TEST ",
            password: "  alice secret  ",
        });
        assert.equal(states.at(-1).user.email, "alice@example.test");
        const token = await storage.get();
        assert.ok(token);
        const restored = new AuthSession(baseUrl, storage, changed);
        await restored.restore();
        assert.equal(states.at(-1).user.email, "alice@example.test");
        await assert.rejects(
            restored.login({ email: "alice@example.test", password: "wrong" }),
            failure(401),
        );
        assert.equal(
            await storage.get(),
            token,
            "invalid credentials must not clear an existing session",
        );
        const unavailable = new AuthSession(
            "http://127.0.0.1:1",
            storage,
            changed,
        );
        await assert.rejects(unavailable.restore());
        await assert.rejects(unavailable.logout());
        assert.equal(
            await storage.get(),
            token,
            "network failures must preserve the token",
        );
        await restored.logout();
        assert.equal(await storage.get(), null);
        assert.equal(states.at(-1), null);
        await restored.login({
            email: "bob@example.test",
            password: "bob secret",
        });
        assert.equal(states.at(-1).user.email, "bob@example.test");
    } else if (phase === "outage") {
        const token = await storage.get();
        await assert.rejects(session.restore(), failure(503));
        await assert.rejects(session.logout(), failure(503));
        assert.equal(
            await storage.get(),
            token,
            "database failures must preserve the token",
        );
        assert.equal(
            states.length,
            0,
            "failed requests must not publish a signed-out state",
        );
    } else if (phase === "recovery") {
        await session.restore();
        assert.equal(states.at(-1).user.email, "bob@example.test");
        await session.logout();
        assert.equal(await storage.get(), null);
        await session.login({
            email: "alice@example.test",
            password: "  alice secret  ",
        });
        const response = await fetch(baseUrl + "/v1/auth/logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${await storage.get()}` },
        });
        assert.equal(response.status, 204);
        await session.restore();
        assert.equal(
            await storage.get(),
            null,
            "protected-request 401 must remove the token",
        );
        assert.equal(
            states.at(-1),
            null,
            "401 must clear user state/cache through onChange",
        );
    } else {
        throw new Error("unknown test phase");
    }
}
check().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
