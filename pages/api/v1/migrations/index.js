import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";

export default async function migrations(request, response) {
  const isPostMethod = request.method === "POST",
    isGetMethod = request.method === "GET";

  if (!isPostMethod && !isGetMethod) {
    return response.status(405).json({
      error: `Method "${request.method}" not allowed`,
    });
  }

  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const defaultMigrationOptions = {
      dbClient: dbClient,
      dryRun: true,
      dir: join("infra", "migrations"),
      direction: "up",
      verbose: true,
      migrationsTable: "pgmigrations",
    };

    const migrations = await migrationRunner({
      ...defaultMigrationOptions,
      dryRun: !isPostMethod,
    });

    const hasMigrations = migrations.length > 0;
    const responseStatus = isPostMethod && hasMigrations ? 201 : 200;

    return response.status(responseStatus).json(migrations);
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient.end();
  }
}
