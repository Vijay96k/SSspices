// ================== IMPORTS ==================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ================== FIREBASE CONFIG ==================
const firebaseConfig = {
  apiKey: "AIzaSyDXQB93127WDsAuWaFL8XFRycAXftKED0w",
  authDomain: "ssspices-b4ea4.firebaseapp.com",
  projectId: "ssspices-b4ea4",
  storageBucket: "ssspices-b4ea4.appspot.com",
  messagingSenderId: "705922395831",
  appId: "1:705922395831:web:6c1a618729c7ff4df9e732"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ================== ALLOWED ADMINS ==================
const allowedAdmins = [
  "ssspicesandmore@gmail.com",
  "vjyadav002@gmail.com"
];

let currentAdmin = null;


// ================== DOM READY ==================
document.addEventListener("DOMContentLoaded", () => {

  const container = document.getElementById("adminContent");

  // Hide buttons until verified
  disableDashboardButtons(true);

  onAuthStateChanged(auth, async (user) => {

    if (!container) return;

    if (!user) {
      container.innerHTML = `
        <h3>Admin Login Required</h3>
        <button id="adminLoginBtn" class="btn location">
          Login with Google
        </button>
      `;

      document
        .getElementById("adminLoginBtn")
        ?.addEventListener("click", adminLogin);

      disableDashboardButtons(true);
      return;
    }

    if (!allowedAdmins.includes(user.email)) {
      alert("Access Denied");
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }

    currentAdmin = user;

    container.innerHTML = `
      <h3>Welcome ${user.email}</h3>
      <p>Select an option above</p>
    `;

    disableDashboardButtons(false);
  });


  // Button Events
  document.getElementById("usersBtn")
    ?.addEventListener("click", loadUsers);

  document.getElementById("ordersBtn")
    ?.addEventListener("click", loadOrders);

  document.getElementById("salesBtn")
    ?.addEventListener("click", loadSales);

  document.getElementById("logoutBtn")
    ?.addEventListener("click", logoutAdmin);
});


// ================== ENABLE / DISABLE BUTTONS ==================
function disableDashboardButtons(disabled) {
  document.getElementById("usersBtn")?.toggleAttribute("disabled", disabled);
  document.getElementById("ordersBtn")?.toggleAttribute("disabled", disabled);
  document.getElementById("salesBtn")?.toggleAttribute("disabled", disabled);
}


// ================== ADMIN LOGIN ==================
async function adminLogin() {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}


// ================== LOAD USERS ==================
async function loadUsers() {

  if (!currentAdmin) return;

  const container = document.getElementById("adminContent");
  container.innerHTML = "Loading users...";

  const snapshot = await getDocs(collection(db, "users"));

  if (snapshot.empty) {
    container.innerHTML = "<p>No users found</p>";
    return;
  }

  let output = "<h3>All Users</h3>";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    output += `
      <div class="product-card">
        <strong>${data.email}</strong><br>
        Role: ${data.role || "customer"}
      </div>
    `;
  });

  container.innerHTML = output;
}


// ================== LOAD ORDERS ==================
async function loadOrders() {

  if (!currentAdmin) return;

  const container = document.getElementById("adminContent");
  container.innerHTML = "Loading orders...";

  const snapshot = await getDocs(collection(db, "orders"));

  if (snapshot.empty) {
    container.innerHTML = "<p>No orders found</p>";
    return;
  }

  let output = "<h3>All Orders</h3>";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    output += `
      <div class="product-card">
        <strong>${data.orderId}</strong><br>
        Email: ${data.userEmail || "N/A"}<br>
        Mobile: ${data.mobile || "N/A"}<br>
        Total: ₹${data.totalAmount || 0}<br>
        Status:
        <select onchange="updateStatus('${docSnap.id}', this.value)">
          <option ${data.status === "Pending" ? "selected" : ""}>Pending</option>
          <option ${data.status === "Confirmed" ? "selected" : ""}>Confirmed</option>
          <option ${data.status === "Shipped" ? "selected" : ""}>Shipped</option>
          <option ${data.status === "Delivered" ? "selected" : ""}>Delivered</option>
          <option ${data.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
        </select>
        <br><br>
        <button onclick="deleteOrder('${docSnap.id}')"
        style="background:red;color:white;border:none;padding:6px 10px;border-radius:6px;">
        Delete Order</button>
      </div>
    `;
  });

  container.innerHTML = output;
}


// ================== LOAD SALES ==================
async function loadSales() {

  if (!currentAdmin) return;

  const container = document.getElementById("adminContent");
  container.innerHTML = "Calculating sales...";

  const snapshot = await getDocs(collection(db, "orders"));

  if (snapshot.empty) {
    container.innerHTML = "<p>No sales data</p>";
    return;
  }

  let totalRevenue = 0;
  let productMap = {};

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    if (data.status === "Cancelled") return;

    totalRevenue += data.totalAmount || 0;

    data.items?.forEach(item => {
      productMap[item.name] = (productMap[item.name] || 0) + item.price;
    });
  });

  let output = `
    <h3>Total Revenue: ₹${totalRevenue}</h3>
    <h4>Product Wise Sales</h4>
  `;

  for (let product in productMap) {
    output += `
      <div class="product-card">
        ${product} → ₹${productMap[product]}
      </div>
    `;
  }

  container.innerHTML = output;
}


// ================== UPDATE STATUS ==================
window.updateStatus = async function (orderId, newStatus) {
  await updateDoc(doc(db, "orders", orderId), {
    status: newStatus
  });
  alert("Status Updated");
};


// ================== DELETE ORDER ==================
window.deleteOrder = async function (orderId) {

  if (!confirm("Delete this order?")) return;

  await deleteDoc(doc(db, "orders", orderId));
  alert("Order Deleted");
  loadOrders();
};


// ================== LOGOUT ==================
async function logoutAdmin() {
  await signOut(auth);
  window.location.href = "index.html";
}
