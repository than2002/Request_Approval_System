const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const { sendNewRequestEmail } = require('./src/utils/emailService');
const User = require('./src/models/User');
const Request = require('./src/models/Request');

const testEmailLog = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for email test");

        const manager = await User.findOne();
        const request = await Request.findOne();

        if (!manager || !request) {
            console.log("Could not find any user or request to test with.");
            process.exit(0);
        }

        console.log(`Testing email trigger for: ${manager.email}`);
        console.log(`Using EMAIL_USER: ${process.env.EMAIL_USER}`);
        
        await sendNewRequestEmail(manager, request);

        console.log("\n--- TEST COMPLETE ---");
        process.exit(0);
    } catch (error) {
        console.error("Test failed with error:", error);
        process.exit(1);
    }
};

testEmailLog();
