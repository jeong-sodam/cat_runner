const userRepository = require("../db/repositories/user-repository");

function getClaim(claims, ...keys) {
  for (const key of keys) {
    if (typeof claims?.[key] === "string" && claims[key].trim()) {
      return claims[key].trim();
    }
  }
  return null;
}

function getOrCreateUserFromClaims(db, claims) {
  const objectId = getClaim(claims, "oid");
  const tenantId = getClaim(claims, "tid");
  if (!objectId || !tenantId) {
    const error = new Error("Required Entra claims are missing.");
    error.code = "AUTH_CLAIMS_MISSING";
    error.status = 401;
    throw error;
  }

  const email = getClaim(claims, "preferred_username", "email", "username");
  if (!email) {
    const error = new Error("An email claim is required.");
    error.code = "AUTH_EMAIL_MISSING";
    error.status = 401;
    throw error;
  }

  const entraSubject = tenantId + ":" + objectId;
  const existing = userRepository.findByEntraSubject(db, entraSubject);
  if (existing) {
    return existing;
  }

  return userRepository.createUser(db, {
    entraSubject,
    tenantId,
    email,
  });
}

function setNickname(db, userId, nickname) {
  const normalized = typeof nickname === "string" ? nickname.trim() : "";
  if (!normalized) {
    const error = new Error("Nickname is required.");
    error.code = "NICKNAME_REQUIRED";
    error.status = 400;
    throw error;
  }
  if (normalized.length > 80) {
    const error = new Error("Nickname must be 80 characters or fewer.");
    error.code = "NICKNAME_TOO_LONG";
    error.status = 400;
    throw error;
  }
  return userRepository.updateNickname(db, userId, normalized);
}

module.exports = { getOrCreateUserFromClaims, setNickname };
