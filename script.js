// ================== IMPORTS ==================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
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
let authReady = false;


// ================== AUTH STATE LISTENER ==================
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  authReady = true;

  const container = document.getElementById("profileContent");

  if (!container) return;

  if (user) {
    container.innerHTML = `
      <h3>${user.displayName}</h3>
      <p>${user.email}</p>
      <button onclick="viewCart()">View Cart</button>
      <button onclick="viewOrders()">My Orders</button>
      <button onclick="logout()">Logout</button>
    `;
  } else {
    container.innerHTML = `
      <h3>Please Login</h3>
      <button onclick="login()">Login with Google</button>
    `;
  }
});



// ================== LOGIN ==================
window.login = async function () {
  const provider = new GoogleAuthProvider();
  await signInWithRedirect(auth, provider);
};


// Handle redirect result (only once)
getRedirectResult(auth)
  .then(async (result) => {
    if (!result) return;

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
  })
  .catch((error) => {
    console.error("Login error:", error);
  });


// ================== LOGOUT ==================
window.logout = async function () {
  await signOut(auth);
  alert("Logged out");
  location.reload();
};


// ================== PROFILE PANEL ==================
window.viewOrders = async function () {

  if (!currentUser) return;

  const container = document.getElementById("profileContent");

  const q = query(
    collection(db, "orders"),
    where("userId", "==", currentUser.uid)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    container.innerHTML = `
      <h3>No Orders Found</h3>
      <p>Please order something first.</p>
      <button onclick="openProfile()">Back</button>
    `;
    return;
  }

  let output = "<h3>My Orders</h3>";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    output += `
      <div onclick="viewOrderDetails('${docSnap.id}')"
      style="border:1px solid #ddd;padding:10px;margin-top:8px;cursor:pointer;">
        <strong>${data.orderId}</strong><br>
        Status: ${data.status}
      </div>
    `;
  });

  output += `<button onclick="openProfile()">Back</button>`;

  container.innerHTML = output;
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
window.viewCart = async function () {

  if (!currentUser) return;

  const container = document.getElementById("profileContent");

  const snapshot = await getDocs(
    collection(db, "users", currentUser.uid, "cart")
  );

  if (snapshot.empty) {
    container.innerHTML = `
      <h3>Your cart is empty</h3>
      <p>Add items first.</p>
      <button onclick="openProfile()">Back</button>
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
        <button onclick="removeFromCart('${docSnap.id}')"
        style="margin-top:5px;background:red;color:white;border:none;padding:5px;border-radius:5px;">
        Remove</button>
      </div>
    `;
  });

  output += `<h4>Total: ₹${total}</h4>`;

  output += `
    <input type="tel" id="mobileNumber"
    placeholder="Enter mobile number"
    style="width:100%;padding:8px;margin-top:10px;border:1px solid #ccc;border-radius:8px;">

    <button onclick="placeOrder()"
    style="margin-top:15px;background:green;color:white;border:none;padding:10px;border-radius:8px;width:100%;">
    Confirm Order</button>

    <button onclick="openProfile()"
    style="margin-top:10px;background:gray;color:white;border:none;padding:8px;border-radius:8px;width:100%;">
    Back</button>
  `;

  container.innerHTML = output;
};



// ================== REMOVE FROM CART ==================
window.removeFromCart = async function (docId) {
  if (!currentUser) return;

  await deleteDoc(doc(db, "users", currentUser.uid, "cart", docId));
  viewCart();
};


// ================== PLACE ORDER ==================
window.placeOrder = async function () {

  if (!currentUser) return;

  const mobile = document.getElementById("mobileNumber")?.value;

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

  for (const docSnap of cartSnapshot.docs) {
    await deleteDoc(doc(db, "users", currentUser.uid, "cart", docSnap.id));
  }

  alert("Order Confirmed! ID: " + orderId);
  closeProfile();
};


// ================== VIEW ORDERS ==================
window.viewOrders = async function () {

  if (!currentUser) return;

  const container = document.getElementById("profileContent");

  const q = query(
    collection(db, "orders"),
    where("userId", "==", currentUser.uid)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    container.innerHTML = "<h3>No orders found</h3>";
    return;
  }

  let output = "<h3>My Orders</h3>";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    output += `
      <div onclick="viewOrderDetails('${docSnap.id}')"
      style="border:1px solid #ddd;padding:10px;margin-top:8px;cursor:pointer;">
        <strong>${data.orderId}</strong><br>
        ${data.status}
      </div>
    `;
  });

  container.innerHTML = output;
};


// ================== ORDER DETAILS ==================
window.openProfile = function () {
  document.getElementById("profilePanel").style.display = "flex";

  if (!currentUser) {
    document.getElementById("profileContent").innerHTML = `
      <h3>Please Login</h3>
      <button onclick="login()">Login with Google</button>
    `;
    return;
  }

  document.getElementById("profileContent").innerHTML = `
    <h3>${currentUser.displayName}</h3>
    <p>${currentUser.email}</p>
    <button onclick="viewCart()">View Cart</button>
    <button onclick="viewOrders()">My Orders</button>
    <button onclick="logout()">Logout</button>
  `;
};

