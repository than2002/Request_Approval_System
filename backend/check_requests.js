const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Request = require('./src/models/Request');
const User = require('./src/models/User');

dotenv.config();

const checkRequests = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const requests = await Request.find({})
            .populate('requestedBy', 'email')
            .populate('approvalWorkflow.level1.manager', 'email')
            .populate('approvalWorkflow.level2.manager', 'email')
            .populate('approvalWorkflow.level3.manager', 'email');

        console.log("Total requests found:", requests.length);
        requests.forEach((req, idx) => {
            console.log(`\nRequest ${idx + 1}:`);
            console.log(`- Title: ${req.title}`);
            console.log(`- Status: ${req.overallStatus}`);
            console.log(`- Requested By: ${req.requestedBy?.email}`);
            console.log(`- L1 Manager: ${req.approvalWorkflow?.level1?.manager?.email} (${req.approvalWorkflow?.level1?.status})`);
            console.log(`- L2 Manager: ${req.approvalWorkflow?.level2?.manager?.email} (${req.approvalWorkflow?.level2?.status})`);
            console.log(`- L3 Manager: ${req.approvalWorkflow?.level3?.manager?.email} (${req.approvalWorkflow?.level3?.status})`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Error checking requests:", error);
        process.exit(1);
    }
};

checkRequests();
