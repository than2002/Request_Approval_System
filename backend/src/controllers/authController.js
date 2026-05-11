const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendForgotPasswordEmail, sendAdminNewUserEmail, sendAccountApprovedEmail } = require('../utils/emailService');

const generateToken = (user) => {
   if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured in environment variables');
   }
   return jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
   );
};

exports.register = async (req, res) => {
   try {
      const { name, email, password, employeeCode, plant } = req.body;
      
      const registrationRole = 'user';

      if (!name || !email || !password || !employeeCode || !plant) {
         return res.status(400).json({ message: "Name, email, password, employee code, and plant are required" });
      }

      if (registrationRole === 'admin') {
         return res.status(400).json({ message: "Cannot register as administrator. Please contact system owner." });
      }

      if (!email.toLowerCase().endsWith('@jbmgroup.com')) {
         return res.status(400).json({ message: "Only @jbmgroup.com email addresses are authorized to register." });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
         return res.status(400).json({ message: "User already exists" });
      }

      // Check if employee code is already taken
      const existingEmployee = await User.findOne({ employeeCode });
      if (existingEmployee) {
         return res.status(400).json({ message: "Employee code already registered" });
      }

      let approvalLevel = null;
      if (registrationRole === 'manager') approvalLevel = 1;
      else if (registrationRole === 'senior-manager') approvalLevel = 2;
      else if (registrationRole === 'approver') approvalLevel = 3;

      const user = new User({
         name,
         email,
         password,
         employeeCode,
         plant,
         role: registrationRole,
         approvalLevel,
         isApproved: false
      });

      await user.save();

      // Notify Admin
      const admin = await User.findOne({ role: 'admin' });
      if (admin && admin.email) {
         await sendAdminNewUserEmail(admin.email, user);
      }

      res.status(201).json({
         success: true,
         message: "Registration successful. Please wait for admin approval before logging in.",
         user: {
            id: user._id,
            name: user.name,
            email: user.email,
            employeeCode: user.employeeCode,
            plant: user.plant,
            role: user.role,
            isApproved: user.isApproved
         }
      });

   } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
   }
};

exports.createPrivilegedUser = async (req, res) => {
   try {
      const { name, email, password, role, employeeCode, plant } = req.body;

      if (!name || !email || !password || !role || !plant) {
         return res.status(400).json({ message: "Name, email, password, role, and plant are required" });
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
         return res.status(400).json({ message: "User with this email already exists" });
      }

      // Check if employee code is already taken
      if (employeeCode) {
         const existingEmployee = await User.findOne({ employeeCode });
         if (existingEmployee) {
            return res.status(400).json({ message: "Employee code already registered to another user" });
         }
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
         employeeCode,
         plant,
         approvalLevel,
         isApproved: true 
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

      // Notify User (Welcome Email)
      try {
         await sendAccountApprovedEmail(user);
      } catch (err) {
         console.error("Welcome email failed during manual creation:", err.message);
      }

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

      if (!user.isApproved) {
         return res.status(403).json({ 
            message: "Your account is pending admin approval. Please contact the administrator.",
            isPending: true
         });
      }

      if (!user.isActive) {
         return res.status(403).json({ 
            message: "Your account has been deactivated. Please contact the administrator.",
            isActive: false
         });
      }

      const token = generateToken(user);

      res.status(200).json({
         success: true,
         token,
         user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            employeeCode: user.employeeCode,
            plant: user.plant,
            department: user.department,
            isApproved: user.isApproved,
            isActive: user.isActive
         }
      });

   } catch (error) {
      res.status(500).json({ message: "Server Error" });
   }
};

exports.forgotPassword = async (req, res) => {
   try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
         return res.status(404).json({ message: "User not found with that email" });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(20).toString('hex');

      // Hash token and set to resetPasswordToken field
      user.resetPasswordToken = crypto
         .createHash('sha256')
         .update(resetToken)
         .digest('hex');

      // Set expire
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

      await user.save();

      try {
         await sendForgotPasswordEmail(user, resetToken);
         res.status(200).json({ success: true, message: "Email sent" });
      } catch (err) {
         user.resetPasswordToken = undefined;
         user.resetPasswordExpires = undefined;
         await user.save();
         return res.status(500).json({ message: "Email could not be sent" });
      }

   } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
   }
};

exports.resetPassword = async (req, res) => {
   try {
      const resetPasswordToken = crypto
         .createHash('sha256')
         .update(req.params.token)
         .digest('hex');

      const user = await User.findOne({
         resetPasswordToken,
         resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
         return res.status(400).json({ message: "Invalid or expired token" });
      }

      // Set new password
      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      res.status(200).json({
         success: true,
         message: "Password reset successful"
      });

   } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
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

exports.approveUser = async (req, res) => {
   try {
      const { role } = req.body;
      const user = await User.findById(req.params.id);

      if (!user) {
         return res.status(404).json({ message: 'User not found' });
      }

      if (role) {
         user.role = role;
         // Set approval level based on assigned role
         if (role === 'manager') user.approvalLevel = 1;
         else if (role === 'senior-manager') user.approvalLevel = 2;
         else if (role === 'approver') user.approvalLevel = 3;
         else user.approvalLevel = null;
      }

      user.isApproved = true;
      await user.save();

      // Notify User (non-blocking — approval succeeds even if email fails)
      try {
         if (user.email) {
            await sendAccountApprovedEmail(user);
         }
      } catch (emailErr) {
         console.error("Approval notification email failed:", emailErr.message);
      }

      res.status(200).json({
         success: true,
         message: 'User approved successfully'
      });
   } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
   }
};

exports.toggleUserStatus = async (req, res) => {
   try {
      const user = await User.findById(req.params.id);

      if (!user) {
         return res.status(404).json({ message: 'User not found' });
      }

      if (user._id.toString() === req.user.id) {
         return res.status(400).json({ message: 'Administrators cannot deactivate their own accounts.' });
      }

      user.isActive = !user.isActive;
      await user.save();

      res.status(200).json({
         success: true,
         message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
         isActive: user.isActive
      });
   } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
   }
};
