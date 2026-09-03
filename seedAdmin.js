import "dotenv/config";
import connectToDb from "./src/configs/db/db.js";
import AdminModel from "./src/models/admin.model.js";

const seedAdmin = async () => {
  try {
    await connectToDb();
    console.log("Connected to MongoDB for Everbloom admin seeding...");

    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@everbloom.com";
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "EverBloomAdmin2026!";

    const existingAdmin = await AdminModel.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`Admin account '${adminEmail}' already exists!`);
      process.exit(0);
    }

    const admin = await AdminModel.create({
      name: "Everbloom Manager",
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      isEmailVerified: true,
    });

    console.log("✅ Seeded Everbloom Admin Account Successfully!");
    console.log(`Email: ${admin.email}`);
    console.log(`Password: ${adminPassword}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Admin Seeding Error:", error);
    process.exit(1);
  }
};

seedAdmin();
