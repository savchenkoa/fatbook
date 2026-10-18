const assert = require('node:assert/strict');
const path = require('node:path');
const http = require('node:http');
const { randomUUID } = require('node:crypto');
const { createApi, EatingSubmission, AuthSession } = require(path.join(process.argv[2], 'packages/api-client/src/go/index.js'));
const { createGoData } = require(path.join(process.argv[2], 'apps/mobile/src/data/go-data.js'));

async function main() {
    const base = process.argv[3];
    const session = await createApi(base, () => null, async () => {}).login({ email: 'alice@example.test', password: '  alice secret  ' });
    let token = session.token;
    const api = createApi(base, () => token, async () => { token = null; });
    const body = { dishId: 1, day: '2026-10-18', meal: 'lunch', portion: 150 };
    const draft = new EatingSubmission(randomUUID);
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
        const lossy = createApi(`http://127.0.0.1:${proxy.address().port}`, () => token, async () => { token = null; });
        await assert.rejects(draft.save(lossy, body));
        const saved = (await api.dailyEatings(body.day)).meals.lunch.eatings;
        assert.equal(saved.length, 1);
        assert.deepEqual(await draft.save(api, body), saved[0]);
    } finally {
        await new Promise(resolve => proxy.close(resolve));
    }
    assert(token);
    const next = await draft.save(api, { ...body, portion: 100 });
    assert.notEqual(next.id, (await api.dailyEatings(body.day)).meals.lunch.eatings[0].id);
    const another = await new EatingSubmission(randomUUID).save(api, body);
    assert.notEqual(another.id, next.id);
    assert.notEqual(another.id, (await api.dailyEatings(body.day)).meals.lunch.eatings[0].id);
    await api.deleteEating(another.id);
    const changed = await api.updateEating(next.id, 200);
    assert.equal(changed.calories, 340);
    const data = createGoData(api);
    assert.equal(data.features.diary, true);
    const daily = await data.fetchDailyEatings(body.day);
    assert.equal(daily.meals.lunch.eatings.length, 2);
    assert.equal(daily.calories, 595);
    const snapshot = daily.meals.lunch.eatings.find(eating => eating.id === next.id);
    assert.equal(snapshot.dish.calories, 170);
    assert.equal(snapshot.calories, 340);
    assert.equal(snapshot.dish.name, 'Ингредиент A');
    const patched = await data.updateEating({ ...snapshot, portion: 100 });
    assert.equal(patched.calories, 170);
    await data.deleteEating(patched);
    assert.equal((await data.fetchDailyEatings(body.day)).meals.lunch.eatings.length, 1);
    assert.deepEqual(await data.fetchSettings(), { proteins: 100, fats: 70, carbs: 180, calories: 2000 });
    // Пустой день отличим от ошибки; чтение не изменяет сохранённый объект.
    const before = JSON.stringify(daily);
    const empty = await data.fetchDailyEatings('2026-10-19');
    assert.equal(empty.calories, 0);
    assert.equal(Object.keys(empty.meals).length, 4);
    assert.equal(JSON.stringify(daily), before);
    await api.logout();
    await assert.rejects(data.fetchDailyEatings(body.day), error => error.status === 401);
    assert.equal(token, null);
    assert.equal(data.isCurrentSession(), false);
    await accountSwitchRejectsLateDiary(base);
}
main().catch(error => { console.error(error); process.exitCode = 1; });

async function accountSwitchRejectsLateDiary(base) {
    let storedToken = null;
    let cache = null;
    const session = new AuthSession(base, {
        get: async () => storedToken,
        set: async token => { storedToken = token; },
        remove: async () => { storedToken = null; },
    }, async () => { cache = null; });
    await session.login({ email: 'alice@example.test', password: '  alice secret  ' });
    const data = createGoData(session.api);
    cache = await data.fetchDailyEatings('2026-10-18');
    assert(cache.calories > 0);
    const unreachable = createGoData(createApi('http://127.0.0.1:1', () => storedToken, async () => { storedToken = null; }));
    await assert.rejects(unreachable.fetchDailyEatings('2026-10-18'));
    assert(storedToken);
    assert(cache.calories > 0);
    let markReady, release;
    const ready = new Promise(resolve => { markReady = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    const proxy = http.createServer(async (request, response) => {
        const upstream = await fetch(base + request.url, { headers: { authorization: request.headers.authorization } });
        const result = Buffer.from(await upstream.arrayBuffer());
        markReady();
        await gate;
        response.writeHead(upstream.status, { 'content-type': 'application/json' });
        response.end(result);
    });
    await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve));
    try {
        const delayed = createGoData(createApi(`http://127.0.0.1:${proxy.address().port}`, () => storedToken, async () => {}));
        const pending = delayed.fetchDailyEatings('2026-10-18');
        await ready;
        await session.login({ email: 'bob@example.test', password: 'bob secret' });
        assert.equal(cache, null);
        assert.equal(data.isCurrentSession(), false);
        release();
        await assert.rejects(pending, /session_changed/);
        const bob = createGoData(session.api);
        assert.equal((await bob.fetchDailyEatings('2026-10-18')).calories, 0);
        assert.deepEqual(await bob.fetchSettings(), { proteins: 80, fats: 60, carbs: 150, calories: 1700 });
        await session.logout();
    } finally {
        release();
        await new Promise(resolve => proxy.close(resolve));
    }
}
