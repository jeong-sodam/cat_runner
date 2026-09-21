const { ConfidentialClientApplication } = require("@azure/msal-node");

function createMsalClient(config) {
  if (!config.authConfigured) {
    return null;
  }

  return new ConfidentialClientApplication({
    auth: {
      clientId: config.entraClientId,
      clientSecret: config.entraClientSecret,
      authority: config.entraAuthority,
    },
  });
}

async function buildAuthUrl(msalClient, config) {
  return msalClient.getAuthCodeUrl({
    scopes: ["openid", "profile", "email"],
    redirectUri: config.entraRedirectUri,
  });
}

async function redeemAuthorizationCode(msalClient, config, code) {
  return msalClient.acquireTokenByCode({
    code,
    scopes: ["openid", "profile", "email"],
    redirectUri: config.entraRedirectUri,
  });
}

module.exports = {
  createMsalClient,
  buildAuthUrl,
  redeemAuthorizationCode,
};
