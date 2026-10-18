const { spawnSync } = require("node:child_process");

if (!process.env.API_TEST_DATABASE_URL) {
  console.error(
    "Для интеграционных тестов требуется API_TEST_DATABASE_URL отдельной PostgreSQL.",
  );
  process.exit(1);
}

const result = spawnSync(
  "go",
  ["test", "-race", "-count=1", "-json", "./..."],
  {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  },
);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

let passed = 0;
const skipped = [];
for (const line of result.stdout.split("\n").filter(Boolean)) {
  const event = JSON.parse(line);
  if (event.Output) process.stdout.write(event.Output);
  if (event.Action === "pass" && event.Test) passed++;
  if (event.Action === "skip" && event.Test)
    skipped.push(`${event.Package} ${event.Test ?? ""}`);
}

if (skipped.length > 0) {
  console.error(`Интеграционные тесты пропущены:\n${skipped.join("\n")}`);
}
if (passed === 0) console.error("Ни один интеграционный тест не выполнен.");
console.log(
  `Интеграционные тесты: успешно ${passed}, пропущено ${skipped.length}.`,
);
process.exit(result.status === 0 && passed > 0 && skipped.length === 0 ? 0 : 1);
