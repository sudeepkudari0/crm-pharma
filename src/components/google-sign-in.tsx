"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

declare global {
  interface Window {
    google?: any;
  }
}

const getGoogleClientId = async () => {
  const response = await fetch("/api/google", {
    method: "GET",
  });
  const data = await response.json();
  return data.clientId;
};

const loginWithGoogle = async (credential: string) => {
  const response = await fetch("/api/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
  return response.json();
};

export const GoogleSignIn = ({
  setIsGoogleLoading,
}: {
  setIsGoogleLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { data: session, status } = useSession();

  const isMounted = useRef(true);
  const isInitialized = useRef(false);

  const handleCredentialResponse = async (response: any) => {
    if (!isMounted.current) return;

    if (
      !response?.credential ||
      typeof response.credential !== "string" ||
      !response.credential.includes(".")
    ) {
      console.error(
        "Invalid credential format received from Google:",
        response?.credential
      );
      toast.error("Sign in failed: Invalid response from Google.");
      setIsGoogleLoading(false);
      return;
    }

    try {
      const result = await loginWithGoogle(response.credential);

      if (result?.ok && !result.error) {
        toast.success("Signed in successfully!");
        window.location.href = "/dashboard";
      } else {
        if (result?.error === "CredentialsSignin") {
          toast.error("Sign in failed. User not registered or inactive.");
        } else if (result?.error) {
          toast.error(`Sign in failed: ${result.error}`);
        } else {
          toast.error("Sign in failed. Please try again.");
        }
        console.error("Google One Tap Sign In Error:", result?.error);
        setIsGoogleLoading(false);
      }
    } catch (err) {
      toast.error("An unexpected error occurred during sign in.");
      console.error("Sign In Catch Error:", err);
      setIsGoogleLoading(false);
    }
  };

  const renderGoogleButton = () => {
    if (
      window.google?.accounts?.id &&
      isMounted.current &&
      isInitialized.current
    ) {
      const buttonDiv = document.getElementById("googleSignInButton");
      if (buttonDiv && !buttonDiv.hasChildNodes()) {
        try {
          window.google.accounts.id.renderButton(buttonDiv, {
            type: "standard",
            theme: "filled_blue",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            width: 360,
            logo_alignment: "left",
          });
        } catch (error) {
          console.error("Error rendering Google button:", error);
        }
      }
    }
  };

  const initializeGoogleSignIn = async (clientId: string) => {
    if (window.google?.accounts?.id && !isInitialized.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
        });
        isInitialized.current = true;
        renderGoogleButton();
      } catch (error) {
        console.error("Error initializing Google Sign-In:", error);
      }
    } else if (isInitialized.current) {
      renderGoogleButton();
    }
  };

  useEffect(() => {
    isMounted.current = true;
    let script: HTMLScriptElement | null = null;

    const loadGoogleScript = async () => {
      try {
        const data = await getGoogleClientId();
        if (!data) throw new Error("Failed to fetch Google Client ID");
        const clientId = data;

        if (window.google?.accounts?.id) {
          await initializeGoogleSignIn(clientId);
          return;
        }

        script = document.createElement("script");
        script.id = "google-client-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = async () => {
          if (window.google && isMounted.current) {
            await initializeGoogleSignIn(clientId);
          } else {
            console.error("Google API not available after script load");
          }
        };
        script.onerror = () => console.error("Failed to load Google script");
        document.body.appendChild(script);
      } catch (error) {
        console.error("Error loading Google script:", error);
      }
    };

    const existingScript = document.getElementById("google-client-script");

    if (!existingScript) {
      loadGoogleScript();
    } else if (!isInitialized.current) {
      getGoogleClientId().then((data) => {
        if (data.clientId && window.google?.accounts?.id) {
          initializeGoogleSignIn(data.clientId);
        }
      });
    } else {
      renderGoogleButton();
    }

    return () => {
      isMounted.current = false;
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch (error) {
          console.error("Error canceling Google Sign-In:", error);
        }
      }
    };
  }, [status]);

  if (status === "authenticated") {
    return null;
  }
  if (status === "loading") {
    return null;
  }

  return (
    <div className="flex justify-center w-full">
      <div id="googleSignInButton"></div>
    </div>
  );
};

export default GoogleSignIn;
