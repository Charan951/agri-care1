import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { sendOtpEmail } from '../utils/email';

const JWT_SECRET = process.env.JWT_SECRET || 'agricare_secret_key_123';
const NODE_ENV = process.env.NODE_ENV || 'development';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, mobile, role, workingRegion, landAcres } = req.body;

    // Enforce that only Farmers can register publicly
    if (role && role !== 'FARMER') {
      res.status(400).json({ message: 'Only farmer accounts can self-register. Other roles are created by the admin.' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'Email address already in use.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      mobile,
      role: 'FARMER',
      status: 'ACTIVE',
      workingRegion: workingRegion || '',
      // Store additional details
      landAcres: landAcres || 0
    });

    await newUser.save();

    // Automatically sign in user
    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'Farmer account created successfully.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        role: newUser.role,
        status: newUser.status,
        workingRegion: newUser.workingRegion
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error occurred during registration.' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials.' });
      return;
    }

    if (user.status === 'SUSPENDED') {
      res.status(403).json({ message: 'Your account has been suspended.' });
      return;
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      message: 'Logged in successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        status: user.status,
        workingRegion: user.workingRegion,
        specialization: user.specialization,
        businessName: user.businessName,
        gstin: user.gstin
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error occurred during login.' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated.' });
    return;
  }

  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      mobile: req.user.mobile,
      role: req.user.role,
      status: req.user.status,
      workingRegion: req.user.workingRegion,
      specialization: req.user.specialization,
      businessName: req.user.businessName,
      gstin: req.user.gstin
    }
  });
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Email address is required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(404).json({ message: 'No registered account found with this email address.' });
      return;
    }

    // Generate 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in User document
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
    await user.save();

    // Send the email
    const emailSent = await sendOtpEmail(user.email, user.name, otp);
    if (!emailSent) {
      res.status(500).json({ message: 'Failed to send OTP verification email. Please try again.' });
      return;
    }

    res.json({ message: 'A 6-digit reset OTP has been sent to your email address.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error occurred while requesting password reset.' });
  }
};

export const resetPasswordWithOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      res.status(400).json({ message: 'Email, OTP, and new password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(404).json({ message: 'No registered account found with this email address.' });
      return;
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp) {
      res.status(400).json({ message: 'Invalid OTP verification code.' });
      return;
    }

    if (!user.resetPasswordOtpExpires || user.resetPasswordOtpExpires.getTime() < Date.now()) {
      res.status(400).json({ message: 'OTP verification code has expired.' });
      return;
    }

    // Hash new password and update user record
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    await user.save();

    res.json({ message: 'Your password has been reset successfully. Please log in with your new password.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error occurred while resetting password.' });
  }
};
