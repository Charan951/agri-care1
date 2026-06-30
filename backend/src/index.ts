import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initSocket } from './utils/socket';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import customerRoutes from './routes/customerRoutes';
import specialistRoutes from './routes/specialistRoutes';
import merchantRoutes from './routes/merchantRoutes';
import uploadRoutes from './routes/uploadRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agricare';

// Middleware Configuration
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// CORS configuration - Allow cookie forwarding from frontend
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Health Check Route
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    timestamp: new Date()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/specialist', specialistRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/upload', uploadRoutes);

// Function to auto-seed when database is empty (e.g. in-memory database)
async function autoSeedIfEmpty() {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.warn('Database connection is not active. Skipping auto-seeding.');
      return;
    }
    const userCount = await db.collection('users').countDocuments();
    if (userCount === 0) {
      console.log('Database is empty. Initiating auto-seeding process...');
      
      const bcrypt = await import('bcryptjs');
      const hashPassword = async (pass: string) => await bcrypt.default.hash(pass, 10);
      
      // 1. Admin user
      const adminUser = {
        name: 'AgriCare Admin',
        email: 'admin@agricare.com',
        password: await hashPassword('Admin@123'),
        mobile: '+91 99999 99999',
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const adminResult = await db.collection('users').insertOne(adminUser);
      
      // 2. Super User
      const superUser = {
        name: 'Rajesh Kumar',
        email: 'superuser@agricare.com',
        password: await hashPassword('Super@123'),
        mobile: '+91 88888 88888',
        role: 'SUPER_USER',
        workingRegion: 'North India',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('users').insertOne(superUser);

      // 3. Specialists
      const specialist1 = {
        name: 'Dr. Anand Swaminathan',
        email: 'specialist1@agricare.com',
        password: await hashPassword('Specialist@123'),
        mobile: '+91 77777 77777',
        role: 'AGRI_SPECIALIST',
        specialization: 'Plant Pathology & Fungi',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const spec1Result = await db.collection('users').insertOne(specialist1);

      const specialist2 = {
        name: 'Dr. Priya Deshmukh',
        email: 'specialist2@agricare.com',
        password: await hashPassword('Specialist@123'),
        mobile: '+91 76666 66666',
        role: 'AGRI_SPECIALIST',
        specialization: 'Soil Science & Entomology',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const spec2Result = await db.collection('users').insertOne(specialist2);

      // 4. Merchants
      const merchant1 = {
        name: 'Suresh Patil',
        email: 'merchant1@agricare.com',
        password: await hashPassword('Merchant@123'),
        mobile: '+91 66666 66666',
        role: 'MERCHANT',
        businessName: 'Bharat Seeds Ltd',
        gstin: '27AAAAA1111A1Z1',
        rating: 4.8,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const merch1Result = await db.collection('users').insertOne(merchant1);

      const merchant2 = {
        name: 'Harpreet Singh',
        email: 'merchant2@agricare.com',
        password: await hashPassword('Merchant@123'),
        mobile: '+91 65555 55555',
        role: 'MERCHANT',
        businessName: 'Kisan Fertilisers',
        gstin: '03BBBBB2222B2Z2',
        rating: 4.5,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('users').insertOne(merchant2);

      // 4.5 Products
      const product1 = {
        name: 'Premium Hybrid Cotton Seeds (1kg)',
        description: 'High-yield cotton hybrid seeds resistant to major pests. Optimal for rain-fed regions.',
        category: 'Seeds & Saplings',
        price: 950,
        rating: 4.8,
        stock: 45,
        imageUrl: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32',
        merchantId: merch1Result.insertedId,
        reviews: [
          { name: 'Ramesh Patil', rating: 5, comment: 'Excellent seeds, highly recommend!', date: new Date() }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const prod1Result = await db.collection('products').insertOne(product1);

      const product2 = {
        name: 'NPK 19:19:19 Soluble Fertilizer (10kg)',
        description: 'Completely water-soluble fertilizer containing essential macronutrients N, P, and K.',
        category: 'Fertilizers',
        price: 1250,
        rating: 4.6,
        stock: 80,
        imageUrl: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399',
        merchantId: merchant2 ? (merchant2 as any)._id : new mongoose.Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const prod2Result = await db.collection('products').insertOne(product2);

      const product3 = {
        name: 'Organic Compost (5kg)',
        description: 'Fully decomposed organic vermicompost loaded with macro & micronutrients.',
        category: 'Fertilizers',
        price: 300,
        rating: 4.5,
        stock: 120,
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e',
        merchantId: merch1Result.insertedId,
        reviews: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('products').insertOne(product3);

      const product4 = {
        name: 'Hand Sprayer Pump (8L)',
        description: 'Manual pressure sprayer pump with brass nozzle for crops spraying.',
        category: 'Equipment',
        price: 1850,
        rating: 4.2,
        stock: 25,
        imageUrl: 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13',
        merchantId: merch1Result.insertedId,
        reviews: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const prod4Result = await db.collection('products').insertOne(product4);

      // 5. Farmers
      const farmer1 = {
        name: 'Ramesh Patil',
        email: 'farmer1@agricare.com',
        password: await hashPassword('Farmer@123'),
        mobile: '+91 98765 43210',
        role: 'FARMER',
        workingRegion: 'Maharashtra-Pune',
        status: 'ACTIVE',
        assignedSpecialists: [spec1Result.insertedId],
        avatarUrl: 'https://images.unsplash.com/photo-1595437193398-f24279553f4f',
        preferredLanguage: 'Hindi',
        farms: [
          { name: 'Patil Farms West', size: 12, soilType: 'Black Clay', cropType: 'Cotton', location: 'Wadgaon, Pune' },
          { name: 'Patil Orchard', size: 5, soilType: 'Red Sandy', cropType: 'Tomato', location: 'Shirur, Pune' }
        ],
        savedAddresses: [
          { label: 'Home', street: 'House 4, Village Wadgaon', city: 'Pune', state: 'Maharashtra', pincode: '410501' }
        ],
        wishlist: [prod2Result.insertedId],
        cart: [
          { product: prod4Result.insertedId, quantity: 1 }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const farmer1Result = await db.collection('users').insertOne(farmer1);

      const farmer2 = {
        name: 'Sunita Devi',
        email: 'farmer2@agricare.com',
        password: await hashPassword('Farmer@123'),
        mobile: '+91 97777 88888',
        role: 'FARMER',
        workingRegion: 'Bihar-Patna',
        status: 'ACTIVE',
        assignedSpecialists: [spec2Result.insertedId],
        avatarUrl: 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea',
        preferredLanguage: 'English',
        farms: [
          { name: 'Sunita Field 1', size: 8, soilType: 'Alluvial soil', cropType: 'Paddy Rice', location: 'Mohania, Kaimur' }
        ],
        savedAddresses: [
          { label: 'Home Address', street: 'Village Mohania', city: 'Patna', state: 'Bihar', pincode: '821109' }
        ],
        wishlist: [],
        cart: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const farmer2Result = await db.collection('users').insertOne(farmer2);

      // Link specialist to farmers
      await db.collection('users').updateOne(
        { _id: spec1Result.insertedId },
        { $set: { assignedFarmers: [farmer1Result.insertedId] } }
      );
      await db.collection('users').updateOne(
        { _id: spec2Result.insertedId },
        { $set: { assignedFarmers: [farmer2Result.insertedId] } }
      );

      // 6. Disease Reports
      const report1 = {
        farmerId: farmer1Result.insertedId,
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
          diagnosedBy: spec1Result.insertedId
        },
        priority: 'MEDIUM',
        status: 'RESOLVED',
        assignedSpecialistId: spec1Result.insertedId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const r1Result = await db.collection('diseasereports').insertOne(report1);

      const report2 = {
        farmerId: farmer2Result.insertedId,
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
        assignedSpecialistId: spec2Result.insertedId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const r2Result = await db.collection('diseasereports').insertOne(report2);

      const report3 = {
        farmerId: farmer1Result.insertedId,
        cropName: 'Tomato',
        symptoms: 'Dark concentric target-like rings on mature leaves, stems and fruit.',
        imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19675',
        aiPrediction: {
          disease: 'Early Blight (Tomato)',
          confidence: 0.91,
          pesticides: ['Chlorothalonil', 'Copper Fungicide']
        },
        priority: 'LOW',
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('diseasereports').insertOne(report3);

      // 7. Consultations
      const consultation1 = {
        reportId: r1Result.insertedId,
        farmerId: farmer1Result.insertedId,
        specialistId: spec1Result.insertedId,
        status: 'COMPLETED',
        chatHistory: [
          {
            senderId: farmer1Result.insertedId,
            message: 'Hello Doctor, I have uploaded the cotton leaves image. AI says Alternaria Leaf Spot. Can you please check?',
            timestamp: new Date(Date.now() - 3600000 * 24 * 2)
          },
          {
            senderId: spec1Result.insertedId,
            message: 'Hello Ramesh. Yes, the AI is correct. It is Alternaria Leaf Spot. Ensure you do not overwater the plants.',
            timestamp: new Date(Date.now() - 3600000 * 24 * 1.8)
          }
        ],
        prescription: {
          medicines: ['Mancozeb 75% WP (2.5 g/L of water)', 'Copper Oxychloride (3 g/L)'],
          advice: 'Apply Mancozeb immediately. Spray in the morning or late evening. Repeat in 10 days if spots persist.',
          createdAt: new Date(Date.now() - 3600000 * 24 * 1.4)
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('consultations').insertOne(consultation1);

      const consultation2 = {
        reportId: r2Result.insertedId,
        farmerId: farmer2Result.insertedId,
        specialistId: spec2Result.insertedId,
        status: 'ACTIVE',
        chatHistory: [
          {
            senderId: farmer2Result.insertedId,
            message: 'Doctor, the paddy fields are turning brown. Please check the spots.',
            timestamp: new Date(Date.now() - 3600000 * 3)
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('consultations').insertOne(consultation2);

      // 8. Orders & Payments
      const order1 = {
        merchantId: merch1Result.insertedId,
        farmerId: farmer1Result.insertedId,
        items: [
          { product: 'Premium Hybrid Cotton Seeds (1kg)', quantity: 2, price: 950 },
          { product: 'Organic Compost (5kg)', quantity: 4, price: 300 }
        ],
        totalAmount: 3100,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        deliveryAddress: 'House 4, Village Wadgaon, Pune, Maharashtra, 410501',
        invoiceUrl: '/invoices/INV_001.pdf',
        createdAt: new Date(Date.now() - 3600000 * 24 * 15),
        updatedAt: new Date(Date.now() - 3600000 * 24 * 15)
      };
      const o1Result = await db.collection('orders').insertOne(order1);

      const pay1 = {
        orderId: o1Result.insertedId,
        transactionId: 'TXN100098573210',
        amount: 3100,
        status: 'SUCCESSFUL',
        paymentMethod: 'UPI',
        merchantSettled: true,
        createdAt: new Date(Date.now() - 3600000 * 24 * 15),
        updatedAt: new Date(Date.now() - 3600000 * 24 * 15)
      };
      await db.collection('payments').insertOne(pay1);

      const order2 = {
        merchantId: merch1Result.insertedId,
        farmerId: farmer2Result.insertedId,
        items: [
          { product: 'NPK 19:19:19 Soluble Fertilizer (10kg)', quantity: 1, price: 1250 }
        ],
        totalAmount: 1250,
        status: 'SHIPPED',
        paymentStatus: 'PAID',
        deliveryAddress: 'Village Mohania, Kaimur District, Bihar, 821109',
        invoiceUrl: '/invoices/INV_002.pdf',
        createdAt: new Date(Date.now() - 3600000 * 24 * 2),
        updatedAt: new Date(Date.now() - 3600000 * 24 * 2)
      };
      const o2Result = await db.collection('orders').insertOne(order2);

      const pay2 = {
        orderId: o2Result.insertedId,
        transactionId: 'TXN100098579450',
        amount: 1250,
        status: 'SUCCESSFUL',
        paymentMethod: 'CARD',
        merchantSettled: false,
        createdAt: new Date(Date.now() - 3600000 * 24 * 2),
        updatedAt: new Date(Date.now() - 3600000 * 24 * 2)
      };
      await db.collection('payments').insertOne(pay2);

      // 9. Notifications
      const notif1 = {
        title: 'Database Backup Completed',
        message: 'Daily scheduled database backup was successfully stored to AWS S3.',
        type: 'INFO',
        readBy: [],
        createdAt: new Date()
      };
      await db.collection('systemnotifications').insertOne(notif1);

      const notif2 = {
        title: 'New Merchant Registration Request',
        message: 'Merchant Bharat Seeds Ltd requested validation review for GSTIN 27AAAAA1111A1Z1.',
        type: 'ALERT',
        readBy: [],
        createdAt: new Date()
      };
      await db.collection('systemnotifications').insertOne(notif2);

      // 10. Support Tickets
      const ticket1 = {
        farmerId: farmer1Result.insertedId,
        title: 'Delay in Seed Shipment',
        description: 'Ordered Cotton Seeds 10 days ago. Tracking status is still set to packed. Need urgent delivery.',
        images: [],
        status: 'ASSIGNED',
        chatHistory: [
          { senderId: farmer1Result.insertedId, message: 'Ordered Cotton Seeds 10 days ago. Tracking status is still packed.', timestamp: new Date(Date.now() - 3600000 * 24 * 3) },
          { senderId: adminResult.insertedId, message: 'Hello Ramesh, we have verified with our shipping vendor. The packet has been dispatched and will reach you by tomorrow.', timestamp: new Date(Date.now() - 3600000 * 24 * 2) }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('tickets').insertOne(ticket1);

      const ticket2 = {
        farmerId: farmer2Result.insertedId,
        title: 'Razorpay Payment Failed But Amount Debited',
        description: 'I tried buying soluble NPK fertilizer. Razorpay payment failed on screen, but my bank account was debited ₹1250. Please check.',
        images: [],
        status: 'OPEN',
        chatHistory: [
          { senderId: farmer2Result.insertedId, message: 'Razorpay payment failed on screen, but my bank account was debited ₹1250. Please check.', timestamp: new Date(Date.now() - 3600000 * 2) }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('tickets').insertOne(ticket2);

      // 11. Merchant Specific Data
      await db.collection('inventorylogs').insertMany([
        { productId: prod1Result.insertedId, merchantId: merch1Result.insertedId, type: 'IN', quantity: 45, reason: 'Initial seed stock In', createdAt: new Date() },
        { productId: prod4Result.insertedId, merchantId: merch1Result.insertedId, type: 'IN', quantity: 25, reason: 'Initial seed stock In', createdAt: new Date() }
      ]);
      await db.collection('couponoffers').insertOne({
        merchantId: merch1Result.insertedId,
        title: 'Monsoon Special 15% OFF',
        code: 'MONSOON15',
        type: 'COUPON',
        discountPercentage: 15,
        minPurchaseAmount: 500,
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000 * 24 * 30),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await db.collection('settlements').insertOne({
        merchantId: merch1Result.insertedId,
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
        orderIds: [o1Result.insertedId],
        settledAt: new Date(Date.now() - 3600000 * 24 * 5),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await db.collection('merchantnotifications').insertMany([
        { merchantId: merch1Result.insertedId, title: 'Welcome to AgriCare Partner Network!', message: 'Your store profile is active. Start listing your inventory supplies.', type: 'PRODUCT_APPROVAL', isRead: false, createdAt: new Date() },
        { merchantId: merch1Result.insertedId, title: 'New Order Received', message: 'You have received a new purchase order for Hand Sprayer Pump.', type: 'NEW_ORDER', isRead: false, link: '/merchant?tab=orders', createdAt: new Date() }
      ]);
      await db.collection('customernotes').insertOne({
        merchantId: merch1Result.insertedId,
        farmerId: farmer1Result.insertedId,
        note: 'Prefer early morning delivery.',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('Database auto-seeding completed successfully.');
      console.log('=========================================');
      console.log('Default Admin Account Details:');
      console.log('  Email:    admin@agricare.com');
      console.log('  Password: Admin@123');
      console.log('=========================================');
    }
  } catch (err) {
    console.error('Error during auto-seeding:', err);
  }
}

// Database Connection Manager
async function connectDB() {
  try {
    console.log(`Attempting to connect to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 3000 });
    console.log('Successfully connected to local MongoDB.');
    await autoSeedIfEmpty();
  } catch (err) {
    console.warn('Local MongoDB connection failed. Attempting to launch in-memory MongoDB database...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoServer.getUri();
      console.log(`In-Memory MongoDB Server running at: ${inMemoryUri}`);
      await mongoose.connect(inMemoryUri);
      console.log('Successfully connected to In-Memory MongoDB.');
      await autoSeedIfEmpty();
    } catch (inMemErr) {
      console.error('Fatal: Failed to start both local and in-memory MongoDB instances:', inMemErr);
      process.exit(1);
    }
  }
}

// Connect to Database & Start Server
connectDB().then(() => {
  const server = createServer(app);
  initSocket(server, allowedOrigins);
  server.listen(PORT, () => {
    console.log(`AgriCare Backend server is running on port ${PORT}`);
  });
});
