const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Request = require('./src/models/Request');
const User = require('./src/models/User');

dotenv.config();

const simulateGetPending = async (role) => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Simulating query for role: ${role}`);

        const roleLevelMap = {
            manager: 1,
            'senior-manager': 2,
            approver: 3
        };

        const userLevel = roleLevelMap[role];
        console.log(`Computed userLevel: ${userLevel}`);

        const requests = await Request.find({
            overallStatus: `level${userLevel}_pending`
        }).populate("requestedBy", "name email");

        console.log(`Requests found: ${requests.length}`);
        requests.forEach(req => {
            console.log(`- Title: ${req.title}, ID: ${req._id}, Status: ${req.overallStatus}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Simulation failed:", error);
        process.exit(1);
    }
};

simulateGetPending('manager');
