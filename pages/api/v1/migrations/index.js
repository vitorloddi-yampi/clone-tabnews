import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";

export default async function migrations(request, response) {
  const dbClient = await database.getNewClient();

  const defaultMigrationOptions = {
    dbClient: dbClient,
    dryRun: true,
    dir: join("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  const isPostMethod = request.method === "POST",
    isGetMethod = request.method === "GET";

  if (!isPostMethod && !isGetMethod) {
    await dbClient.end();
    return response.status(405).end();
  }

  const migrations = await migrationRunner({
    ...defaultMigrationOptions,
    dryRun: !isPostMethod,
  });

  await dbClient.end();

  const hasMigrations = migrations.length > 0;
  const responseStatus = isPostMethod && hasMigrations ? 201 : 200;

  return response.status(responseStatus).json(migrations);
}
