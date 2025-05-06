import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ZkLoginProvider } from "@/contexts/ZkLoginContext";
import { Provider } from "@/components/ui/provider";
import FeedbackWidget from "@/components/FeedbackWidget";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider>
      <ZkLoginProvider>
        <Component {...pageProps} />
        <FeedbackWidget />
      </ZkLoginProvider>
    </Provider>
  );
}
