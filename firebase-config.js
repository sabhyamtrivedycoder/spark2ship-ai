// Firebase web config is public client configuration. Keep OAuth client secrets
// inside Firebase Console; never add them to this file or browser code.
export const firebaseConfig = {
  apiKey: "AIzaSyCJuTMyI71TsqQgEztqMbekYdx4xriF6CE",
  authDomain: "spark2ship.firebaseapp.com",
  projectId: "spark2ship",
  appId: "1:989596636243:web:7f52edaab5f6c473fc62a6",
};

export const firebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === "string" && value.length > 0,
);
