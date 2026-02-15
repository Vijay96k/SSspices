// ================== IMPORTS ==================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ================== FIREBASE INIT ==================
const firebaseConfig = {
  apiKey: "AIzaSyDXQB93127WDsAuWaFL8XFRycAXftKED0w",
  authDomain: "ssspices-b4ea4.firebaseapp.com",
  projectId: "ssspices-b4ea4",
  storageBucket: "ssspices-b4ea4.firebasestorage.app",
  messagingSenderId: "705922395831",
  appId: "1:705922395831:web:6c1a618729c7ff4df9e732",
  measurementId: "G-HLRTZ7XVQS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const adminEmail = "ssspicesandmore@gmail.com";

let currentUser = null;


// ================== AUTH STATE ==================
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});


// ================== LOGIN ==================
window.login = async function () {
  try {
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
    openProfile();

  } catch (error) {
    console.error(error);
    alert("Login failed");
  }
};


// ================== LOGOUT ==================
window.logout = async function () {
  await signOut(auth);
  alert("Logged out");
  closeProfile();
};


// ================== PROFILE PANEL ==================
window.openProfile = function () {
  document.getElementById("profilePanel").style.display = "flex";
  renderProfile();
};

function renderProfile() {
  const container = document.getElementById("profileContent");

  if (!currentUser) {
    container.innerHTML = `
      <h3>Please Login</h3>
      <button id="loginBtn">Login with Google</button>
    `;
    document.getElementById("loginBtn").addEventListener("click", login);
    return;
  }

  container.innerHTML = `
    <h3>${currentUser.displayName}</h3>
    <p>${currentUser.email}</p>
    <button id="cartBtn">View Cart</button>
    <button id="ordersBtn">My Orders</button>
    <button id="logoutBtn">Logout</button>
  `;

  document.getElementById("cartBtn").addEventListener("click", viewCart);
  document.getElementById("ordersBtn").addEventListener("click", viewOrders);
  document.getElementById("logoutBtn").addEventListener("click", logout);
}

window.closeProfile = function () {
  document.getElementById("profilePanel").style.display = "none";
};


// ================== ADD TO CART ==================
window.addToCart = async function (name, price) {
  if (!currentUser) {
    alert("Please login first.");
    return;
  }

  await addDoc(collection(db, "users", currentUser.uid, "cart"), {
    name,
    price,
    createdAt: new Date()
  });

  alert("Added to cart");
};


// ================== VIEW CART ==================
async function viewCart() {

  const container = document.getElementById("profileContent");

  const snapshot = await getDocs(
    collection(db, "users", currentUser.uid, "cart")
  );

  if (snapshot.empty) {
    container.innerHTML = `
      <h3>Your cart is empty</h3>
      <button onclick="renderProfile()">Back</button>
    `;
    return;
  }

  let output = "<h3>Your Cart</h3>";
  let total = 0;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    total += data.price;

    output += `
      <div style="border:1px solid #ddd;padding:8px;margin-top:8px;">
        ${data.name} - ₹${data.price}
        <button onclick="removeFromCart('${docSnap.id}')">Remove</button>
      </div>
    `;
  });

  output += `<h4>Total: ₹${total}</h4>`;
  output += `
    <input type="tel" id="mobileNumber" placeholder="Enter mobile number">
    <button onclick="placeOrder()">Confirm Order</button>
    <button onclick="renderProfile()">Back</button>
  `;

  container.innerHTML = output;
}


// ================== REMOVE CART ITEM ==================
window.removeFromCart = async function (docId) {
  await deleteDoc(doc(db, "users", currentUser.uid, "cart", docId));
  viewCart();
};


// ================== PLACE ORDER ==================
window.placeOrder = async function () {

  const mobile = document.getElementById("mobileNumber").value;

  if (!mobile || mobile.length < 10) {
    alert("Enter valid mobile number");
    return;
  }

  const cartSnapshot = await getDocs(
    collection(db, "users", currentUser.uid, "cart")
  );

  if (cartSnapshot.empty) {
    alert("Cart empty");
    return;
  }

  let items = [];
  let total = 0;

  cartSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    items.push(data);
    total += data.price;
  });

  const orderId = "ORD-" + Date.now();

  // 🔹 Save to Firestore
  await addDoc(collection(db, "orders"), {
    orderId,
    userId: currentUser.uid,
    userEmail: currentUser.email,
    mobile,
    items,
    totalAmount: total,
    status: "Pending",
    createdAt: new Date()
  });

  // 🔹 SEND TO GOOGLE SHEET
  try {
    await fetch("https://script.google.com/macros/s/AKfycbz1E75XwMnd_8w0HI6W3dlIGhRAarK6duY_J51qrdtkgYNgdI39waOlOzv6IrWYvsIZ6w/exec", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        orderId: orderId,
        customerName: currentUser.displayName,
        email: currentUser.email,
        mobile: mobile,
        products: items.map(i => i.name).join(", "),
        prices: items.map(i => i.price).join(", "),
        total: total,
        status: "Pending"
      })
    });

    console.log("Sheet updated successfully");

  } catch (error) {
    console.error("Sheet error:", error);
  }

  // 🔹 Clear cart
  for (const docSnap of cartSnapshot.docs) {
    await deleteDoc(doc(db, "users", currentUser.uid, "cart", docSnap.id));
  }

  alert("Order Confirmed! ID: " + orderId);
  renderProfile();
};


// ================== VIEW ORDERS ==================
async function viewOrders() {

  const container = document.getElementById("profileContent");

  const q = query(
    collection(db, "orders"),
    where("userId", "==", currentUser.uid)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    container.innerHTML = `
      <h3>No Orders Found</h3>
      <button onclick="renderProfile()">Back</button>
    `;
    return;
  }

  let output = "<h3>My Orders</h3>";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    output += `
      <div>
        <strong>${data.orderId}</strong><br>
        Status: ${data.status}
      </div>
    `;
  });

  output += `<button onclick="renderProfile()">Back</button>`;

  container.innerHTML = output;
}


// ================== PROFILE BUTTON LISTENER ==================
document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.getElementById("profileBtn");
  if (profileBtn) {
    profileBtn.addEventListener("click", openProfile);
  }
});

document.addEventListener("DOMContentLoaded", () => {

  const helpBubble = document.getElementById("helpBubble");
  const helpModal = document.getElementById("helpModal");
  const closeHelp = document.getElementById("closeHelp");

  if (helpBubble) {
    helpBubble.addEventListener("click", () => {
      helpModal.style.display = "flex";
    });
  }

  if (closeHelp) {
    closeHelp.addEventListener("click", () => {
      helpModal.style.display = "none";
    });
  }

});
