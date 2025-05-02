import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ZkLoginProvider } from "@/contexts/ZkLoginContext";
import { Provider } from "@/components/ui/provider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider>
      <ZkLoginProvider>
        <Component {...pageProps} />
      </ZkLoginProvider>
    </Provider>
  );
}
