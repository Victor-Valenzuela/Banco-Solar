const { Pool } = require('pg');
const moment = require('moment');

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "bancosolar",
    password: "123",
    port: 5432,
    ssl: false,
    max: 20,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 2000,
});

const nuevoUsuario = async (parametros) => {
    const query = {
        text: 'insert into usuarios (nombre, balance) values ($1, $2) returning *',
        values: parametros,
    };
    try {
        const resp = await pool.query(query);
        console.log(`"${resp.rows[0].nombre}" se ha agregado con éxito`);
    } catch (error) {
        console.log('Error al ejecutar la instrucción: ' + error.message);
    }
}

const getUsuarios = async () => {
    try {
        return await pool.query('select * from usuarios order by id');
    } catch (error) {
        console.log('Error al ejecutar la instrucción: ' + error.message);
    }
};

const editUsuario = async (parametros) => {
    const query = {
        text: `UPDATE usuarios SET nombre = $2, balance = $3 WHERE id = $1 RETURNING *`,
        values: parametros,
    };
    try {
        const resp = await pool.query(query);
        console.log(`"${resp.rows[0].nombre}" se ha editado con éxito`);
    } catch (error) {
        console.log('Error al ejecutar la instrucción: ' + error.message);
    }
};

const eliminarUsuario = async (parametro) => {
    try {
        const resp = await pool.query(`DELETE FROM usuarios WHERE id = ${parametro};`);
        console.log(`Usuario eliminado con éxito`, resp.rowCount);
    } catch (error) {
        console.log('Error al ejecutar la instrucción: ' + error.code);
        return error
    }
};

const nuevaTransferencia = async (parametros) => {
    const fecha = moment().locale("es-mx").format('L LT');

    const transferencia = {
        text: `insert into transferencias (emisor,receptor,monto,fecha) values ($1, $2, $3,'${fecha}') returning *`,
        values: parametros,
    };
    const descuento = {
        text: "update usuarios set balance = balance - $2 where id = $1 returning *",
        values: [parametros[0], parametros[2]],
    };
    const aumento = {
        text: "update usuarios set balance = balance + $2 where id = $1 returning *",
        values: [parametros[1], parametros[2]],
    };

    try {
        await pool.query('BEGIN');
        const resp = await pool.query(transferencia);
        await pool.query(descuento);
        await pool.query(aumento);
        await pool.query('COMMIT');
        console.log(`Transferencia realizada con éxito desde la cuenta ${resp.rows[0].emisor} a ${resp.rows[0].receptor} por un monto de ${resp.rows[0].monto} con fecha ${resp.rows[0].fecha}`);
        return resp;
    } catch (error) {
        await pool.query('ROLLBACK');
        console.log('Error al ejecutar la instrucción: ' + error.message);
    }
}

const getTransferencias = async () => {
    const query = {
        rowMode: 'array',
        text: `select t.fecha as fecha, u.nombre as Emisor,
        us.nombre as Receptor, t.monto as Monto from transferencias t
        inner join usuarios u on t.emisor = u.id
        inner join usuarios us on t.receptor = us.id;`,
    };
    try {
        return await pool.query(query);
    } catch (error) {
        console.log('Error al ejecutar la instrucción: ' + error.message);
    }
}

module.exports = { nuevoUsuario, getUsuarios, editUsuario, eliminarUsuario, nuevaTransferencia, getTransferencias };