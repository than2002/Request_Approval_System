const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

dotenv.config();

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const users = await User.find({}, 'name email role approvalLevel');
        console.log("Total users found:", users.length);
        console.table(users.map(u => u.toObject()));

        const l1 = await User.findOne({ role: 'manager' });
        const l2 = await User.findOne({ role: 'senior-manager' });
        const l3 = await User.findOne({ role: 'approver' });

        console.log("Manager (L1) found:", l1 ? l1.email : "NOT FOUND");
        console.log("Senior Manager (L2) found:", l2 ? l2.email : "NOT FOUND");
        console.log("Approver (L3) found:", l3 ? l3.email : "NOT FOUND");

        process.exit(0);
    } catch (error) {
        console.error("Error checking users:", error);
        process.exit(1);
    }
};

checkUsers();
