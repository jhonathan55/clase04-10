const e = require('express');
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.listen(3001, () => console.log('Listening on port 3001'));

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'new',
    password: 'root',
    port: 5432,
});
pool.connect((err) => {
    if (err) throw err;
    console.log('connected to database');
});

app.get('/joyas', async (req, res) => {
    try {
        const { limits, page, order_by } = req.query;
        console.log(limits, page, order_by);
        let orderByClause = '';
        if (order_by) {
            // precio_asc
            const [column, direction] = order_by.split('_');
            orderByClause = `ORDER BY ${column} ${direction.toUpperCase()}`;
        }
        const limit = parseInt(limits) || 3;
        const offSet = (parseInt(page) - 1) * limit || 0;
        console.log(limit, offSet);
        const client = await pool.connect();
        const result = await client.query(`
            select * from inventario
            ${orderByClause}
            limit $1 offset $2
        `, [limit, offSet]);
        const stockResult = await client.query(`
         SELECT SUM(stock) as total FROM inventario
        `);
        console.log('staos result', stockResult);
        const stockTotal = stockResult.rows[0].total;
        console.log(stockTotal);
        const respuesta = {
            totaljoyas: result.rowCount,
            stockTotal: parseInt(stockTotal),
            results: result.rows.map(joya => ({
                id: joya.id,
                nombre: joya.nombre,
                precio: joya.precio,
            })
            )
        }
        console.log(respuesta);
        res.json(respuesta);
        client.release();
    } catch (error) {
        console.log(error);
    }
})

app.get('/joyas/filter',async(req,res)=>{
    try {
        const {precio_max,precio_min,categoria,metal}=req.query;
        let query=`select * from inventario where 1=1`;
        const values=[];
        let index=1;
        if(precio_max){
            query+=` and precio <= $${index}`;
            values.push(precio_max);
            index++;
        }
        if(precio_min){
            query+=` and precio >= $${index}`;
            values.push(precio_min);
            index++;
        }
        if(categoria){
            query+=` and categoria = $${index}`;
            values.push(categoria);
            index++;
        }
        if(metal){
            query+=` and metal = $${index}`;
            values.push(metal);
            index++;
        }
        const client=await pool.connect();
        const result=await client.query(query,values);
        res.json(result.rows);
        client.release();

    } catch (error) {
        console.log(error);
        // res.send('Error en la consulta',error);
    }
})


