const API_KEY = "AIzaSyBe6IGJ65GlpnmCnPTTbA4_uR9XQcuwZpI";
const email = "sudeshkanade2@gmail.com";
const password = "sudeshmpw";

async function login() {
  try {
    const url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + API_KEY;
    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Referer": "https://sudeshkanade.github.io/Asha/"
      },
      body: JSON.stringify({ email: email, password: password, returnSecureToken: true }),
    });
    const data = await response.json();
    console.log("Auth Response:", data.email ? "Success" : data);
    
    if (data.idToken && data.localId) {
      const firestoreUrl = "https://firestore.googleapis.com/v1/projects/asha---rural-health-tracker/databases/(default)/documents/users/" + data.localId;
      const fsResponse = await fetch(firestoreUrl, {
        method: "GET",
        headers: {
          "Authorization": "Bearer " + data.idToken,
          "Referer": "https://sudeshkanade.github.io/Asha/"
        }
      });
      const fsData = await fsResponse.json();
      console.log("Firestore User Doc:", fsData);
    }

  } catch (error) {
    console.error("Fetch error:", error);
  }
}

login();
