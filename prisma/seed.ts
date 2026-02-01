import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultStartingPoints = [
  { name: "Challock", lat: 51.21861, lng: 0.88011 },
  { name: "Cambridge", lat: 52.17487, lng: 0.1283 },
];

async function main() {
  console.log("Seeding database...");

  for (const point of defaultStartingPoints) {
    const existing = await prisma.namedLocation.findFirst({
      where: { name: point.name },
    });

    if (!existing) {
      await prisma.namedLocation.create({
        data: point,
      });
      console.log(`Created: ${point.name}`);
    } else {
      console.log(`Skipped (exists): ${point.name}`);
    }
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
