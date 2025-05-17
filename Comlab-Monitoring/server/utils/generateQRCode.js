import QRCode from 'qrcode';

// Base URL for scanning QR codes
const baseUrl = `${process.env.REACT_APP_BACKEND_URL}/api/qr-code/scan`;

// Generate the QR code
QRCode.toFile('./qrcode.png', baseUrl, (err) => {
    if (err) {
        console.error("Error generating QR code:", err);
    } else {
        console.log("QR code generated and saved as qrcode.png");
    }
});
