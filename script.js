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
      <button onclick="viewCart()">View Cart</button>
    `;
  }
};

window.closeProfile = function () {
  document.getElementById("profilePanel").style.display = "none";
};

window.viewOrders = async function () {

  const user = auth.currentUser;

  const q = query(
    collection(db, "orders"),
    where("userId", "==", user.uid)
  );

  const snapshot = await getDocs(q);

  let output = "<h3>My Orders</h3>";

  snapshot.forEach(doc => {
    const data = doc.data();
    output += `
  <div onclick="viewOrderDetails('${doc.id}')"
    style="border:1px solid #ddd; padding:10px; margin-top:8px; cursor:pointer;">
    <strong>${data.orderId}</strong><br>
    Status: ${data.status}
  </div>
`;

  });

  let badgeColor = {
  Pending: "orange",
  Confirmed: "blue",
  Shipped: "purple",
  Delivered: "green",
  Cancelled: "red"
}[data.status] || "gray";

output += `
  <div style="border:1px solid #ddd; padding:10px; margin-top:8px;">
    <strong>${data.orderId}</strong><br>
    <span style="color:white;background:${badgeColor};
    padding:4px 8px;border-radius:12px;font-size:12px;">
      ${data.status}
    </span>
  </div>
`;


  document.getElementById("profileContent").innerHTML = output;
};

let cart = [];

window.addToCart = function (name, price) {

  const user = auth.currentUser;

  if (!user) {
    alert("Please login first to add products.");
    return;
  }

  cart.push({ name, price });
  alert(name + " added to cart");
};

import { collection, addDoc, getDocs, query, where } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

window.placeOrder = async function () {

  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  const user = auth.currentUser;
  const orderId = "ORD-" + Date.now();

  await addDoc(collection(db, "orders"), {
    orderId: orderId,
    userId: user.uid,
    items: cart,
    status: "Pending",
    createdAt: new Date()
  });

  cart = [];
  alert("Order placed! ID: " + orderId);
  
  closeProfile();
};
window.viewCart = function () {

  if (cart.length === 0) {
    document.getElementById("profileContent").innerHTML =
      "<h3>Your cart is empty</h3>";
    return;
  }

  let total = cart.reduce((sum, item) => sum + item.price, 0);

output += `<h4 style="margin-top:10px;">Total: ₹${total}</h4>`;


  let output = "<h3>Your Cart</h3>";

  cart.forEach((item, index) => {
    output += `
      <div style="border:1px solid #ddd; padding:8px; margin-top:8px;">
        ${item.name} - ₹${item.price}
        <button onclick="removeFromCart(${index})" 
        style="margin-top:5px;background:red;color:white;border:none;padding:5px;border-radius:5px;">
          Remove
        </button>
      </div>
    `;
  });

  output += `
  <div style="margin-top:15px;">
    <input type="tel" id="mobileNumber" 
      placeholder="Enter mobile number" 
      style="width:100%;padding:8px;border:1px solid #ccc;border-radius:8px;">
  </div>

  <button onclick="placeOrder()" 
    style="margin-top:15px;background:green;color:white;border:none;padding:10px;border-radius:8px;width:100%;">
    Confirm Order
  </button>
`;


  document.getElementById("profileContent").innerHTML = output;
};
window.removeFromCart = function (index) {
  cart.splice(index, 1);
  viewCart();
};
window.placeOrder = async function () {

  const mobile = document.getElementById("mobileNumber")?.value;

  if (!mobile || mobile.length < 10) {
    alert("Please enter valid mobile number");
    return;
  }

  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  const user = auth.currentUser;
  const orderId = "ORD-" + Date.now();

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  await addDoc(collection(db, "orders"), {
    orderId: orderId,
    userId: user.uid,
    userEmail: user.email,
    mobile: mobile,
    items: cart,
    totalAmount: total,
    status: "Pending",
    createdAt: new Date()
  });

  cart = [];
  alert("Order Confirmed! ID: " + orderId);
  closeProfile();
};
window.viewOrderDetails = async function (docId) {

  const docSnap = await getDoc(doc(db, "orders", docId));
  const data = docSnap.data();

  let output = `<h3>${data.orderId}</h3>`;

  data.items.forEach(item => {
    output += `<p>${item.name} - ₹${item.price}</p>`;
  });

  output += `<h4>Total: ₹${data.totalAmount}</h4>`;
  output += `<p>Status: ${data.status}</p>`;
  output += `<button onclick="viewOrders()">Back</button>`;

  document.getElementById("profileContent").innerHTML = output;
};
