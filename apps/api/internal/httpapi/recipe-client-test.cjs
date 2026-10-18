const assert = require('node:assert/strict');
const path = require('node:path');
const http = require('node:http');
const { randomUUID } = require('node:crypto');
const { createApi, RecipeSubmission, AuthSession } = require(path.join(process.argv[2], 'packages/api-client/src/go/index.js'));

const { createGoData } = require(path.join(process.argv[2], 'apps/mobile/src/data/go-data.js'));

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
    await sharedScreensDataAdapter(base, body);
    await updateAndDeleteRecipe(base, body);
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

async function sharedScreensDataAdapter(base, body) {
    let token = null;
    const session = new AuthSession(base, {
        get: async () => token,
        set: async value => { token = value; },
        remove: async () => { token = null; },
    }, async () => {});
    await session.login({ email: 'alice@example.test', password: '  alice secret  ' });
    const data = createGoData(session.api);
    const sources = await data.searchDishes({ scope: 'ingredients', query: '', page: 1 });
    const catalog = sources.items.find(item => item.id === 1);
    const ownSource = sources.items.find(item => item.id === 3);
    assert.equal(data.isReadOnlyDish(catalog), true);
    // Личное пространство 1 не является старой общей collectionId=1.
    assert.equal(data.isReadOnlyDish(ownSource), false);
    const requestId = randomUUID();
    const recipe = await data.createRecipe(body, requestId);
    assert.equal(recipe.calories, 148.75);
    assert.equal(recipe.collectionId, 1);
    assert.equal(data.isReadOnlyDish(recipe), false);
    assert.equal(recipe.ingredients[0].dish.name, 'Ингредиент A');
    assert.equal(recipe.ingredients[0].dish.calories, 170);
    assert.equal(recipe.ingredients[0].calories, 340);
    assert.equal(recipe.ingredients[0].portion, 200);
    assert.equal(recipe.ingredients[0].selected, true);
    assert.deepEqual(await data.fetchDish(recipe.id), recipe);
    assert.deepEqual(await data.createRecipe(body, requestId), recipe);
    assert.equal((await data.fetchDailyEatings('2026-10-17')).calories, 0);
    await assert.rejects(data.createDish({ name: 'Unsupported', icon: null, defaultPortion: null }), /недоступна/);
    await session.logout();
    assert.equal(data.isCurrentSession(), false);
}

async function updateAndDeleteRecipe(base, body) {
    const session = await createApi(base, () => null, async () => {}).login({ email: 'alice@example.test', password: '  alice secret  ' });
    const api = createApi(base, () => session.token, async () => {});
    const data = createGoData(api);
    const recipe = await data.createRecipe(body, randomUUID());
    const originalEating = await data.createEating('2026-10-18', 'lunch', {
        dish: recipe, portion: 150,
    }, randomUUID());
    const draft = { ...body, name: 'Изменённый рецепт', icon: '🥘', cookedWeight: 250 };
    let writes = 0;
    const proxy = http.createServer(async (request, response) => {
        assert.equal(request.method, 'PUT');
        assert.equal(request.url, `/v1/dishes/${recipe.id}`);
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        assert.deepEqual(JSON.parse(Buffer.concat(chunks)), draft);
        writes++;
        const upstream = await fetch(base + request.url, {
            method: request.method,
            headers: { authorization: request.headers.authorization, 'content-type': 'application/json' },
            body: Buffer.concat(chunks),
        });
        assert.equal(upstream.status, 200);
        await upstream.arrayBuffer();
        response.destroy();
    });
    await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve));
    try {
        const lossy = createGoData(createApi(`http://127.0.0.1:${proxy.address().port}`, () => session.token, async () => {}));
        await assert.rejects(lossy.updateRecipe(recipe.id, draft));
        assert.equal(writes, 1);
        assert.equal(draft.cookedWeight, 250);
        assert.equal(draft.name, 'Изменённый рецепт');
    } finally {
        await new Promise(resolve => proxy.close(resolve));
    }
    const updated = await data.updateRecipe(recipe.id, draft);
    assert.equal(updated.name, draft.name);
    assert.equal(updated.icon, draft.icon);
    assert.equal(updated.calories, 238);
    assert.equal(updated.cookedWeight, 250);
    assert.deepEqual(await data.fetchDish(recipe.id), updated);
    const newEating = await data.createEating('2026-10-18', 'lunch', { dish: updated, portion: 150 }, randomUUID());
    assert.equal(newEating.calories, 357);
    await data.deleteDish(recipe.id);
    await assert.rejects(data.fetchDish(recipe.id), error => error.status === 404);
    assert.equal((await data.searchDishes({ query: '', page: 1 })).items.some(dish => dish.id === recipe.id), false);
    const day = await data.fetchDailyEatings('2026-10-18');
    const historical = day.meals.lunch.eatings.find(item => item.id === originalEating.id);
    assert.equal(historical.dish.name, 'A/B');
    assert.equal(historical.dish.icon, null);
    assert.equal(historical.calories, 223.125);
    const corrected = await data.updateEating({ ...historical, portion: 100 });
    assert.equal(corrected.calories, 148.75);
    assert.equal(corrected.dish.name, 'A/B');
    assert.equal(corrected.dish.icon, null);
    await api.logout();
}
