const snowflake = require('snowflake-sdk');

let connection = null;

function getConnection() {
  if (connection) return Promise.resolve(connection);

  return new Promise((resolve, reject) => {
    const conn = snowflake.createConnection({
      account: process.env.SNOWFLAKE_ACCOUNT,
      username: process.env.SNOWFLAKE_USERNAME,
      authenticator: 'EXTERNALBROWSER',
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      database: process.env.SNOWFLAKE_DATABASE,
      schema: process.env.SNOWFLAKE_SCHEMA,
      role: process.env.SNOWFLAKE_ROLE,
    });

    conn.connectAsync((err, conn) => {
      if (err) {
        console.error('Snowflake connection failed:', err.message);
        reject(err);
      } else {
        connection = conn;
        console.log('Connected to Snowflake');
        resolve(conn);
      }
    });
  });
}

function executeQuery(sql) {
  return getConnection().then((conn) => {
    return new Promise((resolve, reject) => {
      conn.execute({
        sqlText: sql,
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Query failed:', err.message);
            reject(err);
          } else {
            resolve(rows);
          }
        },
      });
    });
  });
}

module.exports = { getConnection, executeQuery };
