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
  storageBucket: "ssspices-b4ea4.firebasestorage.app",
  messagingSenderId: "705922395831",
  appId: "1:705922395831:web:6c1a618729c7ff4df9e732",
  measurementId: "G-HLRTZ7XVQS"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ================== ALLOWED ADMINS ==================
const allowedAdmins = [
  "ssspicesandmore@gmail.com",
  "vjyadav002@gmail.com"
];


// ================== AUTH STATE ==================
onAuthStateChanged(auth, async (user) => {

  const container = document.getElementById("ordersContainer");

  if (!user) {
    container.innerHTML = `
      <h3>Admin Login Required</h3>
      <button id="adminLoginBtn">Login with Google</button>
    `;

    document
      .getElementById("adminLoginBtn")
      .addEventListener("click", adminLogin);

    return;
  }

  // Check verified email
  if (!user.emailVerified || !allowedAdmins.includes(user.email)) {
    alert("Access Denied");
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }

  // If admin verified
  loadOrders();
});


// ================== ADMIN LOGIN ==================
async function adminLogin() {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
}


// ================== LOAD ALL ORDERS ==================
async function loadOrders() {

  const container = document.getElementById("ordersContainer");
  container.innerHTML = "Loading orders...";

  const snapshot = await getDocs(collection(db, "orders"));

  if (snapshot.empty) {
    container.innerHTML = "<p>No orders found</p>";
    return;
  }

  let output = `<h2>All Orders</h2>`;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    output += `
      <div style="border:1px solid #ddd;padding:12px;margin-top:10px;">
        <strong>${data.orderId}</strong><br>
       Email: ${data.userEmail || "Not Available"}<br>
Mobile: ${data.mobile || "Not Available"}<br>
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

  output += `
    <br>
    <button id="logoutBtn"
    style="background:black;color:white;padding:8px 12px;border-radius:6px;">
    Logout</button>
  `;

  container.innerHTML = output;

  document
    .getElementById("logoutBtn")
    .addEventListener("click", adminLogout);
}


// ================== UPDATE STATUS ==================
window.updateStatus = async function (orderDocId, newStatus) {
  await updateDoc(doc(db, "orders", orderDocId), {
    status: newStatus
  });

  alert("Status Updated");
};


// ================== DELETE ORDER ==================
window.deleteOrder = async function (orderDocId) {

  const confirmDelete = confirm("Are you sure you want to delete this order?");
  if (!confirmDelete) return;

  await deleteDoc(doc(db, "orders", orderDocId));

  alert("Order Deleted");
  loadOrders();
};


// ================== LOGOUT ==================
async function adminLogout() {
  await signOut(auth);
  window.location.href = "index.html";
}
