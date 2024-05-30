const db = require('./database');

async function getProducts(req, res) {
    const categoria = req.query.categoria;
    try {
        console.log(`Obteniendo productos para la categoría: ${categoria}`);
        const result = await db.query('SELECT * FROM PRODUCTOS WHERE CATEGORIA_ID = :categoria', [categoria]);
        console.log('Productos obtenidos:', result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error('Error al obtener los productos', err);
        res.status(500).send('Error al obtener los productos');
    }
}

module.exports = getProducts;
