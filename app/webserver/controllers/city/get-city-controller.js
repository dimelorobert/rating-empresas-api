"use strict";

const Joi = require("@hapi/joi");
const mysqlPool = require("../../../database/mysql-pool");

async function validate(payload) {
    const schema = Joi.object({
        cityId: Joi.string().guid({
            version: ['uuidv4'],
        }).required(),
    });
    Joi.assert(payload, schema);
}

async function getCity(req, res) {

    const cityId = req.params.cityId;

    try {
        await validate({ cityId });
    } catch (e) {
        console.error(e);
        return res.status(400).send("Data are not valid");
    }

    let connection;
    try {
        connection = await mysqlPool.getConnection();
        const sqlQuery =
            `SELECT c.id, c.name, c.region_id, r.name, c.province_id, p.name 
             FROM cities AS c 
             INNER JOIN regions AS r ON c.region_id = r.id 
             INNER JOIN provinces AS p ON c.province_id = p.id 
             WHERE c.id =?;`;
        const [rows] = await connection.execute(sqlQuery, [
            cityId,
        ]);
        connection.release();
        if (rows.length === 0) {
            return res.status(404).send("City not found");
        }
        return res.send(rows);
    } catch (e) {
        if (connection) {
            connection.release();
        }
        console.error(e);
        return res.status(500).send();
    }
}

module.exports = getCity;
