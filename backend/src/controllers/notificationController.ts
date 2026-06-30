import { Response } from 'express';
import { SystemNotification } from '../models/SystemNotification';
import { MerchantNotification } from '../models/MerchantNotification';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// ==========================================
// 1. ADMIN SYSTEM NOTIFICATION CRUD
// ==========================================
export const getNotificationsList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const notifications = await SystemNotification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createNotificationRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, message, type, link, recipientRole } = req.body;

    const newNotification = new SystemNotification({
      title,
      message,
      type: type || 'SYSTEM',
      link,
      recipientRole: recipientRole || 'ALL',
      readBy: []
    });

    await newNotification.save();
    res.status(201).json({ message: 'Notification created successfully.', notification: newNotification });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateNotificationRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, message, type, link, recipientRole } = req.body;

    const notification = await SystemNotification.findById(id);
    if (!notification) {
      res.status(404).json({ message: 'Notification not found.' });
      return;
    }

    if (title) notification.title = title;
    if (message) notification.message = message;
    if (type) notification.type = type;
    if (link) notification.link = link;
    if (recipientRole) notification.recipientRole = recipientRole;

    await notification.save();
    res.json({ message: 'Notification updated successfully.', notification });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteNotificationRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await SystemNotification.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: 'Notification not found.' });
      return;
    }
    res.json({ message: 'Notification deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 2. FARMER SYSTEM NOTIFICATIONS
// ==========================================
export const getFarmerNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const notifications = await SystemNotification.find({
      $or: [
        { readBy: { $ne: req.user?._id } },
        { readBy: req.user?._id }
      ]
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    const total = await SystemNotification.countDocuments({
      $or: [
        { readBy: { $ne: req.user?._id } },
        { readBy: req.user?._id }
      ]
    });

    res.json({
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching notifications' });
  }
};

export const markNotificationsAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    await SystemNotification.updateMany(
      { readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error marking notifications read' });
  }
};

// ==========================================
// 3. MERCHANT SYSTEM NOTIFICATIONS
// ==========================================
export const getMerchantNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id || req.user?._id;
    const notifications = await MerchantNotification.find({ merchantId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: err.message });
  }
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const merchantId = req.user?.id || req.user?._id;

    await MerchantNotification.findOneAndUpdate({ _id: id, merchantId }, { isRead: true });
    res.json({ message: 'Notification marked as read' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to mark read', error: err.message });
  }
};
