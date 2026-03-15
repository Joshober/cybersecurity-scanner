/**
 * Vulnerable: user input flows into SQL via string concatenation.
 * Should be flagged by pattern rule and/or taint (injection.sql.string-concat or injection.sql.tainted-flow).
 */

function handler(req, res) {
  const id = req.query.id;
  const user = id;
  db.query("SELECT * FROM users WHERE id=" + user);
}

// Same pattern with name
const name = req.query.name;
db.query("SELECT * FROM users WHERE name='" + name + "'");
