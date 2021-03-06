'use strict';

const mysqlPool = require('../../../database/mysql-pool');

async function deleteUser(req, res) {
    const { userId } = req.claims;

    let connection;
    try {
        connection = await mysqlPool.getConnection();
        const sqlQuery = `UPDATE users
                            SET deleted_at = ?
                            WHERE id = ?
                            AND deleted_at IS NULL`;

        const now = new Date().toISOString().substring(0, 19).replace('T', ' ');
        const [deletedStatus] = await connection.execute(sqlQuery, [now, userId,]);
        connection.release();

        if (deletedStatus.changedRows !== 1) {
            return res.status(404).send("User not found");
        }

        return res.status(204).send();
    } catch (e) {
        if (connection) {
            connection.release();
        }
        console.error(e);
        return res.status(500).send();
    }
}

module.exports = deleteUser;
