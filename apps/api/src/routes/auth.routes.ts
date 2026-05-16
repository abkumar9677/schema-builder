import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { signAccessToken } from "../utils/tokens.js";

const router = Router();
const oauthProviderSchema = z.enum(["google", "microsoft"]);
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

type OAuthProvider = z.infer<typeof oauthProviderSchema>;
type OAuthState = { provider: OAuthProvider };
type OAuthUserInfo = {
  email?: string;
  preferred_username?: string;
  name?: string;
};

const oauthConfig = {
  google: {
    clientId: () => env.GOOGLE_CLIENT_ID,
    clientSecret: () => env.GOOGLE_CLIENT_SECRET,
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile"
  },
  microsoft: {
    clientId: () => env.MICROSOFT_CLIENT_ID,
    clientSecret: () => env.MICROSOFT_CLIENT_SECRET,
    authorizationUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    userInfoUrl: "https://graph.microsoft.com/oidc/userinfo",
    scope: "openid email profile"
  }
} satisfies Record<OAuthProvider, {
  clientId: () => string;
  clientSecret: () => string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
}>;

function oauthCallbackUrl(provider: OAuthProvider) {
  return `${env.OAUTH_CALLBACK_BASE_URL.replace(/\/$/, "")}/api/auth/oauth/${provider}/callback`;
}

function redirectWithAuthToken(token: string) {
  const redirectUrl = new URL(env.OAUTH_SUCCESS_REDIRECT);
  redirectUrl.searchParams.set("token", token);
  return redirectUrl.toString();
}

function redirectWithOAuthError(message: string) {
  const redirectUrl = new URL(env.OAUTH_SUCCESS_REDIRECT);
  redirectUrl.searchParams.set("auth_error", message);
  return redirectUrl.toString();
}

function getEnabledOAuthConfig(provider: OAuthProvider) {
  const config = oauthConfig[provider];
  if (!config.clientId() || !config.clientSecret()) return undefined;
  return config;
}

router.post("/register", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ code: "VALIDATION_ERROR", issues: parsed.error.issues });
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({ data: { email: parsed.data.email, passwordHash } });
  return res.status(201).json({ token: signAccessToken({ sub: user.id, email: user.email }) });
});

router.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ code: "VALIDATION_ERROR", issues: parsed.error.issues });
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user?.passwordHash || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ code: "INVALID_CREDENTIALS", message: "Email or password is incorrect" });
  }
  return res.json({ token: signAccessToken({ sub: user.id, email: user.email }) });
});

router.get("/oauth/:provider", (req, res) => {
  const parsedProvider = oauthProviderSchema.safeParse(req.params.provider);
  if (!parsedProvider.success) return res.status(404).json({ code: "OAUTH_PROVIDER_NOT_FOUND" });

  const provider = parsedProvider.data;
  const config = getEnabledOAuthConfig(provider);
  if (!config) return res.status(501).json({ code: "OAUTH_PROVIDER_NOT_CONFIGURED" });

  const authorizationUrl = new URL(config.authorizationUrl);
  authorizationUrl.searchParams.set("client_id", config.clientId());
  authorizationUrl.searchParams.set("redirect_uri", oauthCallbackUrl(provider));
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", config.scope);
  authorizationUrl.searchParams.set("state", jwt.sign({ provider } satisfies OAuthState, env.JWT_SECRET, { expiresIn: "10m" }));
  authorizationUrl.searchParams.set("prompt", "select_account");

  return res.redirect(authorizationUrl.toString());
});

router.get("/oauth/:provider/callback", async (req, res) => {
  const parsedProvider = oauthProviderSchema.safeParse(req.params.provider);
  if (!parsedProvider.success) return res.redirect(redirectWithOAuthError("Unsupported OAuth provider"));

  const provider = parsedProvider.data;
  const config = getEnabledOAuthConfig(provider);
  if (!config) return res.redirect(redirectWithOAuthError("OAuth provider is not configured"));
  if (typeof req.query.error === "string") return res.redirect(redirectWithOAuthError(req.query.error));
  if (typeof req.query.code !== "string" || typeof req.query.state !== "string") {
    return res.redirect(redirectWithOAuthError("OAuth callback is missing required parameters"));
  }

  try {
    const state = jwt.verify(req.query.state, env.JWT_SECRET) as OAuthState;
    if (state.provider !== provider) return res.redirect(redirectWithOAuthError("OAuth state does not match provider"));

    const tokenResponse = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId(),
        client_secret: config.clientSecret(),
        code: req.query.code,
        grant_type: "authorization_code",
        redirect_uri: oauthCallbackUrl(provider)
      })
    });
    if (!tokenResponse.ok) return res.redirect(redirectWithOAuthError("OAuth token exchange failed"));

    const tokenPayload = await tokenResponse.json() as { access_token?: string };
    if (!tokenPayload.access_token) return res.redirect(redirectWithOAuthError("OAuth provider did not return an access token"));

    const userInfoResponse = await fetch(config.userInfoUrl, {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` }
    });
    if (!userInfoResponse.ok) return res.redirect(redirectWithOAuthError("OAuth profile lookup failed"));

    const userInfo = await userInfoResponse.json() as OAuthUserInfo;
    const email = (userInfo.email ?? userInfo.preferred_username)?.toLowerCase();
    if (!email) return res.redirect(redirectWithOAuthError("OAuth profile did not include an email address"));

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash: await bcrypt.hash(randomUUID(), 12) }
    });

    return res.redirect(redirectWithAuthToken(signAccessToken({ sub: user.id, email: user.email })));
  } catch (error) {
    console.error("OAuth sign in failed", error);
    return res.redirect(redirectWithOAuthError("OAuth sign in failed"));
  }
});

export default router;
