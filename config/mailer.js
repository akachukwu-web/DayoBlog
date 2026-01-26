import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// The connection timeout error you're seeing is because the application cannot reach the email server specified in your .env file.
// The configuration below is updated to use Gmail, which is a reliable service for development.
// Please ensure your .env file has the correct EMAIL_USER and EMAIL_PASS. For Gmail, you must generate an "App Password".
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // Your Gmail "App Password"
    },
});

transporter.verify(function (error, success) {
    if (error) {
        console.error("Mailer Configuration Error:", error);
        console.log("-----------------------------------------------------------------");
        console.log("HINT: Failed to connect to the email server. Please check that:");
        console.log("1. Your .env file has the correct EMAIL_USER and EMAIL_PASS.");
        console.log("2. If using Gmail, you have generated and are using an 'App Password', not your regular password.");
        console.log("3. Your internet connection is active and any firewalls are not blocking port 465.");
        console.log("-----------------------------------------------------------------");
    } else {
        console.log("Mail server is ready to take our messages");
    }
});

export default transporter;