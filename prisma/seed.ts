import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultStartingPoints = [
  { name: "Challock", lat: 51.21861, lng: 0.88011 },
  { name: "Cambridge", lat: 52.17487, lng: 0.1283 },
  { name: "Preston", lat: 53.7632, lng: -2.7031 },
  { name: "Bamber Bridge", lat: 53.7275, lng: -2.6625 },
  { name: "Blackburn", lat: 53.7500, lng: -2.4849 },
  { name: "Ashford", lat: 51.1468, lng: 0.8718 },
  { name: "Canterbury", lat: 51.2802, lng: 1.0789 },
  { name: "Maidstone", lat: 51.2724, lng: 0.5220 },
  { name: "Tonbridge", lat: 51.1948, lng: 0.2711 },
  { name: "Sevenoaks", lat: 51.2733, lng: 0.1908 },
  { name: "Tunbridge Wells", lat: 51.1323, lng: 0.2635 },
  { name: "Hastings", lat: 50.8573, lng: 0.5730 },
  { name: "Lewes", lat: 50.8730, lng: 0.0087 },
  { name: "Horsham", lat: 51.0627, lng: -0.3254 },
  { name: "Chichester", lat: 50.8365, lng: -0.7792 },
  { name: "Worthing", lat: 50.8148, lng: -0.3730 },
  { name: "Guildford", lat: 51.2362, lng: -0.5703 },
  { name: "Farnham", lat: 51.2146, lng: -0.7990 },
  { name: "Winchester", lat: 51.0632, lng: -1.3080 },
  { name: "Basingstoke", lat: 51.2667, lng: -1.0876 },
  { name: "Andover", lat: 51.2078, lng: -1.4931 },
  { name: "Salisbury", lat: 51.0688, lng: -1.7945 },
  { name: "Dorchester", lat: 50.7154, lng: -2.4378 },
  { name: "Yeovil", lat: 50.9452, lng: -2.6340 },
  { name: "Taunton", lat: 51.0190, lng: -3.1027 },
  { name: "Bridgwater", lat: 51.1280, lng: -2.9930 },
  { name: "Glastonbury", lat: 51.1484, lng: -2.7140 },
  { name: "Bath", lat: 51.3811, lng: -2.3590 },
  { name: "Chippenham", lat: 51.4613, lng: -2.1180 },
  { name: "Devizes", lat: 51.3530, lng: -1.9950 },
  { name: "Marlborough", lat: 51.4206, lng: -1.7289 },
  { name: "Newbury", lat: 51.4010, lng: -1.3230 },
  { name: "Reading", lat: 51.4543, lng: -0.9781 },
  { name: "Henley-on-Thames", lat: 51.5350, lng: -0.9010 },
  { name: "Oxford", lat: 51.7520, lng: -1.2577 },
  { name: "Witney", lat: 51.7858, lng: -1.4855 },
  { name: "Banbury", lat: 52.0629, lng: -1.3397 },
  { name: "Stratford-upon-Avon", lat: 52.1917, lng: -1.7083 },
  { name: "Warwick", lat: 52.2819, lng: -1.5849 },
  { name: "Leamington Spa", lat: 52.2920, lng: -1.5369 },
  { name: "Coventry", lat: 52.4068, lng: -1.5197 },
  { name: "Rugby", lat: 52.3709, lng: -1.2615 },
  { name: "Northampton", lat: 52.2405, lng: -0.9027 },
  { name: "Bedford", lat: 52.1357, lng: -0.4672 },
  { name: "Milton Keynes", lat: 52.0406, lng: -0.7594 },
  { name: "Aylesbury", lat: 51.8168, lng: -0.8143 },
  { name: "St Albans", lat: 51.7552, lng: -0.3361 },
  { name: "Luton", lat: 51.8787, lng: -0.4200 },
  { name: "Hitchin", lat: 51.9479, lng: -0.2830 },
  { name: "Stevenage", lat: 51.9024, lng: -0.2019 },
  { name: "Hertford", lat: 51.7969, lng: -0.0777 },
  { name: "Bishop's Stortford", lat: 51.8721, lng: 0.1600 },
  { name: "Chelmsford", lat: 51.7356, lng: 0.4685 },
  { name: "Colchester", lat: 51.8891, lng: 0.9014 },
  { name: "Ipswich", lat: 52.0567, lng: 1.1482 },
  { name: "Bury St Edmunds", lat: 52.2475, lng: 0.7176 },
  { name: "Thetford", lat: 52.4130, lng: 0.7440 },
  { name: "Norwich", lat: 52.6309, lng: 1.2974 },
  { name: "King's Lynn", lat: 52.7522, lng: 0.3976 },
  { name: "Peterborough", lat: 52.5734, lng: -0.2405 },
  { name: "Stamford", lat: 52.6508, lng: -0.4808 },
  { name: "Grantham", lat: 52.9115, lng: -0.6388 },
  { name: "Newark-on-Trent", lat: 53.0763, lng: -0.8098 },
  { name: "Lincoln", lat: 53.2307, lng: -0.5406 },
  { name: "Sleaford", lat: 52.9963, lng: -0.4092 },
  { name: "Boston", lat: 52.9762, lng: -0.0263 },
  { name: "Spalding", lat: 52.7860, lng: -0.1530 },
  { name: "Loughborough", lat: 52.7721, lng: -1.2064 },
  { name: "Leicester", lat: 52.6369, lng: -1.1398 },
  { name: "Market Harborough", lat: 52.4776, lng: -0.9207 },
  { name: "Kettering", lat: 52.3972, lng: -0.7232 },
  { name: "Corby", lat: 52.4882, lng: -0.6930 },
  { name: "Oakham", lat: 52.6711, lng: -0.7330 },
  { name: "Melton Mowbray", lat: 52.7652, lng: -0.8852 },
  { name: "Nottingham", lat: 52.9548, lng: -1.1581 },
  { name: "Mansfield", lat: 53.1397, lng: -1.1972 },
  { name: "Chesterfield", lat: 53.2350, lng: -1.4215 },
  { name: "Derby", lat: 52.9225, lng: -1.4746 },
  { name: "Burton upon Trent", lat: 52.8021, lng: -1.6427 },
  { name: "Stafford", lat: 52.8073, lng: -2.1168 },
  { name: "Shrewsbury", lat: 52.7076, lng: -2.7543 },
  { name: "Ludlow", lat: 52.3676, lng: -2.7182 },
  { name: "Hereford", lat: 52.0565, lng: -2.7160 },
  { name: "Worcester", lat: 52.1920, lng: -2.2216 },
  { name: "Cheltenham", lat: 51.8994, lng: -2.0783 },
  { name: "Gloucester", lat: 51.8642, lng: -2.2446 },
  { name: "Cirencester", lat: 51.7145, lng: -1.9693 },
  { name: "Stroud", lat: 51.7468, lng: -2.2193 },
  { name: "Ross-on-Wye", lat: 51.9140, lng: -2.5830 },
  { name: "Monmouth", lat: 51.8113, lng: -2.7163 },
  { name: "Abergavenny", lat: 51.8240, lng: -3.0168 },
  { name: "Brecon", lat: 51.9452, lng: -3.3987 },
  { name: "Builth Wells", lat: 52.1505, lng: -3.4060 },
  { name: "Llandrindod Wells", lat: 52.2415, lng: -3.3802 },
  { name: "Carmarthen", lat: 51.8585, lng: -4.3116 },
  { name: "Haverfordwest", lat: 51.8012, lng: -4.9696 },
  { name: "Aberystwyth", lat: 52.4153, lng: -4.0829 },
  { name: "Machynlleth", lat: 52.5939, lng: -3.8535 },
  { name: "Dolgellau", lat: 52.7432, lng: -3.8836 },
  { name: "Wrexham", lat: 53.0466, lng: -2.9952 },
  { name: "Llangollen", lat: 52.9703, lng: -3.1719 },
  { name: "Ruthin", lat: 53.1134, lng: -3.3096 },
  { name: "Denbigh", lat: 53.1846, lng: -3.4178 },
  { name: "Harrogate", lat: 53.9921, lng: -1.5418 },
  { name: "Ripon", lat: 54.1384, lng: -1.5230 },
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

  let created = 0;
  let skipped = 0;
  for (const point of defaultStartingPoints) {
    const existing = await prisma.namedLocation.findFirst({
      where: { name: point.name },
    });

    if (!existing) {
      await prisma.namedLocation.create({
        data: point,
      });
      created++;
    } else {
      skipped++;
    }
  }
  console.log(`Starting points: ${created} created, ${skipped} skipped (${defaultStartingPoints.length} total)`);

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
