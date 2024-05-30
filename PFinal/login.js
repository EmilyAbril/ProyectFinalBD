const db = require('./database');

async function login(req, res) {
  const { usuario, contraseña } = req.body;
  try {
    const result = await db.query(
      `SELECT * FROM usuarios WHERE correo = :usuario AND contraseña = :contraseña`,
      { usuario, contraseña }
    );

    if (result.rows.length > 0) {
      // Usuario autenticado correctamente
      req.session.user = result.rows[0].ID_USUARIO;
      res.redirect('/home.html');
    } else {
      // Usuario no encontrado
      res.redirect('/index.html');
    }
  } catch (err) {
    console.error('Error al autenticar el usuario', err);
    res.status(500).send('Error interno del servidor');
  }
}

module.exports = login;
