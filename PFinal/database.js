const oracledb = require('oracledb');

const dbConfig = {
  user: 'proyectF', password: 'ProyectF', connectionString: 'localhost/xepdb1'
};

async function initialize() {
  try {
    await oracledb.createPool(dbConfig);
    console.log('Pool de conexiones a OracleDB creado');
  } catch (err) {
    console.error('Error al crear el pool de conexiones a OracleDB', err);
    throw err;
  }
}

async function getConnection() {
  let connection;
  try {
    connection = await oracledb.getConnection();
  } catch (err) {
    console.error('Error al obtener la conexión', err);
    throw err;
  }
  return connection;
}

async function query(sql, params) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(sql, params, { autoCommit: true, outFormat: oracledb.OUT_FORMAT_OBJECT });
    await connection.close();
    return result;
  } catch (err) {
    console.error('Error al ejecutar la consulta', err);
    throw err;
  }
}

module.exports = {
  initialize,
  getConnection,
  query
};
