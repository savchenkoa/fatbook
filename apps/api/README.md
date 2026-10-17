# Go API

Каркас FAT-55: Go **1.27.1**, Echo **5.4.0**, pgx **5.11.0**, goose **3.28.0**.
Схема блюд, дневник и вход реализуются в FAT-56, FAT-121 и FAT-57.
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
DATABASE_URL='postgres://fatbook_api:local-api@127.0.0.1:55432/fatbook_api?sslmode=disable' npx turbo dev --filter=@fatbook/api
```

API слушает `:8080`. `Ctrl+C`/`SIGTERM` прекращает приём новых запросов, даёт текущим
до 10 секунд на завершение и закрывает пул. Таймауты HTTP: заголовки 5 с,
чтение 10 с, запись 20 с, idle 60 с; тело запроса ограничено 1 МиБ.

| Переменная               | Значение по умолчанию   | Назначение                                                   |
| ------------------------ | ----------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`           | обязательна             | URL ограниченной runtime-роли; не роли миграций              |
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
JWT не являются источниками идентичности. Авторизация подключается в FAT-57.

Каждая пользовательская операция запускается в транзакции с `SET LOCAL ROLE
fatbook_user`, `set_config('app.user_id', uuid, true)` и локальным `statement_timeout`.
Callback использует переданный context и не завершает транзакцию самостоятельно.
Commit/rollback снимает роль и UUID; rollback получает отдельный ограниченный context
при отмене запроса. Функция `app.current_user_id()` возвращает UUID либо NULL для RLS.
Новая схема пока не содержит пользовательских таблиц: их политики USING/WITH CHECK
добавляются с данными в FAT-56. Проверки используют временную таблицу только в тестовой БД.

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
роли. Неправильные права, отсутствие схемы или остаточный UUID делают readiness
отрицательной и запрещают пользовательскую транзакцию. Внутренние таблицы паролей и
сессий не получают grants для `fatbook_user`; их доступ реализуется отдельно в FAT-57.

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
