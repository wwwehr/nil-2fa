import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  zkLoginClient,
  getJwtFromCookies,
  AuthState,
} from "../lib/zklogin";
import {
  Did,
  Command,
  type NucTokenEnvelope,
  NucTokenBuilder,
  NucTokenEnvelopeSchema,
} from "@nillion/nuc";
import * as secp from "@noble/secp256k1";

// Define the shape of our context
interface ZkLoginContextType extends AuthState {
  isLoading: boolean;
  basicNuc: (data: string) => Promise<>;
  hardwareInit: () => void;
  logout: () => void;
}

// Create context with default values
const ZkLoginContext = createContext<ZkLoginContextType>({
  isAuthenticated: false,
  isLoading: true,
  basicNuc: async () => null,
  logout: () => {},
  hardwareInit: async () => {},
});

// Provider component
export const ZkLoginProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication on mount
  useEffect(() => {
    const initialize = async () => {
      if (typeof window === "undefined") return;

      try {
        const jwt = getJwtFromCookies();
        if (!jwt) {
          console.warn(`did not find auth state`);
          setIsLoading(false);
          return;
        } else {
          console.warn(`got auth state`);
        }

        const userId = zkLoginClient!.getUserIdFromJwt(jwt);

        setAuthState({
          isAuthenticated: true,
          jwt,
          userId,
        });
      } catch (error) {
        console.error("Google Authentication error:", error);
        setAuthState({
          isAuthenticated: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const hardwareInit = async () => {
    if (!authState.jwt) return null;

    try {
      const derivedKeyMaterial = await zkLoginClient!.processJwtCookie(
        authState.jwt
      );
      const privateKey = new Uint8Array(derivedKeyMaterial);
      const privKeyHex = secp.etc.bytesToHex(privateKey);

      const pubKey = secp.getPublicKey(privateKey, true); // compressed format
      const pubKeyHex = secp.etc.bytesToHex(pubKey);

      setAuthState((prevState) => ({
        ...prevState,
        derivedKeyMaterial,
        privateKey,
        privKeyHex,
        pubKey,
        pubKeyHex,
      }));
    } catch (error) {
      console.error("hardwareInit error:", error);
      return null;
    }
  };

  // Encryption function using the derived key
  const basicNuc = useCallback(
    async (data: string): Promise<NucTokenEnvelope | null> => {
      if (!authState.privateKey) return null;

      try {
        const token = NucTokenBuilder.delegation([])
          .audience(new Did(Uint8Array.from(Array(33).fill(0xbb))))
          .subject(new Did(Uint8Array.from(Array(33).fill(0xcc))))
          .command(new Command(["nil", "db", "read"]))
          .meta({ name: data })
          .build(authState.privateKey);

        const envelope = NucTokenEnvelopeSchema.parse(token);
        envelope.validateSignatures();

        return envelope;
      } catch (error) {
        console.error("nuc build error:", error);
        return null;
      }
    },
    [authState.privateKey]
  );

  // Logout function
  const logout = useCallback(() => {
    // Note: This doesn't actually clear the cookie - that should be done by your Python backend
    // You would typically call a logout API endpoint here
    window.location.href = "/api/auth/logout";
  }, []);

  // Combined context value
  const contextValue: ZkLoginContextType = {
    ...authState,
    isLoading,
    basicNuc,
    logout,
    hardwareInit,
  };

  return (
    <ZkLoginContext.Provider value={contextValue}>
      {children}
    </ZkLoginContext.Provider>
  );
};

// Custom hook to use the zkLogin context
export const useZkLogin = () => useContext(ZkLoginContext);
