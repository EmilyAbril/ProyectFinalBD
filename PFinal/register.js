const db = require('./database');
const oracledb = require('oracledb'); // Asegúrate de importar el módulo oracledb

async function register(req, res) {
  const { rusuario, rcontraseña } = req.body;

  try {
    console.log('Intentando registrar el usuario:', rusuario);

    const exists = await db.query(
      `SELECT * FROM usuarios WHERE correo = :usuario`,
      { usuario: rusuario }
    );

    if (exists.rows.length > 0) {
      console.log('El usuario ya existe:', rusuario);
      res.send('El usuario ya existe. Por favor, elige otro nombre de usuario.');
    } else {
      console.log('Registrando nuevo usuario:', rusuario);

      // Preparamos un objeto para almacenar el resultado devuelto por RETURNING INTO
      const result = await db.query(
        `INSERT INTO usuarios (correo, contraseña) VALUES (:usuario, :contraseña) RETURNING ID_USUARIO INTO :id_usuario`,
        { 
          usuario: rusuario, 
          contraseña: rcontraseña, 
          id_usuario: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } 
        }
      );

      // Crear sesión para el nuevo usuario
      req.session.user = result.outBinds.id_usuario[0];
      console.log('Usuario registrado exitosamente con ID:', req.session.user);
      res.redirect('/home.html');
    }
  } catch (err) {
    console.error('Error durante el registro', err);
    res.status(500).send('Error interno del servidor');
  }
}

module.exports = register;
