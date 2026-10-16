// Firebase web config is public client configuration. Keep OAuth client secrets
// inside Firebase Console; never add them to this file or browser code.
export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  appId: "",
};

export const firebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === "string" && value.length > 0,
);

