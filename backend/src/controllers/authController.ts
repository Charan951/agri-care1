import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
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
        workingRegion: newUser.workingRegion,
        availabilityStatus: newUser.availabilityStatus
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
        gstin: user.gstin,
        availabilityStatus: user.availabilityStatus
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
      gstin: req.user.gstin,
      availabilityStatus: req.user.availabilityStatus
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

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      res.status(400).json({ message: 'Google ID Token is required.' });
      return;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      res.status(500).json({ message: 'GOOGLE_CLIENT_ID environment variable is not defined.' });
      return;
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(400).json({ message: 'Failed to verify Google ID Token.' });
      return;
    }

    const { sub: googleId, email, name, picture: profileImage } = payload;
    if (!email) {
      res.status(400).json({ message: 'Google account does not provide an email address.' });
      return;
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      if (user.status === 'SUSPENDED') {
        res.status(403).json({ message: 'Your account has been suspended.' });
        return;
      }

      // Link Google info to existing user account if not already linked
      let updated = false;
      if (!user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (!user.provider || user.provider === 'local') {
        user.provider = 'google';
        updated = true;
      }
      if (!user.profileImage && profileImage) {
        user.profileImage = profileImage;
        updated = true;
      }
      if (!user.avatarUrl && profileImage) {
        user.avatarUrl = profileImage;
        updated = true;
      }

      if (updated) {
        await user.save();
      }

      // Generate JWT
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

      res.cookie('token', token, {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        success: true,
        isNewUser: false,
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
          gstin: user.gstin,
          availabilityStatus: user.availabilityStatus,
          profileImage: user.profileImage,
          provider: user.provider
        }
      });
    } else {
      // User does not exist, return new user details to trigger frontend registration onboarding
      res.json({
        success: true,
        isNewUser: true,
        googleProfile: {
          email: email.toLowerCase().trim(),
          name: name || '',
          googleId,
          profileImage: profileImage || ''
        }
      });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error occurred during Google authentication.' });
  }
};

export const googleRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken, name, mobile, workingRegion, landAcres } = req.body;
    if (!idToken) {
      res.status(400).json({ message: 'Google ID token is required for registration.' });
      return;
    }

    if (!mobile || !workingRegion) {
      res.status(400).json({ message: 'Mobile and state location are required.' });
      return;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      res.status(500).json({ message: 'GOOGLE_CLIENT_ID environment variable is not defined.' });
      return;
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(400).json({ message: 'Failed to verify Google ID Token.' });
      return;
    }

    const { sub: googleId, email, picture: profileImage } = payload;
    if (!email) {
      res.status(400).json({ message: 'Google account does not provide an email address.' });
      return;
    }

    // Verify user doesn't already exist
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(400).json({ message: 'An account with this email already exists. Please log in.' });
      return;
    }

    // Create the new user
    const newUser = new User({
      name: name || payload.name || 'AgriCare Farmer',
      email: email.toLowerCase().trim(),
      googleId,
      provider: 'google',
      profileImage: profileImage || '',
      avatarUrl: profileImage || '',
      mobile,
      role: 'FARMER',
      status: 'ACTIVE',
      workingRegion: workingRegion || '',
      landAcres: Number(landAcres) || 0
    });

    await newUser.save();

    // Generate JWT
    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        role: newUser.role,
        status: newUser.status,
        workingRegion: newUser.workingRegion,
        availabilityStatus: newUser.availabilityStatus,
        profileImage: newUser.profileImage,
        provider: newUser.provider
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error occurred during Google registration.' });
  }
};
