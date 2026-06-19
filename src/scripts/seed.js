import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../config/db.js';
import Tour from '../models/Tour.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  try {
    await connectToDatabase();
    const filePath = path.join(__dirname, '../data/tours.sample.json');
    const sample = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    await Tour.deleteMany({});
    await Tour.insertMany(sample);

    const adminEmail = 'admin@travel-agency.test';
    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      const password = 'password123';
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      await User.create({ name: 'Admin', email: adminEmail, password: hashed, isAdmin: true });
      // eslint-disable-next-line no-console
      console.log('Admin user created:', adminEmail, 'password:', password);
    }

    // eslint-disable-next-line no-console
    console.log('Seed complete');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

run();

