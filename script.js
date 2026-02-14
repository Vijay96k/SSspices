function callNow() {
    window.location.href = "tel:9876543210";
}

function whatsappNow() {
    window.open("https://wa.me/919876543210", "_blank");
}

function shareProfile() {
    if (navigator.share) {
        navigator.share({
            title: 'Business Profile',
            text: 'Check out this business!',
            url: window.location.href
        });
    } else {
        alert("Sharing not supported on this browser.");
    }
}
function buyProduct(productName) {
    const phoneNumber = "917507445421"; // change to your number

    const message = "Hello, I am interested in " + productName;

    const url = "https://wa.me/" + phoneNumber + "?text=" + encodeURIComponent(message);

    window.open(url, "_blank");
}
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDXQB93127WDsAuWaFL8XFRycAXftKED0w",
  authDomain: "ssspices-b4ea4.firebaseapp.com",
  projectId: "ssspices-b4ea4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const adminEmail = "ssspicesandmore@gmail.com"; // ← YOUR EMAIL

window.login = async function () {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      name: user.displayName,
      email: user.email,
      role: user.email === adminEmail ? "admin" : "customer",
      createdAt: new Date()
    });
  }

  alert("Login successful");
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Logged in:", user.email);
  }
});
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

window.logout = async function () {
  await signOut(auth);
  alert("Logged out successfully");
  location.reload();
};
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Logged in:", user.email);
    document.querySelector("button[onclick='login()']").style.display = "none";
  }
});
window.openProfile = function () {
  document.getElementById("profilePanel").style.display = "flex";

  const user = auth.currentUser;
  const container = document.getElementById("profileContent");

  if (!user) {
    container.innerHTML = `
      <h3>Please Login</h3>
      <button onclick="login()">Login with Google</button>
    `;
  } else {
    container.innerHTML = `
      <h3>${user.displayName}</h3>
      <p>${user.email}</p>
      <button onclick="viewOrders()">My Orders</button>
      <button onclick="logout()">Logout</button>
    `;
  }
};

window.closeProfile = function () {
  document.getElementById("profilePanel").style.display = "none";
};

window.viewOrders = function () {
  alert("Orders page coming next step 😉");
};



