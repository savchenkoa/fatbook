# Go API

Каркас FAT-55: Go **1.27.1**, Echo **5.4.0**, pgx **5.11.0**, goose **3.28.0**.
FAT-125 добавляет локальные аккаунты, SCS/Bearer и изолированный мобильный вход.
Рецепты и дневник нового API добавляются отдельными задачами.
HTTP-контракт первого сценария задаёт [FAT-123](https://linear.app/sketchyy/issue/FAT-123).

## Локальный запуск

Нужны Go 1.27.1, npm и Docker Compose. Окружение использует отдельную PostgreSQL 18
на `127.0.0.1:55432`, без подключения к Supabase. Указанные ниже пароли предназначены
только для этой локальной БД. API получает настройки из окружения процесса;
файлы `.env` автоматически не загружаются.

Из корня монорепо:

```sh
npm run db:up --workspace=@fatbook/api
MIGRATION_DATABASE_URL='postgres://fatbook_migrator:local-migrator@127.0.0.1:55432/fatbook_api?sslmode=disable' npm run migrate --workspace=@fatbook/api
LOCAL_SEED_DATABASE_URL='postgres://fatbook_migrator:local-migrator@127.0.0.1:55432/fatbook_api?sslmode=disable' npm run seed:local --workspace=@fatbook/api
DATABASE_URL='postgres://fatbook_api:local-api@127.0.0.1:55432/fatbook_api?sslmode=disable' AUTH_DATABASE_URL='postgres://fatbook_auth:local-auth@127.0.0.1:55432/fatbook_api?sslmode=disable' npx turbo dev --filter=@fatbook/api
```

API слушает `:8080`. `Ctrl+C`/`SIGTERM` прекращает приём новых запросов, даёт текущим
до 10 секунд на завершение и закрывает пул. Таймауты HTTP: заголовки 5 с,
чтение 10 с, запись 20 с, idle 60 с; тело запроса ограничено 1 МиБ.

| Переменная               | Значение по умолчанию   | Назначение                                                   |
| ------------------------ | ----------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`           | обязательна             | URL ограниченной runtime-роли; не роли миграций              |
| `AUTH_DATABASE_URL`      | обязательна             | URL внутренней роли `fatbook_auth`, отдельный пул из 3 соединений |
| `SESSION_LIFETIME`       | `720h`                  | Абсолютный срок от 1 мс до 30 суток, без sliding |
| `LOGIN_INTERVAL`         | `6s`                    | Один новый допуск к входу за интервал, от 1 мс до часа |
| `LOGIN_BURST`            | `5`                     | Ёмкость token bucket, от 1 до 100 |
| `LOGIN_CONCURRENCY`      | `2`                     | Максимум одновременных проверок пароля, от 1 до 8 |
| `PORT`                   | `8080`                  | Порт HTTP, от 1 до 65535                                     |
| `DB_MAX_CONNECTIONS`     | `5`                     | Максимум соединений, от 1 до 50 на процесс                   |
| `DB_QUERY_TIMEOUT`       | `3s`                    | Вся пользовательская транзакция/проверка БД, от 1 мс до 10 с |
| `MIGRATION_DATABASE_URL` | обязательна для migrate | Отдельная роль владельца схемы                               |
| `RELEASE_VERSION`        | `dev`                   | Версия выпуска при сборке                                    |

Начальный пул пустой, соединения создаются по необходимости. Connect timeout равен
`DB_QUERY_TIMEOUT`, idle-соединения живут до 5 минут, lifetime — 30 минут.
Бюджет БД должен учитывать все реплики и одновременную работу двух версий при деплое.

`httpapi.New` собирает Echo с маршрутами и middleware. В `cmd/api/main.go`
`echo.StartConfig` запускает сервер и при Ctrl+C/SIGTERM даёт текущим запросам
до 10 секунд на завершение. `BeforeServeFunc` задаёт HTTP-таймауты: заголовки —
5 секунд, чтение — 10, запись — 20, простой соединения — 60. Если остановка
превысила лимит, соединения закрываются принудительно, процесс завершается с кодом 1.

## Доступ к БД и миграции

`internal/database` владеет пулом. `WithUser(ctx, verifiedUUID, operation)` принимает
UUID **только из проверенной серверной сессии**. HTTP DTO, заголовок userId и клиентский
JWT не являются источниками идентичности. UUID берётся из проверенной SCS-сессии.

Каждая пользовательская операция запускается в транзакции с `SET LOCAL ROLE
fatbook_user`, `set_config('app.user_id', uuid, true)` и локальным `statement_timeout`.
Callback использует переданный context и не завершает транзакцию самостоятельно.
Commit/rollback снимает роль и UUID; rollback получает отдельный ограниченный context
при отмене запроса. Функция `app.current_user_id()` возвращает UUID либо NULL для RLS.
Пользовательские таблицы `users`, `spaces`, `memberships`, `goals`, `dishes` защищены RLS.
Каталог читается обоими аккаунтами, приватные блюда — только членом пространства.
Членство и владение пользовательская роль менять не может.

Локальные роли создаёт `local/init.sql`. Для managed PostgreSQL администратор заранее
создаёт аналогичные роли, с собственным runtime-паролем:

```sql
CREATE ROLE fatbook_user NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
  NOINHERIT NOREPLICATION NOBYPASSRLS;
-- Пароль runtime-роли задаётся отдельно через защищённый механизм провайдера.
CREATE ROLE fatbook_api LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
  NOINHERIT NOREPLICATION NOBYPASSRLS IN ROLE fatbook_user;
```

Runtime-роли не владеют БД, схемами или таблицами. Проверка допускает только членство
login-роли в `fatbook_user` без ADMIN OPTION, а сама `fatbook_user` не входит в другие
роли. Внутренняя `fatbook_auth` создаётся отдельной LOGIN-ролью без членств,
владения и обхода RLS; см. точный список ролей в `local/init.sql`.
Неправильные права, отсутствие схемы или остаточный UUID делают readiness
отрицательной и запрещают пользовательскую транзакцию. Внутренние таблицы паролей и
сессий находятся в закрытой схеме `auth`, без grants для `fatbook_user`.
`fatbook_auth` читает пароль и идентичность, управляет сессиями; бизнес-запросы через неё не выполняются.

SQL-миграции встроены в бинарник `migrate`. Goose использует одну connection и
session advisory lock: конкурентные команды `up` выполняются последовательно.
Миграция транзакционна. Запуск ограничен двумя минутами и принимает SIGTERM.

```sh
# Из корня, с MIGRATION_DATABASE_URL в окружении:
npm run migrate --workspace=@fatbook/api
npm run migrate:status --workspace=@fatbook/api
```

Миграции запускаются отдельным шагом выпуска **до** API. Runtime не знает URL миграций.
Внешняя БД использует TLS по требованиям провайдера; `sslmode=disable` приведён только
для локального Docker. Не передавать секретный URL в build args или логи.

## Проверки и сборка

```sh
# Из корня монорепо:
npx turbo lint typecheck test build --filter=@fatbook/api
npm run db:up --workspace=@fatbook/api
npm run test:integration --workspace=@fatbook/api

# Один Go-тест, из apps/api, с API_TEST_DATABASE_URL в окружении:
go test ./internal/database -run TestUserTransactionEnforcesRLS
```

`typecheck` компилирует все пакеты; `lint` проверяет gofmt и go vet; `test` включает
race detector и отключает кэш Go, чтобы проверки учитывали доступность реальной БД.
Без `API_TEST_DATABASE_URL` PostgreSQL-тесты явно пропускаются.
`test:integration` использует локальную административную роль, создаёт для каждого
теста БД `fatbook_test_*`, применяет настоящие миграции и удаляет только эту БД.
Пользовательские запросы проверяются через ограниченную роль и пул из одного соединения.

Сборка выдаёт `build/api` и `build/migrate`, с `CGO_ENABLED=0`, `-trimpath` и
`-buildvcs=false`. Commit берётся из Git, версия — из `RELEASE_VERSION`.
Go modules и образы Docker зафиксированы версиями и контрольными суммами.

## Контейнер и проверки доступности

Из `apps/api`:

```sh
RELEASE_COMMIT=$(git rev-parse HEAD) docker compose build api
docker compose up -d --wait db
docker compose run --rm migrate up
docker compose up -d --wait api
curl -i http://127.0.0.1:8080/health/live
curl -i http://127.0.0.1:8080/health/ready
docker compose stop api db
```

Бинарники работают от UID 65532. Docker healthcheck проверяет `/health/live`.
`GET /health/live` — 200 `{"status":"ok"}`, без обращения к БД.
`GET /health/ready` — такой же 200 при безопасном доступе к БД, иначе 503:

```json
{
  "error": {
    "code": "service_unavailable",
    "message": "Service temporarily unavailable"
  },
  "requestId": "…"
}
```

Каждый ответ содержит серверный `X-Request-ID`; ID ошибки совпадает с заголовком.
Ошибки не раскрывают SQL или внутренние сообщения. Неизвестный путь возвращает
404 `not_found`. JSON-разбор принимает один объект и отклоняет неизвестные поля;
ошибки JSON/типа — 400 `invalid_request`, превышение тела — 413, неверный Content-Type
— 415, неверный метод — 405 с тем же безопасным кодом.

При недоступной БД API остаётся живым, а readiness снимает его с трафика.
Для Amvera использовать [amvera.probes.yaml](amvera.probes.yaml) в форме настроек проб;
порт контейнера — 8080. При изменении PORT обновить порт обеих проб и публикацию порта.
Покупка ресурсов и деплой выполняются в FAT-54.
Основания: [пробы Amvera](https://docs.amvera.ru/general/k8sprobe.html),
[Docker и containerPort](https://docs.amvera.ru/applications/configuration/docker.html),
[session lock goose](https://pressly.github.io/goose/documentation/provider/).

JSON-логи slog/RequestLogger содержат version, commit, request_id, method, шаблон route,
status, duration_ms и безопасный error_code. Входящий X-Request-ID заменяется серверным:
произвольный клиентский текст не попадает в логи. URL/query, токены, тела, email,
текст SQL-ошибок, stack trace и содержимое дневника не логируются.


## Локальная авторизация (FAT-125)

Новые окружения создают роли через `local/init.sql`. Для ранее созданного тома
администратор должен отдельно создать добавленную роль `fatbook_auth` из этого файла
до применения миграции 2; повторный `db:up` не выполняет init-скрипт старого тома.

`seed:local` работает только с явно заданным loopback-адресом отдельной БД и
запрашивает два пароля в терминале без отображения. Пароли не trim-ятся, не передаются
аргументами и не записываются в файлы. Подготовка транзакционна и повторяема:
`alice@example.test` и `bob@example.test` получают стабильные разные UUID, личные
пространства и по приватному продукту; ещё два продукта доступны обоим из каталога.
Повторная подготовка обновляет пароли, сохраняя UUID, пространства и существующие блюда.
Каталожные продукты A/B соответствуют числовым примерам FAT-123.

Argon2id: библиотека `alexedwards/argon2id` 1.0.0, память 64 МиБ, 3 итерации,
параллелизм 2, соль 16 байт, ключ 32 байта. Неизвестный email проходит такую же
проверку с фиктивным хешем. Email нормализуется одинаково при подготовке и входе.
Лимит частоты общий на процесс, не доверяет IP из заголовков; конкурентные проверки
ограничены отдельно. 429 содержит `Retry-After` в секундах по `LOGIN_INTERVAL`.

Контракт: [openapi.json](openapi.json), OpenAPI 3.1. Авторизация только через
`Authorization: Bearer <opaque SCS token>`, без cookie, JWT или регистрации:

- `POST /v1/auth/login` принимает `{email,password}` и возвращает `{token,expiresAt,user}`
  только после успешного PostgreSQL commit. При действующем предыдущем Bearer
  пароль проверяется до отзыва старого токена; затем создаётся новая сессия.
  Если Bearer предъявлен, но неизвестен, истёк или отозван, возвращается 401 без новой сессии.
- `GET /v1/auth/me` возвращает `{user,expiresAt}`. Пользователь содержит UUID, email,
  `personalSpaceId` и личные цели; при отсутствии целей — 100/70/180/2000.
- `POST /v1/auth/logout` отзывает текущий токен и возвращает пустой 204;
  отсутствие/истечение/повторный отзыв безопасны.

SCS 2.9.0 и pgxstore сохраняют сессии в PostgreSQL, поэтому рестарт API сохраняет вход.
Обычные чтения не вызывают Commit: срок не продлевается, параллельный запрос не
воссоздаёт сессию после logout. При отказе хранилища возвращается 503, при неверных
данных — 401 `invalid_credentials`, при недействительной сессии — 401 `unauthenticated`.
Все auth-ответы имеют `no-store` и серверный `X-Request-ID`; ID ошибок совпадает с заголовком.

Типы и транспорт нового API отделены экспортом `@fatbook/api-client/go`.
Воспроизводимая генерация (версия генератора зафиксирована):

```sh
npm run typegen:go --workspace=@fatbook/api-client
git diff --exit-code -- packages/api-client/src/go/schema.d.ts
```

HTTP-тесты проверяют реальные ответы по JSON Schema из OpenAPI (включая UUID,
время, обязательные поля и отсутствие лишних полей), сценарии входа/отзыва/рестарта,
абсолютный срок, лимиты и реальные отказы чтения/записи БД. Прямые SQL-тесты
проверяют изоляцию, WITH CHECK, закрытость паролей/сессий и очистку контекста пула.
`TestMobileSessionThroughRealHTTP` компилирует настоящий TS-клиент и проверяет его
через тот же API/БД: восстановление, смену пользователя, 401, сеть и 503 после
реального отзыва прав чтения сессий. Для него нужны Node.js и `npm ci`; без них
тест явно пропускается, а в CI они установлены. Нативный SecureStore проверяется на устройстве.
CI `API auth and contracts` поднимает отдельную PostgreSQL и выполняет эти проверки.

## Мобильный режим Go

Из `apps/mobile`, для Expo Go/эмулятора в режиме разработки:

```sh
EXPO_NO_DOTENV=1 EXPO_PUBLIC_BACKEND=go EXPO_PUBLIC_API_URL=http://127.0.0.1:8080 npm run dev
```

В iOS Simulator loopback указывает на компьютер. Для Android Emulator используйте
`http://10.0.2.2:8080`; для физического телефона — явный доступный LAN-адрес компьютера.
HTTP принимается только при `__DEV__`; собранное приложение требует HTTPS.
При запуске API в Docker порт по умолчанию опубликован только на loopback —
доступ с телефона настройте отдельно для своего локального окружения.

Этот этап открывает существующие экраны входа и аккаунта/выхода. Дневник, рецепты,
статистика и изменение целей недоступны до следующих задач; запросов в Supabase
в режиме Go нет. Без `EXPO_PUBLIC_BACKEND=go` работает прежняя сборка.

Токен хранится в Expo SecureStore (`WHEN_UNLOCKED_THIS_DEVICE_ONLY`), пароль не сохраняется.
После запуска токен проверяется через `me`. Сеть/503 оставляет его для кнопки «Повторить»;
401 очищает токен и пользовательский TanStack cache. Неудачный logout сохраняет вход
и показывает ошибку. После подтверждённого logout и смены пользователя cache сбрасывается,
навигация перемонтируется по UUID. Новый режим пока не содержит запросов бизнес-данных.

Ручная проверка на устройстве: вход A → перезапуск приложения → выход → вход B;
отдельно проверить отказ сети при восстановлении и logout, повтор после восстановления
сети и возврат к входу после истечения короткого `SESSION_LIFETIME`.
