import React from 'react';
import QRCode from 'qrcode.react';

const AdminQRGenerator = () => {
  const labNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10,]; 

  return (
    <div className="qr-generator-container">
      <h1>Generate QR Codes for Labs</h1>
      <div className="qr-codes">
        {labNumbers.map((labNumber) => (
          <div key={labNumber} className="qr-code-item">
            <h3>Comlab {labNumber}</h3>
            <QRCode value={`${import.meta.env.VITE_BACKEND_URL}/dashboard?lab=${labNumber}`} size={256} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminQRGenerator;
