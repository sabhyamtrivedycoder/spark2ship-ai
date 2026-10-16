import { firebaseConfig, firebaseConfigured } from "./firebase-config.js";

const dialog = document.querySelector("#auth-dialog");
const openButton = document.querySelector("#auth-open");
const signedOutPanel = document.querySelector("#auth-signed-out");
const signedInPanel = document.querySelector("#auth-signed-in");
const status = document.querySelector("#auth-status");
const emailForm = document.querySelector("#email-auth-form");
const emailField = document.querySelector("#auth-email");
const passwordField = document.querySelector("#auth-password");
const submitButton = document.querySelector("#auth-submit");
const modeToggle = document.querySelector("#auth-mode-toggle");
const authTitle = document.querySelector("#auth-title");
let mode = "sign-in";

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function setMode(nextMode) {
  mode = nextMode;
  const signingUp = mode === "sign-up";
  authTitle.textContent = signingUp ? "Create your builder account." : "Pick up where you left off.";
  submitButton.firstChild.textContent = signingUp ? "Create account " : "Sign in ";
  passwordField.autocomplete = signingUp ? "new-password" : "current-password";
  modeToggle.textContent = signingUp ? "I already have an account" : "Create an account";
  document.querySelector("#auth-reset").hidden = signingUp;
  setStatus(signingUp ? "Use at least 8 characters for your password." : "");
}

function showAuthError(error) {
  const messages = {
    "auth/email-already-in-use": "An account already uses this email. Try signing in instead.",
    "auth/invalid-credential": "That email or password didn’t work. Check them and try again.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Choose a stronger password with at least 8 characters.",
    "auth/too-many-requests": "Too many attempts. Wait a little and try again.",
    "auth/popup-blocked": "Your browser blocked the sign-in window. Allow redirects and try again.",
    "auth/operation-not-allowed": "This sign-in option is not enabled for Spark2Ship yet.",
    "auth/unauthorized-domain": "This website is not yet on Firebase’s authorized domain list.",
    "auth/account-exists-with-different-credential": "An account already uses this email with another sign-in method.",
  };
  setStatus(messages[error.code] || "Sign-in could not be completed. Check the provider setup and try again.", true);
}

openButton.addEventListener("click", () => dialog.showModal());
document.querySelector("#auth-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
modeToggle.addEventListener("click", () => setMode(mode === "sign-in" ? "sign-up" : "sign-in"));
emailForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!firebaseConfigured) return setStatus("Account sign-in is not connected yet. Add the Firebase web config and enable the sign-in providers to continue.", true);
  const email = emailField.value.trim();
  const password = passwordField.value;
  if (mode === "sign-up" && password.length < 8) return setStatus("Choose a password with at least 8 characters.", true);
  submitButton.disabled = true;
  submitButton.firstChild.textContent = mode === "sign-up" ? "Creating account… " : "Signing in… ";
  try {
    const auth = await getAuthInstance();
    if (mode === "sign-up") {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(credential.user);
      setStatus("Account created. Check your email for a verification link.");
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      dialog.close();
    }
  } catch (error) {
    showAuthError(error);
  } finally {
    submitButton.disabled = false;
    submitButton.firstChild.textContent = mode === "sign-up" ? "Create account " : "Sign in ";
  }
});

document.querySelector("#auth-reset").addEventListener("click", async () => {
  if (!firebaseConfigured) return setStatus("Password reset is not connected until Firebase Authentication is configured.", true);
  const email = emailField.value.trim();
  if (!email) {
    emailField.focus();
    return setStatus("Enter your email address first, then choose Forgot password.");
  }
  try {
    await sendPasswordResetEmail(await getAuthInstance(), email);
    setStatus("If an account uses that email, a password reset link is on its way.");
  } catch (error) {
    showAuthError(error);
  }
});

document.querySelectorAll("[data-provider]").forEach((button) => {
  button.addEventListener("click", async () => {
    if (!firebaseConfigured) return setStatus("Account sign-in is not connected yet. Add the Firebase web config and enable the sign-in providers to continue.", true);
    try {
      const auth = await getAuthInstance();
      const provider = providerFor(button.dataset.provider);
      await signInWithRedirect(auth, provider);
    } catch (error) {
      showAuthError(error);
    }
  });
});

document.querySelector("#auth-signout").addEventListener("click", async () => {
  try {
    await signOut(await getAuthInstance());
    signedInPanel.hidden = true;
    signedOutPanel.hidden = false;
    openButton.textContent = "Sign in";
    setMode("sign-in");
    setStatus("You’re signed out.");
  } catch (error) {
    document.querySelector("#auth-user-email").textContent = "Could not sign out. Please try again.";
  }
});

if (!firebaseConfigured) {
  document.querySelectorAll(".auth-provider").forEach((button) => { button.disabled = true; });
  submitButton.disabled = true;
  modeToggle.disabled = true;
  document.querySelector("#auth-reset").disabled = true;
} else {
  void initializeAuth();
}

let firebaseAuth;
let firebaseMethods;
async function getAuthInstance() {
  if (firebaseAuth) return firebaseAuth;
  const [appSdk, authSdk] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"),
  ]);
  const app = appSdk.initializeApp(firebaseConfig);
  firebaseAuth = authSdk.getAuth(app);
  firebaseMethods = authSdk;
  return firebaseAuth;
}

async function initializeAuth() {
  try {
    const auth = await getAuthInstance();
    const { onAuthStateChanged, getRedirectResult } = firebaseMethods;
    onAuthStateChanged(auth, (user) => {
      signedInPanel.hidden = !user;
      signedOutPanel.hidden = Boolean(user);
      openButton.textContent = user ? "My account" : "Sign in";
      if (user) {
        document.querySelector("#auth-user-email").textContent = user.email || user.displayName || "Signed in";
        document.querySelector("#auth-welcome").textContent = user.displayName ? `Welcome, ${user.displayName.split(" ")[0]}.` : "Welcome back.";
      }
    });
    await getRedirectResult(auth);
  } catch (error) {
    showAuthError(error);
    dialog.showModal();
  }
}

function providerFor(name) {
  const { GoogleAuthProvider, OAuthProvider, GithubAuthProvider } = firebaseMethods;
  if (name === "google") return new GoogleAuthProvider();
  if (name === "github") return new GithubAuthProvider();
  if (name === "microsoft") return new OAuthProvider("microsoft.com");
  const apple = new OAuthProvider("apple.com");
  apple.addScope("email");
  apple.addScope("name");
  return apple;
}

async function signInWithEmailAndPassword(auth, email, password) {
  return firebaseMethods.signInWithEmailAndPassword(auth, email, password);
}
async function createUserWithEmailAndPassword(auth, email, password) {
  return firebaseMethods.createUserWithEmailAndPassword(auth, email, password);
}
async function sendEmailVerification(user) {
  return firebaseMethods.sendEmailVerification(user);
}
async function sendPasswordResetEmail(auth, email) {
  return firebaseMethods.sendPasswordResetEmail(auth, email);
}
async function signOut(auth) {
  return firebaseMethods.signOut(auth);
}
async function signInWithRedirect(auth, provider) {
  return firebaseMethods.signInWithRedirect(auth, provider);
}

