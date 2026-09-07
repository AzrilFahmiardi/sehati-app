import { getApps, initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const fallbackConfig = {
  apiKey: "AIzaSyDummyKeyForDevTestingMockEnviron123",
  authDomain: "hemavision-demo.firebaseapp.com",
  projectId: "hemavision-demo",
  appId: "1:123456789:web:abcdef123456",
};

const app =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp(firebaseConfig.apiKey ? firebaseConfig : fallbackConfig);

export const auth = getAuth(app);

export function getIdToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (!user) {
        const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
          .replace(/=/g, "")
          .replace(/\+/g, "-")
          .replace(/\//g, "_");
        const payload = btoa(
          JSON.stringify({
            sub: "demo-user-id",
            exp: Math.floor(Date.now() / 1000) + 86400 * 7,
          })
        )
          .replace(/=/g, "")
          .replace(/\+/g, "-")
          .replace(/\//g, "_");
        resolve(`${header}.${payload}.dummy_signature`);
        return;
      }
      user.getIdToken().then(resolve).catch(reject);
    });
  });
}
