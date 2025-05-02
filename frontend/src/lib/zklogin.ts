// Type definitions
export type JwtPayload = {
  iss: string; // Issuer
  sub: string; // Subject (user identifier)
  aud: string; // Audience
  exp: number; // Expiration time
  iat: number; // Issued at time
  [key: string]: any; // Allow additional claims
};

export type AuthState = {
  isAuthenticated: boolean;
  derivedKeyMaterial?: ArrayBuffer;
  privateKey?: Uint8Array<ArrayBuffer>;
  privKeyHex?: string;
  pubKey?: any;
  pubKeyHex?: string;
  jwt?: string;
  userId?: string;
  error?: string;
};

/**
 * Core zkLogin implementation
 */
class ZkLoginClient {
  private rpId: string;
  private rpName: string;

  constructor(
    rpId: string = typeof window !== "undefined"
      ? window.location.hostname
      : "localhost",
    rpName: string = "Nillion 2FA"
  ) {
    this.rpId = rpId;
    this.rpName = rpName;
  }

  /**
   * Process JWT from cookie
   */
  public async processJwtCookie(jwt: string): Promise<ArrayBuffer> {
    // Step 1: Extract identity information from JWT
    const jwtPayload = this.parseJwt(jwt);

    // Step 2: Create deterministic challenge based on JWT contents
    const challenge = await this.createChallengeFromJwt(jwtPayload);

    // Step 3: Get or create passkey
    const keyData = await this.getOrCreatePasskey(jwtPayload, challenge);

    // Step 4: Derive final key using JWT and passkey signature
    return this.deriveKey(jwt, keyData);
  }

  /**
   * Parse JWT to extract payload
   */
  public parseJwt(token: string): JwtPayload {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid JWT format");
      }

      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error parsing JWT:", error);
      throw new Error("Failed to parse JWT");
    }
  }

  /**
   * Create a deterministic challenge from JWT payload
   */
  private async createChallengeFromJwt(
    jwtPayload: JwtPayload
  ): Promise<ArrayBuffer> {
    // Create a deterministic string from critical JWT fields
    const challengeStr = `${jwtPayload.iss}:${jwtPayload.sub}:${jwtPayload.aud}`;

    // Hash it to get a fixed-length challenge
    const encoder = new TextEncoder();
    const data = encoder.encode(challengeStr);
    return crypto.subtle.digest("SHA-256", data);
  }

  /**
   * Create a deterministic user ID from JWT payload
   */
  private async createUserId(jwtPayload: JwtPayload): Promise<ArrayBuffer> {
    const userIdStr = `${jwtPayload.iss}:${jwtPayload.sub}`;
    const encoder = new TextEncoder();
    return crypto.subtle.digest("SHA-256", encoder.encode(userIdStr));
  }

  /**
   * Get existing passkey or create a new one
   */
  private async getOrCreatePasskey(
    jwtPayload: JwtPayload,
    challenge: ArrayBuffer
  ): Promise<ArrayBuffer> {
    console.log(`I am in getOrCreatePasskey`);
    try {
      // Try to get assertion from existing passkey
      const assertion = await this.getPasskeyAssertion(challenge);
      return (assertion.response as AuthenticatorAssertionResponse).signature;
    } catch (error) {
      // No existing passkey found, create a new one
      console.log("No existing passkey found, creating new one");
      const credential = await this.createPasskey(jwtPayload, challenge);
      return (credential.response as AuthenticatorAttestationResponse).attestationObject;
    }
  }

  /**
   * Get assertion from existing passkey
   */
  private async getPasskeyAssertion(
    challenge: ArrayBuffer
  ): Promise<PublicKeyCredential> {
    if (
      typeof window === "undefined" ||
      !navigator.credentials ||
      !navigator.credentials.get
    ) {
      throw new Error("WebAuthn not supported in this environment");
    }
    console.log(`I am in getPasskeyAssertion`);

    // Try to get an assertion from any available passkey
    return (await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(challenge),
        rpId: this.rpId,
        userVerification: "preferred",
        // By not providing allowCredentials, we let the browser discover available credentials
      },
    })) as PublicKeyCredential;
  }

  /**
   * Create a new passkey
   */
  private async createPasskey(
    jwtPayload: JwtPayload,
    challenge: ArrayBuffer
  ): Promise<PublicKeyCredential> {
    if (
      typeof window === "undefined" ||
      !navigator.credentials ||
      !navigator.credentials.create
    ) {
      throw new Error("WebAuthn not supported in this environment");
    }

    console.log(`I am in createPasskey`);

    // Create user ID from JWT payload
    const userId = await this.createUserId(jwtPayload);

    // Create new passkey
    const creds: PublicKeyCredentialCreationOptions = {
      challenge: new Uint8Array(challenge),
      rp: {
        name: this.rpName,
        id: this.rpId,
      },
      user: {
        id: new Uint8Array(userId),
        name: jwtPayload.sub,
        displayName: jwtPayload.sub,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -8 }, // Ed25519
      ],
      authenticatorSelection: {
        residentKey: "required",
        requireResidentKey: true,
        userVerification: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    };
    console.log({
      location: window.location.hostname,
      rpId: this.rpId,
      userId,
      jwtSub: jwtPayload.sub,
    });
    try {
      const credential: Credential | null = await navigator.credentials.create({
        publicKey: creds,
      });
      console.log("Credential created:", credential);
      return credential as PublicKeyCredential;
    } catch (err) {
      console.error("Registration error:", err);
      throw err;
    }
  }

  /**
   * Derive final cryptographic key from JWT and passkey data
   */
  private async deriveKey(
    jwt: string,
    keyData: ArrayBuffer
  ): Promise<ArrayBuffer> {
    console.log(`I am in derivedKey`);
    // Convert JWT to bytes for use as context info
    const encoder = new TextEncoder();
    const payload = this.parseJwt(jwt);

    const combinedArray = Uint8Array.from([
      ...encoder.encode(payload.iss),
      ...encoder.encode(payload.sub),
      ...encoder.encode(payload.aud),
      ...new Uint8Array(keyData),
    ]);

    return await crypto.subtle.digest("SHA-256", combinedArray);
  }

  /**
   * Helper to extract user ID from JWT
   */
  public getUserIdFromJwt(jwt: string): string {
    console.log(`I am in getUserIdFromJwt`);
    const payload = this.parseJwt(jwt);
    return payload.sub;
  }
}

// Create a singleton instance
export const zkLoginClient =
  typeof window !== "undefined" ? new ZkLoginClient() : null; // Null when running on server

/**
 * Utility function to get JWT from cookies
 */
export function getJwtFromCookies(): string | null {
  if (typeof document === "undefined") return null;
  console.warn(`looking for cookies`);

  const cookies = document.cookie.split(";");
  const cookieString = document.cookie;
  console.log({ cookieString });
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    // Assuming JWT is stored in a cookie named 'auth_token'
    if (cookie.startsWith("auth_token=")) {
      return cookie.substring("auth_token=".length, cookie.length);
    }
  }
  return null;
}
