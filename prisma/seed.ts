import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultStartingPoints = [
  { name: "Challock", lat: 51.21861, lng: 0.88011 },
  { name: "Cambridge", lat: 52.17487, lng: 0.1283 },
  { name: "Preston", lat: 53.7632, lng: -2.7031 },
  { name: "Bamber Bridge", lat: 53.7275, lng: -2.6625 },
  { name: "Blackburn", lat: 53.7500, lng: -2.4849 },
];

const cards = [
  { type: "pub", title: "A Warm Welcome", body: "The landlord greets you with a hearty wave. The fire crackles in the corner and the smell of a Sunday roast fills the air. You feel right at home." },
  { type: "pub", title: "Lock-In!", body: "You've arrived just as the pub is closing, but the regulars won't let you leave without one more round. A lively evening unfolds." },
  { type: "pub", title: "Quiz Night", body: "It's quiz night at the local! You join a team of strangers and somehow know the answer to every geography question. Must be all that map reading." },

  { type: "spire", title: "Bells Ring Out", body: "The church bells ring as you arrive, echoing across the valley. The sound carries for miles, a beacon guiding travellers home." },
  { type: "spire", title: "Ancient Stones", body: "You wander through the churchyard, reading weathered headstones dating back centuries. Each one tells a story of lives lived in this parish." },
  { type: "spire", title: "Stained Glass", body: "Sunlight streams through the stained glass windows, casting colourful patterns across the stone floor. A moment of peace on your journey." },

  { type: "tower", title: "The View From Above", body: "You climb the tower steps and emerge to a breathtaking panorama. From up here, you can see the roads stretching out in every direction." },
  { type: "tower", title: "Weathervane", body: "The old weathervane creaks in the wind, pointing steadfastly north-west. A useful reference point for any map reader." },
  { type: "tower", title: "Clock Strikes", body: "The tower clock strikes the hour as you pass. You count the chimes — better keep track of time on your journey!" },

  { type: "phone", title: "Reverse Charges", body: "You step into the red phone box and pick up the receiver. The dial tone hums steadily. A reminder of simpler times before smartphones." },
  { type: "phone", title: "Book Exchange", body: "This old phone box has been converted into a tiny library. You swap a well-thumbed road atlas for a book of local folk tales." },
  { type: "phone", title: "Emergency Call", body: "The phone box stands like a red sentinel on the village green. In an emergency, it's good to know exactly where you are on the map." },

  { type: "school", title: "Playtime!", body: "The school bell rings for break time and children pour out into the playground. Their energy is infectious — you feel recharged for the road ahead." },
  { type: "school", title: "Geography Lesson", body: "Through the window you glimpse a classroom with maps pinned to every wall. Ordnance Survey maps, naturally. These children are learning well." },
  { type: "school", title: "Sports Day", body: "The school field is set up for sports day with lanes marked in white paint. You resist the urge to join the egg-and-spoon race." },
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

  const existingCardCount = await prisma.card.count();
  if (existingCardCount === 0) {
    for (const card of cards) {
      await prisma.card.create({ data: card });
    }
    console.log(`Created ${cards.length} cards`);
  } else {
    console.log(`Skipped cards (${existingCardCount} exist)`);
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
