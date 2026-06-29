import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Product } from '../models/Product';
import { InventoryLog } from '../models/InventoryLog';
import { CouponOffer } from '../models/CouponOffer';
import { User } from '../models/User';
import { MerchantNotification } from '../models/MerchantNotification';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

// Helper to push merchant notification
const createMerchantNotification = async (merchantId: string, title: string, message: string, type: string, link: string = '') => {
  try {
    await MerchantNotification.create({
      merchantId,
      title,
      message,
      type,
      link,
    });
  } catch (err) {
    console.error('Failed to create notification', err);
  }
};

// ==========================================
// 1. PUBLIC MARKETPLACE
// ==========================================
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    const query: any = {};

    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const products = await Product.find(query).populate('merchantId', 'businessName rating');
    res.json({ products });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching products' });
  }
};

export const getProductDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate('merchantId', 'businessName rating');
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json({ product });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching product details' });
  }
};

export const submitProductReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    product.reviews.push({
      name: req.user?.name || 'Farmer',
      rating,
      comment,
      date: new Date()
    });

    const totalRatingSum = product.reviews.reduce((acc, curr) => acc + curr.rating, 0);
    product.rating = parseFloat((totalRatingSum / product.reviews.length).toFixed(1));

    await product.save();
    res.json({ message: 'Review submitted successfully', product });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error submitting review' });
  }
};

// ==========================================
// 2. MERCHANT PRODUCT CRUD
// ==========================================
export const getMerchantProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id || req.user?._id;
    const products = await Product.find({ merchantId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to retrieve products', error: err.message });
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id || req.user?._id;
    const productData = {
      ...req.body,
      merchantId,
      status: 'APPROVED'
    };

    const newProduct = await Product.create(productData);

    if (newProduct.stock > 0) {
      await InventoryLog.create({
        productId: newProduct._id,
        merchantId,
        type: 'IN',
        quantity: newProduct.stock,
        reason: 'Initial Product Stock In',
        batchNumber: newProduct.batchNumber || 'INIT-BATCH',
      });
    }

    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to create product', error: err.message });
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const merchantId = req.user?.id || req.user?._id;

    const existingProduct = await Product.findOne({ _id: id, merchantId });
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    const previousStock = existingProduct.stock;
    const updatedData = { ...req.body };
    delete updatedData.merchantId;

    const updatedProduct = await Product.findByIdAndUpdate(id, updatedData, { new: true });
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product failed to update' });
    }

    if (updatedProduct.stock !== previousStock) {
      const difference = updatedProduct.stock - previousStock;
      await InventoryLog.create({
        productId: updatedProduct._id,
        merchantId,
        type: difference > 0 ? 'IN' : 'OUT',
        quantity: Math.abs(difference),
        reason: 'Stock Quantity Manual Correction',
        batchNumber: updatedProduct.batchNumber || 'CORR-BATCH',
      });

      if (updatedProduct.stock <= (updatedProduct.lowStockThreshold || 5)) {
        await createMerchantNotification(
          String(merchantId),
          'Low Stock Alert',
          `Product "${updatedProduct.name}" has hit low stock threshold (${updatedProduct.stock} left).`,
          'LOW_STOCK',
          `/merchant?tab=inventory`
        );
      }
    }

    res.json({ message: 'Product updated successfully', product: updatedProduct });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update product', error: err.message });
  }
};

export const deleteProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const merchantId = req.user?.id || req.user?._id;

    const product = await Product.findOneAndDelete({ _id: id, merchantId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found or unauthorized' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to delete product', error: err.message });
  }
};

export const duplicateProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const merchantId = req.user?.id || req.user?._id;

    const original = await Product.findOne({ _id: id, merchantId });
    if (!original) {
      return res.status(404).json({ message: 'Original product not found' });
    }

    const copy = new Product(original.toObject());
    copy._id = new Types.ObjectId();
    copy.name = `${original.name} (Copy)`;
    copy.sku = `${original.sku}-COPY`;
    copy.reviews = [];
    copy.rating = 5.0;
    copy.createdAt = new Date();
    copy.updatedAt = new Date();

    await copy.save();
    res.status(201).json({ message: 'Product duplicated successfully', product: copy });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to duplicate product', error: err.message });
  }
};

// ==========================================
// 3. INVENTORY LOGS & ADJUSTMENTS
// ==========================================
export const getInventoryLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id || req.user?._id;
    const logs = await InventoryLog.find({ merchantId })
      .populate('productId', 'name sku imageUrl')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch inventory logs', error: err.message });
  }
};

export const adjustStock = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id || req.user?._id;
    const { productId, type, quantity, reason, batchNumber, warehouseName } = req.body;

    const product = await Product.findOne({ _id: productId, merchantId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const qty = Number(quantity);
    if (type === 'IN') {
      product.stock += qty;
    } else if (type === 'OUT' || type === 'ADJUSTMENT') {
      if (type === 'OUT' && product.stock < qty) {
        return res.status(400).json({ message: 'Insufficient stock available' });
      }
      product.stock = Math.max(0, product.stock - (type === 'OUT' ? qty : -qty));
    }

    await product.save();

    const log = await InventoryLog.create({
      productId,
      merchantId,
      type,
      quantity: Math.abs(qty),
      reason,
      batchNumber,
      warehouseName,
    });

    if (product.stock <= (product.lowStockThreshold || 5)) {
      await createMerchantNotification(
        String(merchantId),
        product.stock === 0 ? 'Out of Stock Alert' : 'Low Stock Alert',
        `Product "${product.name}" stock is now ${product.stock}.`,
        'LOW_STOCK',
        `/merchant?tab=inventory`
      );
    }

    res.status(201).json({ message: 'Inventory adjusted successfully', log, currentStock: product.stock });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to adjust stock', error: err.message });
  }
};

export const bulkUpdateInventory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id || req.user?._id;
    const { updates } = req.body;

    for (const update of updates) {
      const product = await Product.findOne({ _id: update.productId, merchantId });
      if (product) {
        const diff = update.newStock - product.stock;
        if (diff !== 0) {
          product.stock = update.newStock;
          await product.save();

          await InventoryLog.create({
            productId: product._id,
            merchantId,
            type: diff > 0 ? 'IN' : 'OUT',
            quantity: Math.abs(diff),
            reason: 'Bulk Stock Update',
          });
        }
      }
    }

    res.json({ message: 'Bulk inventory updated successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Bulk update failed', error: err.message });
  }
};

// ==========================================
// 4. REVIEWS RESPONSES
// ==========================================
export const getReviews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id || req.user?._id;
    const products = await Product.find({ merchantId });

    const reviewList: any[] = [];
    for (const p of products) {
      if (p.reviews && p.reviews.length > 0) {
        p.reviews.forEach((r: any) => {
          reviewList.push({
            productId: p._id,
            productName: p.name,
            reviewId: r._id,
            farmerId: r.farmerId,
            name: r.name,
            rating: r.rating,
            comment: r.comment,
            reply: r.reply,
            isReported: r.isReported,
            reportReason: r.reportReason,
            date: r.date,
          });
        });
      }
    }

    res.json(reviewList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch reviews', error: err.message });
  }
};

export const replyToReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, reviewId } = req.params;
    const { reply } = req.body;
    const merchantId = req.user?.id || req.user?._id;

    const product = await Product.findOne({ _id: productId, merchantId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const review = (product.reviews as any).id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.reply = reply;
    await product.save();

    res.json({ message: 'Reply submitted successfully', reply });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to reply to review', error: err.message });
  }
};

export const reportReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, reviewId } = req.params;
    const { reason } = req.body;
    const merchantId = req.user?.id || req.user?._id;

    const product = await Product.findOne({ _id: productId, merchantId });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const review = (product.reviews as any).id(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.isReported = true;
    review.reportReason = reason || 'Inappropriate comment content';
    await product.save();

    res.json({ message: 'Review flagged and reported to admins successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to report review', error: err.message });
  }
};

// ==========================================
// 5. COUPONS & PROMO OFFERS
// ==========================================
export const getOffers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id || req.user?._id;
    const offers = await CouponOffer.find({ merchantId }).sort({ createdAt: -1 });
    res.json(offers);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch offers', error: err.message });
  }
};

export const createOffer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const merchantId = req.user?.id || req.user?._id;
    const offer = await CouponOffer.create({
      ...req.body,
      merchantId,
    });
    res.status(201).json({ message: 'Promotion campaign created successfully', offer });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to create offer', error: err.message });
  }
};

export const updateOffer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const merchantId = req.user?.id || req.user?._id;

    const offer = await CouponOffer.findOneAndUpdate({ _id: id, merchantId }, req.body, { new: true });
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found or unauthorized' });
    }

    res.json({ message: 'Promotion campaign updated successfully', offer });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update offer', error: err.message });
  }
};

export const deleteOffer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const merchantId = req.user?.id || req.user?._id;

    const offer = await CouponOffer.findOneAndDelete({ _id: id, merchantId });
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    res.json({ message: 'Offer deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to delete offer', error: err.message });
  }
};
