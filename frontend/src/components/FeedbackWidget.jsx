import { useEffect } from "react";
import Script from "next/script";

export default function FeedbackWidget() {
  useEffect(() => {
    // This runs after component mount, when first script might be loaded
    const hasScript =
      typeof window !== "undefined" && window.embed_feedback_widget;

    if (hasScript) {
      // Script already loaded, initialize directly
      window.embed_feedback_widget("init", "7p8j-n4uy-fpmw").then((config) => {
        console.log("Widget initialized with config:", config);
      });
    }
    // If not loaded yet, the onLoad handler below will handle it
  }, []);

  const handleScriptLoad = () => {
    // This runs when the script is fully loaded
    if (window.embed_feedback_widget) {
      window.embed_feedback_widget("init", "7p8j-n4uy-fpmw").then((config) => {
        console.log("Widget initialized with config:", config);
      });
    }
  };

  return (
    <Script
      src="https://422c26e9.feedback-widget-u8y.pages.dev/widget.js"
      data-server-url="https://feedback-widget-orrr.onrender.com"
      onLoad={handleScriptLoad}
    />
  );
}
