"use strict";

const Joi = require("@hapi/joi");
const mysqlPool = require("../../../database/mysql-pool");

async function validate(payload) {
  const schema = Joi.object({
    row4page: Joi.number(),
    page: Joi.number()
  });
  Joi.assert(payload, schema);
}

async function getCompanies(req, res) {
  let { row4page, page } = req.query;

  try {
    await validate({ row4page, page });
  } catch (e) {
    console.error(e);
    return res.status(400).send("Data are not valid");
  }

  let numsRows = 0;

  let connection;
  try {
    connection = await mysqlPool.getConnection();
    let sqlQuery = "SELECT COUNT(*) as numsRows FROM companies;";
    let [rows] = await connection.query(sqlQuery);
    numsRows = parseInt(rows[0].numsRows);
    let offset = 0;
    if ((row4page != undefined) & (page != undefined)) {
      row4page = parseInt(row4page);
      page = parseInt(page);
      offset = row4page * (page - 1);
    } else {
      page = 1;
      row4page = numsRows;
    }

    sqlQuery = `SELECT c.id, c.name, c.description,
      c.url_web, c.linkedin, c.url_logo, c.address, c.sede_id, c.sector_id, s.sector, c.user_id,
      u.role AS userRole, u.deleted_at AS userDeleteAt
      FROM companies c
      INNER JOIN users AS u ON u.id = c.user_id
      INNER JOIN sectors AS s ON c.sector_id = s.id
      ORDER BY c.name LIMIT ?,?;`;
    [rows] = await connection.execute(sqlQuery, [offset, row4page]);
    connection.release();
    return res.send({
      numsRows,
      page,
      rows
    });
  } catch (e) {
    if (connection) {
      connection.release();
    }
    console.error(e);
    return res.status(500).send();
  }
}

module.exports = getCompanies;
