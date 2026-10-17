const assert = require('node:assert/strict');
const path = require('node:path');
const http = require('node:http');
const { randomUUID } = require('node:crypto');
const { createApi, RecipeSubmission, AuthSession } = require(path.join(process.argv[2], 'index.js'));

async function main() {
    const base = process.argv[3];
    const credentials = { email: 'alice@example.test', password: '  alice secret  ' };
    const session = await createApi(base, () => null, async () => {}).login(credentials);
    let lostSession = false;
    const api = createApi(base, () => session.token, async () => { lostSession = true; });
    const a = (await api.listDishes('ingredients')).items.find(item => item.id === 1);
    assert(a && a.cookedWeight === null && a.defaultPortion === null && a.spaceId === null);
    const draft = new RecipeSubmission(randomUUID);
    const body = {
        name: ' A/B ', icon: null, defaultPortion: null, cookedWeight: 400,
        ingredients: [{ dishId: 1, portion: 200 }, { dishId: 2, portion: 300 }],
    };
    // Настоящий HTTP proxy теряет ответ после подтверждённого сервером POST.
    const proxy = http.createServer(async (request, response) => {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const upstream = await fetch(base + request.url, {
            method: request.method,
            headers: { authorization: request.headers.authorization, 'content-type': 'application/json' },
            body: Buffer.concat(chunks),
        });
        await upstream.arrayBuffer();
        response.destroy();
    });
    await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve));
    try {
        const lossy = createApi(`http://127.0.0.1:${proxy.address().port}`, () => session.token, async () => { lostSession = true; });
        await assert.rejects(draft.save(lossy, body));
    } finally {
        await new Promise(resolve => proxy.close(resolve));
    }
    assert.equal(lostSession, false);
    let library = await api.listDishes('mine');
    assert.equal(library.items.length, 1);
    const original = await api.dish(library.items[0].id);
    const confirmed = await draft.save(api, { ...body, name: 'A/B', ingredients: [...body.ingredients].reverse() });
    assert.deepEqual(confirmed, original);
    assert.equal(confirmed.calories, 148.75);
    assert.equal(confirmed.ingredients[0].sourceSnapshot.calories, 170);
    const changed = await draft.save(api, { ...body, cookedWeight: 800 });
    assert.notEqual(changed.id, confirmed.id);
    assert.equal(changed.calories, 74.375);
    library = await api.listDishes('mine');
    assert.equal(library.items.length, 2);
    // Новый черновик после успеха получает независимый ключ.
    const next = await new RecipeSubmission(randomUUID).save(api, body);
    assert.notEqual(next.id, confirmed.id);
    await api.logout();
    await assert.rejects(api.listDishes('mine'), error => error.status === 401);
    assert.equal(lostSession, true);
    await accountSwitchDiscardsLateRecipe(base, body);
}
async function accountSwitchDiscardsLateRecipe(base, body) {
    let storedToken = null;
    const session = new AuthSession(base, {
        get: async () => storedToken,
        set: async token => { storedToken = token; },
        remove: async () => { storedToken = null; },
    }, async () => {});
    await session.login({ email: 'alice@example.test', password: '  alice secret  ' });
    const isCurrent = session.api.captureSession();
    assert.equal(isCurrent(), true);
    let markReady;
    let release;
    const ready = new Promise(resolve => { markReady = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    const proxy = http.createServer(async (request, response) => {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const upstream = await fetch(base + request.url, {
            method: request.method,
            headers: { authorization: request.headers.authorization, 'content-type': 'application/json' },
            body: Buffer.concat(chunks),
        });
        const result = Buffer.from(await upstream.arrayBuffer());
        markReady();
        await gate;
        response.writeHead(upstream.status, { 'content-type': 'application/json' });
        response.end(result);
    });
    await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve));
    try {
        const delayed = createApi(`http://127.0.0.1:${proxy.address().port}`, () => storedToken, async () => {});
        const pending = new RecipeSubmission(randomUUID).save(delayed, body);
        await ready;
        await session.logout();
        assert.equal(isCurrent(), false);
        await session.login({ email: 'bob@example.test', password: 'bob secret' });
        release();
        await assert.rejects(pending, /session_changed/);
        assert.equal(isCurrent(), false);
        assert.deepEqual((await session.api.listDishes('mine')).items, []);
    } finally {
        release();
        await new Promise(resolve => proxy.close(resolve));
    }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
