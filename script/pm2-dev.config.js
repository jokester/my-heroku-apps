const path = require("path");
const repoRoot = path.join(__dirname, "..");

/**
 * a pm2 config for all processes needed in dev
 */
module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [

    {
      name: "heroku-app",
      script: path.join(repoRoot, "lib-ts/server-main.ts"),
      // NOTE: ts-node-dev fails for no reason, using ts-node
      interpreter: path.join(repoRoot, "node_modules/.bin/ts-node-dev"),
      /** NOTE: can't get watch to work with ts-node. Using ts-node-dev to handle watch and restart stuff */
      // watch     : [
      //   path.join(repoRoot, "lib-ts/**/*"),
      // ],

      env: {
        /**
         * Heroku Postgres
         * capacity: 10,000 rows (not in MB?)
         * 
         * @see https://elements.heroku.com/addons/heroku-postgresql
         * 
         * form: postgres://USER:PASS@HOSTNAME:PORT/DATABASE
         */
        DATABASE_URL: `postgresql://localhost:5432/plato`,

        /**
         * Heroku Redis 
         * capacity: 25MB / 20 connections
         * @see https://elements.heroku.com/addons/heroku-redis
         * 
         * form: redis://USER:PASS@HOSTNAME:PORT     (no path)
         */
        REDIS_URL: `redis://localhost:6379`,

      },
      env_production: {}
    },

    {
      name: 'heroku-pgsql',
      script: "sh",
      args: path.join(repoRoot, "script/pgsql-server.sh"),
      env: {
        PGDATA: path.join(repoRoot, "temp/pgdata.dev"),
      },
    },
    {
      name: 'heroku-redis',
      script: "sh",
      args: [
        path.join(repoRoot, "script/redis-server.sh"),
      ],
      env: {},
    },

  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy: {}
};
