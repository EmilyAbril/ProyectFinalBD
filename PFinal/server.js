const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const oracledb = require('oracledb');
const db = require('./database');
const login = require('./login');
const register = require('./register');
const getProducts = require('./products');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 10 * 60 * 1000 } // 10 minutos de inactividad
}));

// Middleware para verificar la sesión del usuario
function checkAuth(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        res.redirect('/index.html');
    }
}

// Proteger todas las rutas estáticas excepto la página de inicio de sesión
app.use((req, res, next) => {
  if (req.session.user || req.path === '/index.html' || req.path === '/' || req.path === '/login' || req.path === '/register' || req.path.endsWith('.css') || req.path.endsWith('.js') || req.path.endsWith('.png') || req.path.endsWith('.jpg') || req.path.endsWith('.jpeg') || req.path.endsWith('.gif')){
        return next();
    } else {
        res.redirect('/index.html');
    }
});

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// Rutas para manejar el login y el registro
app.post('/login', login);
app.post('/register', register);

// Rutas protegidas
app.get('/home.html', checkAuth, (req, res) => {
    res.sendFile(__dirname + '/public/home.html');
});

app.get('/sofas.html', checkAuth, (req, res) => {
    res.sendFile(__dirname + '/public/sofas.html');
});

app.get('/sillones.html', checkAuth, (req, res) => {
    res.sendFile(__dirname + '/public/sillones.html');
});

app.get('/mesas.html', checkAuth, (req, res) => {
    res.sendFile(__dirname + '/public/mesas.html');
});

app.get('/cart.html', checkAuth, (req, res) => {
    res.sendFile(__dirname + '/public/cart.html');
});

// Ruta para obtener los productos
app.get('/products', checkAuth, getProducts);

// Ruta para obtener los artículos del carrito
app.get('/cart', checkAuth, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM detalles_carrito WHERE ID_CARRITO = :id_carrito', { id_carrito: req.session.id_carrito });
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener los artículos del carrito', err);
        res.status(500).send('Error interno del servidor');
    }
});

// Ruta para agregar un producto al carrito
app.post('/cart', checkAuth, async (req, res) => {
    const { id_producto, cantidad } = req.body;

    try {
        if (!req.session.id_carrito) {
            const carritoResult = await db.query(
                `INSERT INTO carrito (ID_USUARIO) VALUES (:id_usuario) RETURNING ID_CARRITO INTO :id_carrito`,
                { id_usuario: req.session.user, id_carrito: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }
            );
            req.session.id_carrito = carritoResult.outBinds.id_carrito[0];
        }

        const existsResult = await db.query(
            `SELECT * FROM detalles_carrito WHERE ID_CARRITO = :id_carrito AND ID_PRODUCTO = :id_producto`,
            { id_carrito: req.session.id_carrito, id_producto }
        );

        if (existsResult.rows.length > 0) {
            await db.query(
                `UPDATE detalles_carrito SET CANTIDAD = CANTIDAD + :cantidad WHERE ID_CARRITO = :id_carrito AND ID_PRODUCTO = :id_producto`,
                { cantidad, id_carrito: req.session.id_carrito, id_producto }
            );
        } else {
            await db.query(
                `INSERT INTO detalles_carrito (ID_CARRITO, ID_PRODUCTO, CANTIDAD) VALUES (:id_carrito, :id_producto, :cantidad)`,
                { id_carrito: req.session.id_carrito, id_producto, cantidad }
            );
        }

        res.status(201).send('Producto agregado al carrito');
    } catch (err) {
        console.error('Error al agregar el producto al carrito', err);
        res.status(500).send('Error interno del servidor');
    }
});

// Ruta para eliminar un producto del carrito
app.delete('/cart/:id_producto', checkAuth, async (req, res) => {
    const { id_producto } = req.params;

    try {
        await db.query('DELETE FROM detalles_carrito WHERE ID_CARRITO = :id_carrito AND ID_PRODUCTO = :id_producto', 
                       { id_carrito: req.session.id_carrito, id_producto });
        res.status(200).send('Producto eliminado del carrito');
    } catch (err) {
        console.error('Error al eliminar el producto del carrito', err);
        res.status(500).send('Error interno del servidor');
    }
});

// Ruta para cerrar sesión
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error al cerrar sesión');
        }
        res.status(200).send('Cierre de sesión exitoso');
    });
});

// Ruta para confirmar la compra
app.post('/purchase', checkAuth, async (req, res) => {
    const { total } = req.body;
    const userId = req.session.user;

    try {
        // Insertar la transacción
        const transactionResult = await db.query(
            `INSERT INTO transacciones (ID_USUARIO, FECHA_TRANSACCION, TOTAL) VALUES (:id_usuario, SYSDATE, :total) RETURNING ID_TRANSACCION INTO :id_transaccion`,
            { id_usuario: userId, total, id_transaccion: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }
        );
        const transactionId = transactionResult.outBinds.id_transaccion[0];

        // Obtener los detalles del carrito
        const cartResult = await db.query(
            `SELECT dc.ID_PRODUCTO, dc.CANTIDAD, p.PRECIO
            FROM detalles_carrito dc
            JOIN productos p ON dc.ID_PRODUCTO = p.ID_PRODUCTO
            WHERE dc.ID_CARRITO = :id_carrito`,
            { id_carrito: req.session.id_carrito }
        );

        // Insertar los detalles de la transacción
        for (const item of cartResult.rows) {
            await db.query(
                `INSERT INTO detalles_transaccion (ID_TRANSACCION, ID_PRODUCTO, CANTIDAD, PRECIO_POR_UNIDAD)
                VALUES (:id_transaccion, :id_producto, :cantidad, :precio_por_unidad)`,
                { id_transaccion: transactionId, id_producto: item.ID_PRODUCTO, cantidad: item.CANTIDAD, precio_por_unidad: item.PRECIO }
            );
        }

        // Vaciar el carrito
        await db.query(
            `DELETE FROM detalles_carrito WHERE ID_CARRITO = :id_carrito`,
            { id_carrito: req.session.id_carrito }
        );

        req.session.id_carrito = null;
        res.status(200).send('Compra realizada con éxito');
    } catch (err) {
        console.error('Error al procesar la compra', err);
        res.status(500).send('Error interno del servidor');
    }
});

// Inicializar la conexión a la base de datos y el servidor
db.initialize().then(() => {
    app.listen(3000, () => {
        console.log('Servidor ejecutándose en el puerto 3000');
    });
}).catch(err => {
    console.error('Error al inicializar la conexión a la base de datos', err);
});

// Ruta para obtener los artículos del carrito con los detalles del producto
app.get('/cart-items', checkAuth, async (req, res) => {
    try {
        const userId = req.session.user;
        const result = await db.query(`
            SELECT p.ID_PRODUCTO, p.NOMBRE, p.PRECIO, dc.CANTIDAD
            FROM detalles_carrito dc
            JOIN productos p ON dc.ID_PRODUCTO = p.ID_PRODUCTO
            JOIN carrito c ON dc.ID_CARRITO = c.ID_CARRITO
            WHERE c.ID_USUARIO = :userId`,
            { userId });
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener los artículos del carrito', err);
        res.status(500).send('Error interno del servidor');
    }
});

// Ruta para confirmar la compra
app.post('/confirm-purchase', checkAuth, async (req, res) => {
  const userId = req.session.user;
  try {
      const cartItemsResult = await db.query(`
          SELECT p.ID_PRODUCTO, dc.CANTIDAD, p.PRECIO AS PRECIO_POR_UNIDAD
          FROM detalles_carrito dc
          JOIN productos p ON dc.ID_PRODUCTO = p.ID_PRODUCTO
          JOIN carrito c ON dc.ID_CARRITO = c.ID_CARRITO
          WHERE c.ID_USUARIO = :userId
      `, { userId });

      const cartItems = cartItemsResult.rows;
      if (cartItems.length === 0) {
          return res.status(400).send('No hay productos en el carrito');
      }

      const total = cartItems.reduce((sum, item) => sum + (item.CANTIDAD * item.PRECIO_POR_UNIDAD), 0);

      const transactionResult = await db.query(`
          INSERT INTO transacciones (ID_USUARIO, FECHA_TRANSACCION, TOTAL)
          VALUES (:userId, SYSDATE, :total)
          RETURNING ID_TRANSACCION INTO :id_transaccion
      `, { userId, total, id_transaccion: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } });

      const transactionId = transactionResult.outBinds.id_transaccion[0];

      for (const item of cartItems) {
          await db.query(`
              INSERT INTO detalles_transaccion (ID_TRANSACCION, ID_PRODUCTO, CANTIDAD, PRECIO_POR_UNIDAD)
              VALUES (:transactionId, :productId, :cantidad, :precio)
          `, { transactionId, productId: item.ID_PRODUCTO, cantidad: item.CANTIDAD, precio: item.PRECIO_POR_UNIDAD });
      }

      // Limpiar el carrito del usuario
      await db.query(`
          DELETE FROM detalles_carrito WHERE ID_CARRITO IN (
              SELECT ID_CARRITO FROM carrito WHERE ID_USUARIO = :userId
          )
      `, { userId });

      res.json({ success: true, transactionId });
  } catch (error) {
      console.error('Error al procesar la compra', error);
      res.status(500).send('Error interno del servidor');
  }
});
