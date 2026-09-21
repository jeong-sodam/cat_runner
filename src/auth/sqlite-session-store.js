const session = require("express-session");

function getExpiry(sessionData, now = Date.now()) {
  const cookie = sessionData?.cookie;
  if (cookie?.expires) {
    const expiry = new Date(cookie.expires).getTime();
    if (Number.isFinite(expiry)) {
      return expiry;
    }
  }
  if (Number.isFinite(cookie?.maxAge)) {
    return now + cookie.maxAge;
  }
  return now + 86400000;
}

class SQLiteSessionStore extends session.Store {
  constructor(db) {
    super();
    this.db = db;
    this.getStatement = db.prepare(
      "SELECT sess, expired_at FROM sessions WHERE sid = ?",
    );
    this.deleteStatement = db.prepare("DELETE FROM sessions WHERE sid = ?");
    this.setStatement = db.prepare(
      "INSERT INTO sessions (sid, sess, expired_at) VALUES (?, ?, ?) " +
        "ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, " +
        "expired_at = excluded.expired_at",
    );
    this.touchStatement = db.prepare(
      "UPDATE sessions SET sess = ?, expired_at = ? WHERE sid = ?",
    );
  }

  get(sid, callback) {
    try {
      const row = this.getStatement.get(sid);
      if (!row || row.expired_at <= Date.now()) {
        if (row) {
          this.deleteStatement.run(sid);
        }
        return callback(null, null);
      }
      return callback(null, JSON.parse(row.sess));
    } catch (error) {
      return callback(error);
    }
  }

  set(sid, sessionData, callback) {
    try {
      this.setStatement.run(
        sid,
        JSON.stringify(sessionData),
        getExpiry(sessionData),
      );
      return callback?.(null);
    } catch (error) {
      return callback?.(error);
    }
  }

  destroy(sid, callback) {
    try {
      this.deleteStatement.run(sid);
      return callback?.(null);
    } catch (error) {
      return callback?.(error);
    }
  }

  touch(sid, sessionData, callback) {
    try {
      this.touchStatement.run(
        JSON.stringify(sessionData),
        getExpiry(sessionData),
        sid,
      );
      return callback?.(null);
    } catch (error) {
      return callback?.(error);
    }
  }
}

module.exports = { SQLiteSessionStore };
