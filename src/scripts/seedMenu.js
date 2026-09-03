import "dotenv/config";
import connectToDb from "../configs/db/db.js";
import { seedDefaultMenuItemsService } from "../services/menu.service.js";

const runSeed = async () => {
  try {
    console.log("Connecting to database for menu seeding...");
    await connectToDb();

    console.log("Seeding Everbloom Café default menu items...");
    const result = await seedDefaultMenuItemsService(true);

    console.log(`✅ Success: ${result.message} (${result.count} items inserted)`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed menu:", error);
    process.exit(1);
  }
};

runSeed();
