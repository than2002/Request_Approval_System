const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Request = require('./src/models/Request');
const User = require('./src/models/User');

dotenv.config();

const roleLevelMap = {
    manager: 1,
    'senior-manager': 2,
    approver: 3,
    admin: 'all'
};

const verifyAllManagers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB\n");

        const managers = await User.find({ role: { $in: ['manager', 'senior-manager', 'approver', 'admin'] } });
        
        for (const m of managers) {
            console.log(`--- Checking for ${m.name} (${m.email}) [Role: ${m.role}] ---`);
            const userLevel = roleLevelMap[m.role];
            
            if (userLevel) {
                const query = m.role === 'admin' 
                    ? { overallStatus: { $in: ['level1_pending', 'level2_pending', 'level3_pending'] } }
                    : { overallStatus: `level${userLevel}_pending` };
                
                const requests = await Request.find(query).populate("requestedBy", "name email");
                console.log(`User Level: ${userLevel} | Query: ${JSON.stringify(query)}`);
                console.log(`Results Found: ${requests.length}`);
                requests.forEach(r => console.log(`  - ${r.title} (Status: ${r.overallStatus})`));
            } else {
                console.log("No level mapped for this role.");
            }
            console.log("\n");
        }

        process.exit(0);
    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
};

verifyAllManagers();
