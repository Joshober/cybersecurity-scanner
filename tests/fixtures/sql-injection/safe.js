/**
 * Safe: parameterized queries. Should NOT be flagged.
 */

function handler(req, res) {
  const id = req.query.id;
  db.query("SELECT * FROM users WHERE id = ?", [id]);
}

db.query("SELECT * FROM users WHERE name = ?", [name]);
