const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

dotenv.config();

const createAdmin = async () => {
    // Check for arguments
    const args = process.argv.slice(2);
    if (args.length < 3) {
        console.log("Usage: node create_admin.js <name> <email> <password>");
        console.log("Example: node create_admin.js \"Admin User\" admin@jbmgroup.com password123");
        process.exit(1);
    }

    const [name, email, password] = args;

    if (!email.toLowerCase().endsWith('@jbmgroup.com')) {
        console.error("Error: Admin email must end with @jbmgroup.com");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.error(`Error: User with email ${email} already exists!`);
            process.exit(1);
        }

        const adminUser = new User({
            name,
            email: email.toLowerCase(),
            password,
            role: 'admin',
            isActive: true
        });

        await adminUser.save();
        console.log("");
        console.log(" Admin account created successfully!");
        console.log(`Name:  ${name}`);
        console.log(`Email: ${email}`);
        console.log("-");
        console.log("You can now log in to the system as an Administrator.");

        process.exit(0);
    } catch (error) {
        console.error("Error creating admin account:", error);
        process.exit(1);
    }
};

createAdmin();
