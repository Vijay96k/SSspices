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
