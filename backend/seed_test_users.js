const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

dotenv.config();

const createRoles = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Use the email they specified in their screenshot
        const managerEmail = "thaniyaa02@gmail.com"; 
        const seniorManagerEmail = "PUT_SENIOR_TEST_EMAIL_HERE@gmail.com"; 
        const approverEmail = "PUT_APPROVER_TEST_EMAIL_HERE@gmail.com"; 

        const usersToCreate = [
            {
                name: "Thaniya (Manager)",
                email: managerEmail,
                password: "password123",
                role: "manager",
                approvalLevel: 1
            },
            {
                name: "Senior Manager User",
                email: seniorManagerEmail,
                password: "password123",
                role: "senior-manager",
                approvalLevel: 2
            },
            {
                name: "Approver User",
                email: approverEmail,
                password: "password123",
                role: "approver",
                approvalLevel: 3
            }
        ];

        for (const userData of usersToCreate) {
            const existing = await User.findOne({ email: userData.email });
            if (existing) {
                console.log(`User ${userData.email} already exists! Skipping...`);
            } else {
                const user = new User(userData);
                await user.save();
                console.log(`Successfully created ${userData.role}: ${userData.email}`);
            }
        }

        console.log("\nDONE! You can test the system now.");
        process.exit(0);

    } catch (error) {
        console.error("Error creating users:", error);
        process.exit(1);
    }
};

createRoles();
