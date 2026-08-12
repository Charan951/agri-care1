import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { DiseaseReport } from '../models/DiseaseReport';
import { Consultation } from '../models/Consultation';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { SystemNotification } from '../models/SystemNotification';
import { Product } from '../models/Product';
import { Ticket } from '../models/Ticket';
import { InventoryLog } from '../models/InventoryLog';
import { CouponOffer } from '../models/CouponOffer';
import { Settlement } from '../models/Settlement';
import { MerchantNotification } from '../models/MerchantNotification';
import { CustomerNote } from '../models/CustomerNote';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Fatal Error: MONGODB_URI environment variable is not defined.');
  process.exit(1);
}

async function seedDB() {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected to database.');

    // 1. Flush existing collections
    console.log('Clearing old database records...');
    await User.deleteMany({});
    await DiseaseReport.deleteMany({});
    await Consultation.deleteMany({});
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await SystemNotification.deleteMany({});
    await Product.deleteMany({});
    await Ticket.deleteMany({});
    await InventoryLog.deleteMany({});
    await CouponOffer.deleteMany({});
    await Settlement.deleteMany({});
    await MerchantNotification.deleteMany({});
    await CustomerNote.deleteMany({});
    console.log('Old records cleared.');

    // Helper for password hashing
    const hashPassword = async (pass: string) => await bcrypt.hash(pass, 10);

    // 2. Seed Users
    console.log('Seeding user accounts...');
    
    // Seed Admin
    const adminUser = new User({
      name: 'AgriCare Admin',
      email: 'admin@agricare.com',
      password: await hashPassword('Admin@123'),
      mobile: '+91 99999 99999',
      role: 'ADMIN',
      status: 'ACTIVE'
    });
    await adminUser.save();

    // Seed Super User
    const superUser = new User({
      name: 'Rajesh Kumar',
      email: 'superuser@agricare.com',
      password: await hashPassword('Super@123'),
      mobile: '+91 88888 88888',
      role: 'SUPER_USER',
      workingRegion: 'North India',
      status: 'ACTIVE'
    });
    await superUser.save();

    // Seed Specialists
    const specialist1 = new User({
      name: 'Dr. Anand Swaminathan',
      email: 'specialist1@agricare.com',
      password: await hashPassword('Specialist@123'),
      mobile: '+91 77777 77777',
      role: 'AGRI_SPECIALIST',
      specialization: 'Plant Pathology & Fungi',
      status: 'ACTIVE'
    });
    await specialist1.save();

    const specialist2 = new User({
      name: 'Dr. Priya Deshmukh',
      email: 'specialist2@agricare.com',
      password: await hashPassword('Specialist@123'),
      mobile: '+91 76666 66666',
      role: 'AGRI_SPECIALIST',
      specialization: 'Soil Science & Entomology',
      status: 'ACTIVE'
    });
    await specialist2.save();

    // Seed Merchants
    const merchant1 = new User({
      name: 'Suresh Patil',
      email: 'merchant1@agricare.com',
      password: await hashPassword('Merchant@123'),
      mobile: '+91 66666 66666',
      role: 'MERCHANT',
      businessName: 'Bharat Seeds Ltd',
      gstin: '27AAAAA1111A1Z1',
      rating: 4.8,
      status: 'ACTIVE'
    });
    await merchant1.save();

    const merchant2 = new User({
      name: 'Harpreet Singh',
      email: 'merchant2@agricare.com',
      password: await hashPassword('Merchant@123'),
      mobile: '+91 65555 55555',
      role: 'MERCHANT',
      businessName: 'Kisan Fertilisers',
      gstin: '03BBBBB2222B2Z2',
      rating: 4.5,
      status: 'ACTIVE'
    });
    await merchant2.save();

    // 3. Seed Products
    console.log('Seeding marketplace products...');
    const product1 = new Product({
      name: 'Premium Hybrid Cotton Seeds (1kg)',
      description: 'High-yield cotton hybrid seeds resistant to major pests. Optimal for rain-fed regions.',
      category: 'Seeds & Saplings',
      price: 950,
      rating: 4.8,
      stock: 45,
      imageUrl: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32',
      merchantId: merchant1._id,
      reviews: [
        { name: 'Ramesh Patil', rating: 5, comment: 'Excellent seeds, highly recommend!', date: new Date() }
      ]
    });
    await product1.save();

    const product2 = new Product({
      name: 'NPK 19:19:19 Soluble Fertilizer (10kg)',
      description: 'Completely water-soluble fertilizer containing essential macronutrients N, P, and K.',
      category: 'Fertilizers',
      price: 1250,
      rating: 4.6,
      stock: 80,
      imageUrl: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399',
      merchantId: merchant2._id,
      reviews: [
        { name: 'Sunita Devi', rating: 4, comment: 'Nice product, fast delivery.', date: new Date() }
      ]
    });
    await product2.save();

    const product3 = new Product({
      name: 'Organic Compost (5kg)',
      description: 'Fully decomposed organic vermicompost loaded with macro & micronutrients.',
      category: 'Fertilizers',
      price: 300,
      rating: 4.5,
      stock: 120,
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e',
      merchantId: merchant1._id,
      reviews: []
    });
    await product3.save();

    const product4 = new Product({
      name: 'Hand Sprayer Pump (8L)',
      description: 'Manual pressure sprayer pump with brass nozzle for crops spraying.',
      category: 'Equipment',
      price: 1850,
      rating: 4.2,
      stock: 25,
      imageUrl: 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13',
      merchantId: merchant1._id,
      reviews: []
    });
    await product4.save();

    // 4. Seed Farmers
    console.log('Seeding farmers...');
    const farmer1 = new User({
      name: 'Ramesh Patil',
      email: 'farmer1@agricare.com',
      password: await hashPassword('Farmer@123'),
      mobile: '+91 98765 43210',
      role: 'FARMER',
      workingRegion: 'Maharashtra-Pune',
      status: 'ACTIVE',
      assignedSpecialists: [specialist1._id],
      avatarUrl: 'https://images.unsplash.com/photo-1595437193398-f24279553f4f',
      preferredLanguage: 'Hindi',
      farms: [
        { name: 'Patil Farms West', size: 12, soilType: 'Black Clay', cropType: 'Cotton', location: 'Wadgaon, Pune' },
        { name: 'Patil Orchard', size: 5, soilType: 'Red Sandy', cropType: 'Tomato', location: 'Shirur, Pune' }
      ],
      savedAddresses: [
        { label: 'Home', street: 'House 4, Village Wadgaon', city: 'Pune', state: 'Maharashtra', pincode: '410501' }
      ],
      wishlist: [product2._id],
      cart: [
        { product: product4._id, quantity: 1 }
      ]
    });
    await farmer1.save();

    const farmer2 = new User({
      name: 'Sunita Devi',
      email: 'farmer2@agricare.com',
      password: await hashPassword('Farmer@123'),
      mobile: '+91 97777 88888',
      role: 'FARMER',
      workingRegion: 'Bihar-Patna',
      status: 'ACTIVE',
      assignedSpecialists: [specialist2._id],
      avatarUrl: 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea',
      preferredLanguage: 'English',
      farms: [
        { name: 'Sunita Field 1', size: 8, soilType: 'Alluvial soil', cropType: 'Paddy Rice', location: 'Mohania, Kaimur' }
      ],
      savedAddresses: [
        { label: 'Home Address', street: 'Village Mohania', city: 'Patna', state: 'Bihar', pincode: '821109' }
      ],
      wishlist: [],
      cart: []
    });
    await farmer2.save();

    console.log('Users seeded.');

    // Link specialists to farmers
    specialist1.assignedFarmers = [farmer1._id];
    await specialist1.save();
    specialist2.assignedFarmers = [farmer2._id];
    await specialist2.save();

    // 5. Seed Disease Reports
    console.log('Seeding disease reports...');
    
    // Farmer 1 Cotton disease (AI & Specialist diagnosis matching)
    const report1 = new DiseaseReport({
      farmerId: farmer1._id,
      cropName: 'Cotton (Kapás)',
      symptoms: 'Small reddish brown spots on leaves, some yellowing and dropping of leaves.',
      imageUrl: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32',
      aiPrediction: {
        disease: 'Alternaria Leaf Spot',
        confidence: 0.94,
        pesticides: ['Copper Oxychloride', 'Mancozeb']
      },
      specialistDiagnosis: {
        disease: 'Alternaria Leaf Spot',
        diagnosis: 'Confirmed Alternaria Leaf Spot. It is caused by fungal pathogens and spreads in humid weather. Apply Mancozeb 75% WP.',
        pesticides: ['Mancozeb 75% WP', 'Avoid excessive nitrogen fertilisation'],
        diagnosedBy: specialist1._id
      },
      priority: 'MEDIUM',
      status: 'RESOLVED',
      assignedSpecialistId: specialist1._id
    });
    await report1.save();

    // Farmer 2 Rice disease (AI prediction, no specialist review yet)
    const report2 = new DiseaseReport({
      farmerId: farmer2._id,
      cropName: 'Paddy Rice',
      symptoms: 'Narrow brown lines running along leaf blades.',
      imageUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b',
      aiPrediction: {
        disease: 'Brown Spot',
        confidence: 0.89,
        pesticides: ['Hexaconazole', 'Propiconazole']
      },
      priority: 'HIGH',
      status: 'ASSIGNED',
      assignedSpecialistId: specialist2._id
    });
    await report2.save();

    // Open report, no specialist assigned yet
    const report3 = new DiseaseReport({
      farmerId: farmer1._id,
      cropName: 'Tomato',
      symptoms: 'Dark concentric target-like rings on mature leaves, stems and fruit.',
      imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675',
      aiPrediction: {
        disease: 'Early Blight (Tomato)',
        confidence: 0.91,
        pesticides: ['Chlorothalonil', 'Copper Fungicide']
      },
      priority: 'LOW',
      status: 'OPEN'
    });
    await report3.save();

    console.log('Disease reports seeded.');

    // 6. Seed Consultations
    console.log('Seeding specialist consultations...');
    const consultation1 = new Consultation({
      reportId: report1._id,
      farmerId: farmer1._id,
      specialistId: specialist1._id,
      status: 'COMPLETED',
      chatHistory: [
        {
          senderId: farmer1._id,
          message: 'Hello Doctor, I have uploaded the cotton leaves image. AI says Alternaria Leaf Spot. Can you please check?',
          timestamp: new Date(Date.now() - 3600000 * 24 * 2)
        },
        {
          senderId: specialist1._id,
          message: 'Hello Ramesh. Yes, the AI is correct. It is Alternaria Leaf Spot. Ensure you do not overwater the plants.',
          timestamp: new Date(Date.now() - 3600000 * 24 * 1.8)
        },
        {
          senderId: farmer1._id,
          message: 'Thank you doctor! Which spray should I buy?',
          timestamp: new Date(Date.now() - 3600000 * 24 * 1.5)
        }
      ],
      prescription: {
        medicines: ['Mancozeb 75% WP (2.5 g/L of water)', 'Copper Oxychloride (3 g/L)'],
        advice: 'Apply Mancozeb immediately. Spray in the morning or late evening. Repeat in 10 days if spots persist.',
        createdAt: new Date(Date.now() - 3600000 * 24 * 1.4)
      }
    });
    await consultation1.save();

    const consultation2 = new Consultation({
      reportId: report2._id,
      farmerId: farmer2._id,
      specialistId: specialist2._id,
      status: 'ACTIVE',
      chatHistory: [
        {
          senderId: farmer2._id,
          message: 'Doctor, the paddy fields are turning brown. Please check the spots.',
          timestamp: new Date(Date.now() - 3600000 * 3)
        },
        {
          senderId: specialist2._id,
          message: 'I am checking the image. It looks like Nitrogen deficiency coupled with a minor Brown Spot infection.',
          timestamp: new Date(Date.now() - 3600000 * 2.5)
        }
      ]
    });
    await consultation2.save();

    console.log('Consultations seeded.');

    // 7. Seed Orders
    console.log('Seeding marketplace orders...');
    
    // Order 1: Delivered
    const order1 = new Order({
      merchantId: merchant1._id,
      farmerId: farmer1._id,
      items: [
        { product: 'Premium Hybrid Cotton Seeds (1kg)', quantity: 2, price: 950 },
        { product: 'Organic Compost (5kg)', quantity: 4, price: 300 }
      ],
      totalAmount: 3100,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      deliveryAddress: 'House 4, Village Wadgaon, Pune, Maharashtra, 410501',
      invoiceUrl: '/invoices/INV_001.pdf'
    });
    await order1.save();

    // Order 2: Shipped / Pending delivery
    const order2 = new Order({
      merchantId: merchant2._id,
      farmerId: farmer2._id,
      items: [
        { product: 'NPK 19:19:19 Soluble Fertilizer (10kg)', quantity: 1, price: 1250 }
      ],
      totalAmount: 1250,
      status: 'SHIPPED',
      paymentStatus: 'PAID',
      deliveryAddress: 'Village Mohania, Kaimur District, Bihar, 821109',
      invoiceUrl: '/invoices/INV_002.pdf'
    });
    await order2.save();

    // Order 3: Pending Order
    const order3 = new Order({
      merchantId: merchant1._id,
      farmerId: farmer1._id,
      items: [
        { product: 'Hand Sprayer Pump (8L)', quantity: 1, price: 1850 }
      ],
      totalAmount: 1850,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      deliveryAddress: 'House 4, Village Wadgaon, Pune, Maharashtra, 410501'
    });
    await order3.save();

    console.log('Orders seeded.');

    // 8. Seed Payments
    console.log('Seeding transaction payments...');
    
    const pay1 = new Payment({
      orderId: order1._id,
      transactionId: 'TXN100098573210',
      amount: 3100,
      status: 'SUCCESSFUL',
      paymentMethod: 'UPI',
      merchantSettled: true,
      createdAt: new Date(Date.now() - 3600000 * 24 * 15)
    });
    await pay1.save();

    const pay2 = new Payment({
      orderId: order2._id,
      transactionId: 'TXN100098579450',
      amount: 1250,
      status: 'SUCCESSFUL',
      paymentMethod: 'CARD',
      merchantSettled: false,
      createdAt: new Date(Date.now() - 3600000 * 24 * 2)
    });
    await pay2.save();

    const pay3 = new Payment({
      orderId: order3._id,
      transactionId: 'TXN100098585671',
      amount: 1850,
      status: 'PENDING',
      paymentMethod: 'UPI',
      merchantSettled: false,
      createdAt: new Date(Date.now() - 3600000 * 4)
    });
    await pay3.save();

    console.log('Payments seeded.');

    // 9. Seed System Notifications
    console.log('Seeding system notifications...');
    
    const notif1 = new SystemNotification({
      title: 'Database Backup Completed',
      message: 'Daily scheduled database backup was successfully stored to AWS S3.',
      type: 'INFO',
      readBy: []
    });
    await notif1.save();

    const notif2 = new SystemNotification({
      title: 'New Merchant Registration Request',
      message: 'Merchant Bharat Seeds Ltd requested validation review for GSTIN 27AAAAA1111A1Z1.',
      type: 'ALERT',
      readBy: []
    });
    await notif2.save();

    const notif3 = new SystemNotification({
      title: 'High Disease Occurrence Alert',
      message: 'Unusual spike in Alternaria Leaf Spot reports observed in Pune district this week.',
      type: 'WARNING',
      readBy: []
    });
    await notif3.save();

    // 10. Seed Support Tickets
    console.log('Seeding support tickets...');
    const ticket1 = new Ticket({
      farmerId: farmer1._id,
      title: 'Delay in Seed Shipment',
      description: 'Ordered Cotton Seeds 10 days ago. Tracking status is still set to packed. Need urgent delivery.',
      images: [],
      status: 'ASSIGNED',
      chatHistory: [
        { senderId: farmer1._id, message: 'Ordered Cotton Seeds 10 days ago. Tracking status is still packed.', timestamp: new Date(Date.now() - 3600000 * 24 * 3) },
        { senderId: adminUser._id, message: 'Hello Ramesh, we have verified with our shipping vendor. The packet has been dispatched and will reach you by tomorrow.', timestamp: new Date(Date.now() - 3600000 * 24 * 2) }
      ]
    });
    await ticket1.save();

    const ticket2 = new Ticket({
      farmerId: farmer2._id,
      title: 'Razorpay Payment Failed But Amount Debited',
      description: 'I tried buying soluble NPK fertilizer. Razorpay payment failed on screen, but my bank account was debited ₹1250. Please check.',
      images: [],
      status: 'OPEN',
      chatHistory: [
        { senderId: farmer2._id, message: 'Razorpay payment failed on screen, but my bank account was debited ₹1250. Please check.', timestamp: new Date(Date.now() - 3600000 * 2) }
      ]
    });
    await ticket2.save();

    console.log('Support Tickets seeded.');

    // 11. Seed Merchant Specific Data
    console.log('Seeding merchant-specific details...');

    // Seed Inventory Logs
    await InventoryLog.create([
      { productId: product1._id, merchantId: merchant1._id, type: 'IN', quantity: 45, reason: 'Initial seed stock In' },
      { productId: product3._id, merchantId: merchant1._id, type: 'IN', quantity: 120, reason: 'Initial seed stock In' },
      { productId: product4._id, merchantId: merchant1._id, type: 'IN', quantity: 25, reason: 'Initial seed stock In' }
    ]);

    // Seed Coupon Offer
    const offer = await CouponOffer.create({
      merchantId: merchant1._id,
      title: 'Monsoon Special 15% OFF',
      code: 'MONSOON15',
      type: 'COUPON',
      discountPercentage: 15,
      minPurchaseAmount: 500,
      startDate: new Date(),
      endDate: new Date(Date.now() + 3600000 * 24 * 30),
      isActive: true
    });

    // Seed Settlement
    await Settlement.create({
      merchantId: merchant1._id,
      amount: 2790,
      totalSales: 3100,
      commissionDeducted: 310,
      refundDeductions: 0,
      status: 'PROCESSED',
      transactionReference: 'UTR1009827361',
      bankDetails: {
        holderName: 'Suresh Patil',
        accountNumber: '1234567890',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank'
      },
      orderIds: [order1._id],
      settledAt: new Date(Date.now() - 3600000 * 24 * 5)
    });

    // Seed Merchant Notifications
    await MerchantNotification.create([
      { merchantId: merchant1._id, title: 'Welcome to AgriCare Partner Network!', message: 'Your store profile is active. Start listing your inventory supplies.', type: 'PRODUCT_APPROVAL', isRead: false },
      { merchantId: merchant1._id, title: 'New Order Received', message: 'You have received a new purchase order for Hand Sprayer Pump.', type: 'NEW_ORDER', isRead: false, link: '/merchant?tab=orders' }
    ]);

    // Seed Customer CRM Notes
    await CustomerNote.create({
      merchantId: merchant1._id,
      farmerId: farmer1._id,
      note: 'Prefer early morning delivery.'
    });

    console.log('Merchant-specific details seeded.');

    console.log('=========================================');
    console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('Default Admin Account Details:');
    console.log('  Email:    admin@agricare.com');
    console.log('  Password: Admin@123');
    console.log('=========================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding process encountered error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedDB();
