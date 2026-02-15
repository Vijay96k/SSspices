// ================== IMPORTS ==================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
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

const adminEmail = "ssspicesandmore@gmail.com";


// ================== ADMIN AUTH CHECK ==================
onAuthStateChanged(auth, (user) => {

  if (!user) {
    alert("Login required");
    window.location.href = "index.html";
    return;
  }

  if (user.email !== adminEmail) {
    alert("Access denied. Admin only.");
    window.location.href = "index.html";
    return;
  }

  loadOrders();
});


// ================== LOAD ALL ORDERS ==================
async function loadOrders() {

  const container = document.getElementById("ordersContainer");
  container.innerHTML = "Loading...";

  const snapshot = await getDocs(collection(db, "orders"));

  if (snapshot.empty) {
    container.innerHTML = "<p>No orders found</p>";
    return;
  }

  let output = "";

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    output += `
      <div style="border:1px solid #ddd;padding:12px;margin-top:10px;">
        <strong>${data.orderId}</strong><br>
        Email: ${data.userEmail}<br>
        Mobile: ${data.mobile}<br>
        Total: ₹${data.totalAmount}<br>
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


// ================== UPDATE STATUS ==================
window.updateStatus = async function (orderDocId, newStatus) {

  await updateDoc(doc(db, "orders", orderDocId), {
    status: newStatus
  });

  alert("Status updated");
};


// ================== DELETE ORDER ==================
window.deleteOrder = async function (orderDocId) {

  const confirmDelete = confirm("Are you sure to delete this order?");
  if (!confirmDelete) return;

  await deleteDoc(doc(db, "orders", orderDocId));

  alert("Order deleted");
  loadOrders();
};


// ================== LOGOUT ==================
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});
