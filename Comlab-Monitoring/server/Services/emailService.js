import createTransporter from './createTransporter.js';

async function sendVerificationEmail(to, verificationLink) {
  try {
    // Create the transporter using OAuth2 credentials
    const transporter = await createTransporter();

    // Define email options
    const mailOptions = {
      from: process.env.GOOGLE_EMAIL, // Sender's email
      to: to,
      subject: 'Please verify your email', // Subject line
      html: `<p>Click on the following link to verify your email: <a href="${verificationLink}">Verify Email</a></p>`,
    };

    // Log the email being sent (for debugging)
    console.log(`Sending verification email to ${to}...`);

    // Send the email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending verification email', error);
    throw error;  // Throw error to be handled in routes
  }
}

export { sendVerificationEmail };
