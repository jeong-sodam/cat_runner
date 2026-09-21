function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    entraSubject: row.entra_subject,
    tenantId: row.tenant_id,
    email: row.email,
    nickname: row.nickname,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function findById(db, userId) {
  return mapUser(db.prepare("SELECT * FROM users WHERE id = ?").get(userId));
}

function createUser(db, { entraSubject, tenantId, email, now = Date.now() }) {
  const result = db
    .prepare(
      "INSERT INTO users " +
        "(entra_subject, tenant_id, email, nickname, created_at, updated_at) " +
        "VALUES (@entraSubject, @tenantId, @email, NULL, @now, @now)",
    )
    .run({ entraSubject, tenantId, email, now });

  return findById(db, result.lastInsertRowid);
}

function findByEntraSubject(db, entraSubject) {
  return mapUser(
    db.prepare("SELECT * FROM users WHERE entra_subject = ?").get(entraSubject),
  );
}

function updateNickname(db, userId, nickname, now = Date.now()) {
  db.prepare(
    "UPDATE users SET nickname = ?, updated_at = ? WHERE id = ?",
  ).run(nickname, now, userId);

  return findById(db, userId);
}

module.exports = {
  createUser,
  findById,
  findByEntraSubject,
  updateNickname,
};
