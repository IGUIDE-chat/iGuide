/**
 * @file ./src/components/housing/constants/dormOfficialOverridesPch.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { type DormOverride, plan, urls } from "./dormOfficialOverrideUtils"

export const PCH_OFFICIAL_OVERRIDES: Record<string, DormOverride> = {
  bromley: {
    website: "https://bromleyhall.com/",
    address: "910 S. Third Street, Champaign, IL 61820",
    imageUrl:
      "https://bromleyhall.com/wp-content/uploads/2024/02/room-hero.jpg",
    galleryImages: urls(
      "https://bromleyhall.com/wp-content/uploads/2024/02/Bromley-051-4-scaled-e1707935140534-550x500.jpg",
      "https://bromleyhall.com/wp-content/uploads/2024/02/gal02-550x500.jpg",
      "https://bromleyhall.com/wp-content/uploads/2024/02/gal05-550x500.jpg",
      "https://bromleyhall.com/wp-content/uploads/2024/02/gal06-550x500.jpg",
      "https://bromleyhall.com/wp-content/uploads/2024/02/gal08-550x500.jpg",
      "https://bromleyhall.com/wp-content/uploads/2024/02/gal09-550x500.jpg"
    ),
    dining: "inside",
    diningNearbyDetail:
      "Bromley operates an all-inclusive dining program and snack bar on site.",
    categorizedTags: {
      livingConditions: [],
      facilities: ["laundry", "studyLounge", "busStop", "computerLab"],
      lifestyle: [],
    },
    structuredTags: {
      pool: true,
      kitchen: true,
      elevator: true,
      parking: true,
    },
    description:
      "Bromley is a fully air-conditioned private certified hall with large rooms, adjoining semi-private bathrooms, all-inclusive dining, and a broad amenity package.",
    pros: [
      "All-inclusive meal plan on site",
      "Some of the largest rooms among UIUC residence halls",
      "Semi-private bathrooms and amenities like a pool and rooftop spaces",
    ],
    cons: [
      "Rates rise quickly for singles and deluxe doubles",
      "Greek-adjacent social reputation may not fit every student",
      "Bathroom access is shared rather than fully private",
    ],
    price: 13744,
    bathroomType: "semi-private",
    floorPlans: [
      plan({
        officialName: "Single",
        bedCount: 1,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        price: 22016,
        imageUrls: urls(
          "https://bromleyhall.com/wp-content/uploads/2025/04/BH-Room-Descriptions.pdf"
        ),
        photoUrls: urls(
          "https://bromleyhall.com/wp-content/uploads/2024/01/single-new.jpg",
          "https://bromleyhall.com/wp-content/uploads/2024/01/single-01.jpg",
          "https://bromleyhall.com/wp-content/uploads/2024/01/single-02.jpg"
        ),
        description: "Single room.",
      }),
      plan({
        officialName: "Standard Double",
        bedCount: 2,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        sqft: 285,
        price: 17632,
        imageUrls: urls(
          "https://bromleyhall.com/wp-content/uploads/2025/04/BH-Room-Descriptions.pdf"
        ),
        photoUrls: urls(
          "https://bromleyhall.com/wp-content/uploads/2024/01/double-new.jpg",
          "https://bromleyhall.com/wp-content/uploads/2024/01/standard-double-01.jpg",
          "https://bromleyhall.com/wp-content/uploads/2024/01/standard-double-02-600x600.jpg"
        ),
        description: "Standard double room.",
      }),
      plan({
        officialName: "Triple",
        bedCount: 3,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        sqft: 375,
        price: 15320,
        imageUrls: urls(
          "https://bromleyhall.com/wp-content/uploads/2025/04/BH-Room-Descriptions.pdf"
        ),
        photoUrls: urls(
          "https://bromleyhall.com/wp-content/uploads/2024/02/gal07-550x500.jpg",
          "https://bromleyhall.com/wp-content/uploads/2024/02/gal08-550x500.jpg"
        ),
        description: "Triple room.",
      }),
      plan({
        officialName: "Quad",
        bedCount: 4,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        sqft: 375,
        price: 13744,
        imageUrls: urls(
          "https://bromleyhall.com/wp-content/uploads/2025/04/BH-Room-Descriptions.pdf"
        ),
        photoUrls: urls(
          "https://bromleyhall.com/wp-content/uploads/2024/02/gal09-550x500.jpg",
          "https://bromleyhall.com/wp-content/uploads/2024/02/room-hero.jpg"
        ),
        description: "Quad room.",
      }),
    ],
  },
  "illini-tower": {
    website: "https://www.illinitoweruiuc.com/",
    address: "409 E. Chalmers St., Champaign, IL 61820",
    imageUrl:
      "https://certified.housing.illinois.edu/wp-content/uploads/2021/01/IT-Featured-Photo-on-Website.jpg",
    galleryImages: urls(
      "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/10/Game-Room-05-Illini-Tower-Champaign-02.jpg",
      "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/10/Clubhouse-03-Illini-Tower-Champaign-02.jpg",
      "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/10/Cafeteria-05-Illini-Tower-Champaign-02.jpg",
      "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/10/Bedroom-07-Illini-Tower-Champaign-04.jpg",
      "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/10/Kitchen-02-Illini-Tower-Champaign-04.jpg",
      "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/10/Fitness-Center-04-Illini-Tower-Champaign-02.jpg"
    ),
    dining: "inside",
    categorizedTags: {
      livingConditions: [],
      facilities: [
        "laundry",
        "studyLounge",
        "convenienceStore",
        "busStop",
        "kitchen",
        "computerLab",
      ],
      lifestyle: [],
    },
    structuredTags: {
      elevator: true,
      laundry: true,
      kitchen: true,
      parking: true,
      petFriendly: true,
      nearGreenStreet: true,
      studyRooms: true,
    },
    description:
      "Illini Tower is a furnished private certified option two blocks from the Quad, with on-site dining, kitchens in multi-bedroom units, and a pet-friendly policy.",
    pros: [
      "Apartment-style units with kitchens",
      "On-site dining and study/lounge spaces",
      "One of the few pet-friendly student-residence options",
    ],
    cons: [
      "Rates differ significantly by layout and occupancy",
      "Older high-rise circulation can mean elevator dependence",
      "Shared in-unit bathrooms for most multi-bedroom plans",
    ],
    price: 12500,
    bathroomType: "semi-private",
    floorPlans: [
      plan({
        officialName: "S1",
        type: "Studio",
        labelCode: "Studio",
        bedCount: 1,
        bathroomCount: 1,
        bathroomScope: "private",
        sqft: 465,
        price: 25850,
        imageUrls: urls(
          "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/10/S1.jpg"
        ),
        photoUrls: urls(
          "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/10/S1-Gallery.jpg"
        ),
        description: "Private studio with kitchenette.",
      }),
      plan({
        officialName: "S2",
        type: "Studio",
        labelCode: "Studio",
        bedCount: 1,
        bathroomCount: 1,
        bathroomScope: "private",
        sqft: 560,
        imageUrls: urls(
          "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/10/S2.jpg"
        ),
        photoUrls: urls(
          "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/10/S2-Gallery.jpg"
        ),
        description: "Private studio with kitchenette.",
        available: false,
      }),
      plan({
        officialName: "B1 Shared",
        bedCount: 2,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        sqft: 630,
        price: 12500,
        imageUrls: urls(
          "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/11/B1-Shared.jpg"
        ),
        photoUrls: urls(
          "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/11/B1-Shared-Gallery.jpg"
        ),
        description: "Two-bedroom apartment; annual rate is published per bed.",
      }),
      plan({
        officialName: "B2 Shared",
        bedCount: 2,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        sqft: 700,
        price: 12500,
        imageUrls: urls(
          "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/10/B2-Shared.jpg"
        ),
        photoUrls: urls(
          "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/10/B2-Shared-Gallery.jpg"
        ),
        description: "Two-bedroom apartment; annual rate is published per bed.",
      }),
      plan({
        officialName: "B2 Private",
        bedCount: 2,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        sqft: 700,
        imageUrls: urls(
          "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/10/B2-Private.jpg"
        ),
        photoUrls: urls(
          "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/10/B2-Private-Gallery.jpg"
        ),
        description:
          "Two-bedroom apartment; private bedroom layout. Annual rate is published per person when available.",
        available: false,
      }),
      plan({
        officialName: "C1",
        bedCount: 3,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        sqft: 760,
        price: 17750,
        imageUrls: urls(
          "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/10/C1.jpg"
        ),
        photoUrls: urls(
          "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/10/C1-Gallery.jpg"
        ),
        description:
          "Three-bedroom apartment; annual rate is published per bed.",
      }),
      plan({
        officialName: "D1",
        bedCount: 4,
        bathroomCount: 2,
        bathroomScope: "semi-private",
        sqft: 860,
        price: 18750,
        imageUrls: urls(
          "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/10/D1.jpg"
        ),
        photoUrls: urls(
          "https://wp.propertyjs.app/illini-tower/wp-content/uploads/sites/10/2024/10/D1-Gallery.jpg"
        ),
        description:
          "Four-bedroom apartment; annual rate is published per bed.",
      }),
    ],
  },
  newman: {
    website: "https://www.sjcnc.org/",
    address: "604 E. Armory Ave., Champaign, IL 61820",
    applicationFee: 0,
    imageUrl: "https://www.sjcnc.org/image/115/1800",
    galleryImages: urls(
      "https://www.sjcnc.org/image/115/1800",
      "https://www.sjcnc.org/image/114/1800",
      "https://www.sjcnc.org/image/122/1800",
      "https://www.sjcnc.org/image/94/1800",
      "https://certified.housing.illinois.edu/wp-content/uploads/2025/02/Newman_DiningHall.jpg"
    ),
    dining: "inside",
    categorizedTags: {
      livingConditions: [],
      facilities: ["laundry", "studyLounge", "computerLab", "library"],
      lifestyle: ["quiet"],
    },
    structuredTags: {
      elevator: true,
      laundry: true,
      studyRooms: true,
      nearMainQuad: true,
      nearGreenStreet: true,
    },
    description:
      "Newman Hall combines traditional and suite-style housing a few steps from the Quad, with fresh dining, a large student community, and updated rooms.",
    pros: [
      "Very close to the Quad and Green Street",
      "On-site dining and strong community programming",
      "Both traditional and suite-style room types are available",
    ],
    cons: [
      "Published rates vary by hall side, room style, and meal plan",
      "Most private bedrooms still share a suite bathroom",
      "Religious-center setting may not fit every student",
    ],
    price: 15725,
    bathroomType: "semi-private",
    floorPlans: [
      plan({
        officialName: "South Double Room",
        bedCount: 2,
        bathroomCount: 0,
        bathroomScope: "semi-private",
        price: 15725,
        photoUrls: urls(
          "https://www.sjcnc.org/image/115/1800",
          "https://www.sjcnc.org/image/53/1000",
          "https://www.sjcnc.org/image/98/1000"
        ),
        description:
          "Updated traditional-style South double room with an in-room sink and vanity.",
      }),
      plan({
        officialName: "South Triple Room",
        bedCount: 3,
        bathroomCount: 0,
        bathroomScope: "communal",
        price: 15725,
        photoUrls: urls("https://www.sjcnc.org/image/115/1800"),
        description:
          "Updated traditional-style South triple room with in-room sinks and vanities.",
      }),
      plan({
        officialName: "South Single Room",
        bedCount: 1,
        bathroomCount: 0,
        bathroomScope: "communal",
        price: 17500,
        photoUrls: urls(
          "https://www.sjcnc.org/image/115/1800",
          "https://www.sjcnc.org/image/52/1000"
        ),
        description:
          "Updated traditional-style South single room with communal bathrooms and premium amenities.",
      }),
      plan({
        officialName: "North Double Suite",
        bedCount: 2,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        price: 17325,
        photoUrls: urls(
          "https://www.sjcnc.org/image/114/1800",
          "https://www.sjcnc.org/image/50/1000",
          "https://www.sjcnc.org/image/101/1000"
        ),
        description:
          "North double suite with two shared bedrooms, a shared living room, and a suite bathroom.",
      }),
      plan({
        officialName: "North Single Suite",
        bedCount: 1,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        price: 18750,
        photoUrls: urls(
          "https://www.sjcnc.org/image/51/1000",
          "https://www.sjcnc.org/image/116/1000"
        ),
        description:
          "Private North single suite with adjoining semi-private bathroom access.",
      }),
      plan({
        officialName: "North Semi-Private Single Room",
        bedCount: 1,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        price: 18925,
        photoUrls: urls(
          "https://www.sjcnc.org/image/49/1000",
          "https://www.sjcnc.org/image/94/1000"
        ),
        description:
          "North semi-private single with a dedicated bedroom and shared suite bathroom access.",
      }),
    ],
  },
  hendrick: {
    website: "https://www.hendrickhouse.com/",
    address: "904 W. Green St., Urbana, IL 61801",
    imageUrl:
      "https://www.hendrickhouse.com/wp-content/uploads/2019/04/12a.jpg",
    galleryImages: urls(
      "https://www.hendrickhouse.com/wp-content/uploads/2019/04/hh-1.jpg",
      "https://www.hendrickhouse.com/wp-content/uploads/2019/04/2.jpg",
      "https://www.hendrickhouse.com/wp-content/uploads/2019/04/12a.jpg",
      "https://www.hendrickhouse.com/wp-content/uploads/2019/04/16.jpg",
      "https://www.hendrickhouse.com/wp-content/uploads/2019/04/amenities-bg-img1.jpg"
    ),
    dining: "inside",
    categorizedTags: {
      livingConditions: [],
      facilities: ["laundry", "studyLounge", "gym", "computerLab"],
      lifestyle: ["quiet"],
    },
    structuredTags: {
      elevator: true,
      laundry: true,
      studyRooms: true,
      gymNearby: true,
      nearEngineering: true,
    },
    description:
      "Hendrick House sits near the engineering side of campus and pairs large rooms and semi-private baths with a dining program that the property highlights heavily.",
    pros: [
      "Close to engineering-side academic buildings",
      "Semi-private baths in many rooms",
      "Dining is a major differentiator and is on site",
    ],
    cons: [
      "Upper-end singles are expensive",
      "Less central for the Main Quad and Campustown than Newman or Bromley",
      "Room inventory is concentrated in doubles and singles",
    ],
    price: 14550,
    bathroomType: "semi-private",
    floorPlans: [
      plan({
        officialName: "East Double Standard Room",
        bedCount: 2,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        price: 14550,
        imageUrls: urls(
          "https://www.hendrickhouse.com/wp-content/uploads/2019/05/East_Double.jpg"
        ),
        photoUrls: urls(
          "https://www.hendrickhouse.com/wp-content/uploads/2019/04/12a.jpg"
        ),
        description:
          "East double standard room with a semi-private bath; annual rate shown for the 14-meal academic-year contract.",
      }),
      plan({
        officialName: "West Double Standard Room",
        bedCount: 2,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        price: 15750,
        imageUrls: urls(
          "https://www.hendrickhouse.com/wp-content/uploads/2019/05/West-Double.jpg"
        ),
        photoUrls: urls(
          "https://www.hendrickhouse.com/wp-content/uploads/2019/04/11.jpg"
        ),
        description:
          "West double standard room with a semi-private bath; annual rate shown for the 14-meal academic-year contract.",
      }),
      plan({
        officialName: "East Deluxe Double Room",
        bedCount: 2,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        price: 24450,
        imageUrls: urls(
          "https://www.hendrickhouse.com/wp-content/uploads/2019/05/Deluxe_Double.jpg"
        ),
        photoUrls: urls(
          "https://www.hendrickhouse.com/wp-content/uploads/2019/04/2.jpg",
          "https://www.hendrickhouse.com/wp-content/uploads/2019/04/16.jpg"
        ),
        description:
          "East deluxe double with two private bedrooms, a shared lounge, and one shared bathroom; annual rate shown for the 14-meal academic-year contract.",
      }),
      plan({
        officialName: "East Single Private Room",
        bedCount: 1,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        price: 25450,
        imageUrls: urls(
          "https://www.hendrickhouse.com/wp-content/uploads/2019/04/East_Single.jpg"
        ),
        photoUrls: urls(
          "https://www.hendrickhouse.com/wp-content/uploads/2019/04/16.jpg",
          "https://www.hendrickhouse.com/wp-content/uploads/2019/04/hh-1.jpg"
        ),
        description:
          "East single private room with a semi-private bath; annual rate shown for the 14-meal academic-year contract.",
      }),
      plan({
        officialName: "West Single Private Room",
        bedCount: 1,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        price: 27150,
        imageUrls: urls(
          "https://www.hendrickhouse.com/wp-content/uploads/2019/05/West-Single.jpg"
        ),
        photoUrls: urls(
          "https://www.hendrickhouse.com/wp-content/uploads/2019/04/18.jpg",
          "https://www.hendrickhouse.com/wp-content/uploads/2019/04/16.jpg"
        ),
        description:
          "West single private room with a semi-private bath; annual rate shown for the 14-meal academic-year contract.",
      }),
    ],
  },
  presby: {
    housingType: "PCH",
    location: "Campustown",
    website: "https://presbyhall.com/",
    address: "805 S. Fifth St., Champaign, IL 61820",
    applicationFee: 0,
    imageUrl:
      "https://certified.housing.illinois.edu/wp-content/uploads/2015/07/Presby-Gallery1-409x270-1.jpg",
    galleryImages: urls(
      "https://certified.housing.illinois.edu/wp-content/uploads/2018/12/Presby-website-2.jpg",
      "https://certified.housing.illinois.edu/wp-content/uploads/2015/07/07-20-15-propertypage-Presby1-PCH-1-2.jpg",
      "https://certified.housing.illinois.edu/wp-content/uploads/2015/07/Presby-Gallery6-3.jpg",
      "https://certified.housing.illinois.edu/wp-content/uploads/2015/07/Presby-Gallery7-3.jpg"
    ),
    dining: "inside",
    diningNearbyDetail:
      "Presby publishes room and board separately; a meal plan is required by the University.",
    bathroomType: "semi-private",
    categorizedTags: {
      livingConditions: [],
      facilities: ["laundry", "kitchen", "studyLounge"],
      lifestyle: [],
    },
    structuredTags: {
      elevator: true,
      laundry: true,
      kitchen: true,
      parking: true,
      studyRooms: true,
      nearGreenStreet: true,
      nearMainQuad: true,
    },
    description:
      "Presby Hall offers suite-style private certified housing with living rooms, kitchens, two bathrooms per suite, and an on-site parking garage.",
    pros: [
      "Suite layouts include kitchens and living rooms",
      "No application fee and on-site garage parking",
      "Published room-only and board pricing offers flexibility",
    ],
    cons: [
      "Certified-housing directory totals do not align perfectly with the room-only rate sheet",
      "Bathroom sharing depends on suite assignment",
      "Amenity photography is less detailed than some newer properties",
    ],
    price: 11775,
    floorPlans: [
      plan({
        officialName: "Standard Double",
        bedCount: 2,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        sqft: 200,
        price: 11775,
        imageUrls: urls(
          "https://presbyhall.com/wp-content/uploads/2018/05/5-bed-floorplan.png",
          "https://presbyhall.com/wp-content/uploads/2018/05/6-bed-floorplan.png"
        ),
        photoUrls: urls(
          "https://certified.housing.illinois.edu/wp-content/uploads/2018/12/Presby-website-2.jpg",
          "https://certified.housing.illinois.edu/wp-content/uploads/2015/07/07-20-15-propertypage-Presby1-PCH-1-2.jpg"
        ),
        description: "Standard double room in a suite.",
      }),
      plan({
        officialName: "Deluxe Double",
        bedCount: 2,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        sqft: 240,
        price: 12375,
        imageUrls: urls(
          "https://presbyhall.com/wp-content/uploads/2018/05/5-bed-floorplan.png"
        ),
        photoUrls: urls(
          "https://certified.housing.illinois.edu/wp-content/uploads/2015/07/Presby-Gallery6-3.jpg",
          "https://certified.housing.illinois.edu/wp-content/uploads/2015/07/Presby-Gallery7-3.jpg"
        ),
        description: "Deluxe double with bathroom adjacency.",
      }),
      plan({
        officialName: "Single",
        bedCount: 1,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        sqft: 130,
        price: 14025,
        imageUrls: urls(
          "https://presbyhall.com/wp-content/uploads/2018/05/5-bed-floorplan.png",
          "https://presbyhall.com/wp-content/uploads/2018/05/6-bed-floorplan.png"
        ),
        photoUrls: urls(
          "https://certified.housing.illinois.edu/wp-content/uploads/2015/07/07-20-15-propertypage-Presby1-PCH-1-2.jpg",
          "https://certified.housing.illinois.edu/wp-content/uploads/2018/12/Presby-website-2.jpg"
        ),
        description: "Single room in a shared suite.",
      }),
    ],
  },
  armory: {
    name: "Armory House",
    housingType: "PCH",
    location: "Campustown",
    website: "https://www.armoryhouse.com/",
    address: "1010 S. Second St., Champaign, IL 61820",
    imageUrl:
      "https://www.armoryhouse.com/sites/default/files/2020-01/main-photo.jpg",
    galleryImages: urls(
      "https://www.armoryhouse.com/sites/default/files/2020-01/main-photo.jpg",
      "https://www.armoryhouse.com/sites/default/files/2020-01/main-photo-2.jpg",
      "https://www.armoryhouse.com/sites/default/files/2020-01/suite-house.jpg",
      "https://www.armoryhouse.com/sites/default/files/2020-02/3%20%281%29_1.jpg",
      "https://www.armoryhouse.com/sites/default/files/2020-02/6_2.jpg",
      "https://www.armoryhouse.com/sites/default/files/2020-02/parking.jpg"
    ),
    dining: "inside",
    diningNearbyDetail:
      "Armory House Kitchen is part of the property and publishes room-and-meal pricing together.",
    bathroomType: "semi-private",
    categorizedTags: {
      livingConditions: [],
      facilities: ["laundry", "gym", "studyLounge", "kitchen", "computerLab"],
      lifestyle: ["internationalFriendly"],
    },
    structuredTags: {
      elevator: true,
      laundry: true,
      studyRooms: true,
      kitchen: true,
      parking: true,
      gymNearby: true,
      nearGreenStreet: true,
      nearMainQuad: true,
    },
    description:
      "Armory House is a private certified option near the south edge of campus with a globally oriented residential program, on-site dining, and both main-room and suite inventory.",
    pros: [
      "Wide mix of singles, doubles, and suite inventory",
      "On-site dining plus gym, laundry, and parking",
      "Property explicitly markets an international student community",
    ],
    cons: [
      "Some certified-housing summary rates differ slightly from the detailed property page",
      "Bathroom privacy depends on whether the room is in the main building or a suite",
      "More expensive single options rise quickly",
    ],
    price: 14000,
    floorPlans: [
      plan({
        officialName: "Main Double",
        bedCount: 2,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        price: 14000,
        imageUrls: urls(
          "https://www.armoryhouse.com/sites/default/files/2020-02/floorplan-double_0.jpg"
        ),
        photoUrls: urls(
          "https://www.armoryhouse.com/sites/default/files/inline-images/IMG_7198_0.jpg",
          "https://www.armoryhouse.com/sites/default/files/inline-images/IMG_8787.jpg"
        ),
        description:
          "Main double with suite-style bathroom sharing and the published 10-meal plan rate.",
      }),
      plan({
        officialName: "Deluxe Double",
        bedCount: 2,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        price: 15350,
        imageUrls: urls(
          "https://www.armoryhouse.com/sites/default/files/2020-02/floorplan-deluxe_2.jpg"
        ),
        photoUrls: urls(
          "https://www.armoryhouse.com/sites/default/files/inline-images/8_0.JPG",
          "https://www.armoryhouse.com/sites/default/files/inline-images/IMG_2052.jpeg"
        ),
        description: "Deluxe double with the published 10-meal plan rate.",
      }),
      plan({
        officialName: "Suite Double",
        bedCount: 2,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        price: 14600,
        imageUrls: urls(
          "https://www.armoryhouse.com/sites/default/files/2020-02/AH%20Suite3d%20F8_2.jpg"
        ),
        photoUrls: urls(
          "https://www.armoryhouse.com/sites/default/files/inline-images/DSC05624.JPG"
        ),
        description: "Suite double with the published 10-meal plan rate.",
      }),
      plan({
        officialName: "Main Single",
        bedCount: 1,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        price: 18650,
        imageUrls: urls(
          "https://www.armoryhouse.com/sites/default/files/2020-02/floorplan-single_1.jpg"
        ),
        photoUrls: urls(
          "https://www.armoryhouse.com/sites/default/files/inline-images/IMG_8771.jpg"
        ),
        description:
          "Main single with suite-style bathroom sharing and the published 10-meal plan rate.",
      }),
      plan({
        officialName: "Standard Single",
        bedCount: 1,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        imageUrls: urls(
          "https://www.armoryhouse.com/sites/default/files/2020-02/AH%20Suite3d%20F8_0.jpg"
        ),
        photoUrls: urls(
          "https://www.armoryhouse.com/sites/default/files/inline-images/DSC05144_1.JPG"
        ),
        description:
          "Standard single suite. Armory publishes this in a grouped Suite & Corner Single rate bucket.",
      }),
      plan({
        officialName: "Corner Single",
        bedCount: 1,
        bathroomCount: 1,
        bathroomScope: "semi-private",
        imageUrls: urls(
          "https://www.armoryhouse.com/sites/default/files/2020-02/AH%20Suite3d%20F8_1.jpg"
        ),
        photoUrls: urls(
          "https://www.armoryhouse.com/sites/default/files/inline-images/Suites%20Corner%20Room.jpg"
        ),
        description:
          "Corner single suite. Armory publishes this in a grouped Suite & Corner Single rate bucket.",
      }),
    ],
  },
}
