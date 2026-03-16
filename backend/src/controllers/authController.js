const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
   return jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key'
   );
};

exports.register = async (req, res) => {
   try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
         return res.status(400).json({ message: "Name, email, and password are required" });
      }

      if (!email.toLowerCase().endsWith('@jbmgroup.com')) {
         return res.status(400).json({ message: "Only @jbmgroup.com email addresses are authorized to register." });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
         return res.status(400).json({ message: "User already exists" });
      }

      // Force role to 'user' for public registration
      const userRole = 'user';
      const user = new User({
         name,
         email,
         password,
         role: userRole,
         approvalLevel: null
      });

      await user.save();

      const token = generateToken(user);

      res.status(201).json({
         success: true,
         message: "User registered successfully",
         token,
         user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
         }
      });

   } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
   }
};

exports.createPrivilegedUser = async (req, res) => {
   try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password || !role) {
         return res.status(400).json({ message: "Name, email, password, and role are required" });
      }

      if (!email.toLowerCase().endsWith('@jbmgroup.com')) {
         return res.status(400).json({ message: "Only @jbmgroup.com email addresses are authorized." });
      }

      // Ensure valid roles
      const validRoles = ['user', 'manager', 'senior-manager', 'approver', 'admin'];
      if (!validRoles.includes(role)) {
         return res.status(400).json({ message: "Invalid role specified" });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
         return res.status(400).json({ message: "User already exists" });
      }

      let approvalLevel = null;
      if (role === 'manager') approvalLevel = 1;
      else if (role === 'senior-manager') approvalLevel = 2;
      else if (role === 'approver') approvalLevel = 3;

      const user = new User({
         name,
         email,
         password,
         role,
         approvalLevel
      });

      await user.save();

      res.status(201).json({
         success: true,
         message: `${role} registered successfully`,
         user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
         }
      });

   } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
   }
};

exports.login = async (req, res) => {
   try {
      const { email, password } = req.body;

      if (!email || !password) {
         return res.status(400).json({ message: "Email & password required" });
      }

      const user = await User.findOne({ email });
      if (!user) {
         return res.status(401).json({ message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
         return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user);

      res.status(200).json({
         success: true,
         token,
         user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
         }
      });

   } catch (error) {
      res.status(500).json({ message: "Server Error" });
   }
};

exports.logout = async (req, res) => {
   try {
      res.status(200).json({
         success: true,
         message: "User logged out successfully"
      });
   } catch (error) {
      res.status(500).json({ message: "Server Error" });
   }
};

exports.getProfile = async (req, res) => {
   try {
      const user = await User.findById(req.user.id).select('-password');

      if (!user) {
         return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
         success: true,
         user
      });

   } catch (error) {
      res.status(500).json({ message: "Server Error" });
   }
};

exports.updateProfile = async (req, res) => {
   try {
      const { name, email, department, phone } = req.body;

      const user = await User.findById(req.user.id);

      if (!user) {
         return res.status(404).json({ message: "User not found" });
      }

      if (name) user.name = name;
      if (email) user.email = email;
      if (department) user.department = department;
      if (phone) user.phone = phone;

      await user.save();

      res.status(200).json({
         success: true,
         message: "Profile updated successfully",
         user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            phone: user.phone
         }
      });

   } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
   }
};

exports.getAllUsers = async (req, res) => {
   try {
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      res.status(200).json({
         success: true,
         count: users.length,
         users
      });
   } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
   }
};

exports.deleteUser = async (req, res) => {
   try {
      const user = await User.findById(req.params.id);

      if (!user) {
         return res.status(404).json({ message: 'User not found' });
      }

      if (user._id.toString() === req.user.id) {
         return res.status(400).json({ message: 'Administrators cannot delete their own accounts.' });
      }

      await User.findByIdAndDelete(req.params.id);

      res.status(200).json({
         success: true,
         message: 'User deleted successfully'
      });
   } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
   }
};
