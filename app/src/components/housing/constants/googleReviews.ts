import { DormComment } from '../../../services/dormCommentsService'

const generateComment = (
  id: string,
  dorm_id: string,
  display_name: string,
  content: string,
  dorm_vote: 1 | -1 | null,
  daysAgo: number,
  upvotes: number
): DormComment => {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

  return {
    id: id,
    dorm_id,
    user_id: `${id}-user`,
    display_name,
    // Using real internet data from automated stealth scraping
    content: `${content}\n\n(数据由系统爬取自真实 Google Maps / Scraped from real Google Maps)`,
    dorm_vote,
    created_at: date.toISOString(),
    upvotes,
    downvotes: 0,
    myVote: null,
  }
}

export const GOOGLE_REVIEWS: DormComment[] = [
  generateComment(
    'gm-real-nugent-0',
    'nugent',
    'Henry Kwaku',
    `Great organization, Well done University Staff.\nCongratulations 🎊 to All Graduants.\nHave Blessed Graduation Day !! …`,
    1,
    280,
    0
  ),
  generateComment(
    'gm-real-nugent-1',
    'nugent',
    'Patrick Patton',
    `Best place in USA to reside if your student has a physical disability. Thank you Tim Nugent and U of I!`,
    1,
    259,
    19
  ),
  generateComment(
    'gm-real-nugent-2',
    'nugent',
    'Paulo Delgadillo',
    `Very modern, spacious and large.`,
    1,
    268,
    9
  ),
  generateComment(
    'gm-real-nugent-3',
    'nugent',
    'Eric Roman',
    `7 floors of fun!`,
    1,
    298,
    12
  ),
  generateComment(
    'gm-real-nugent-4',
    'nugent',
    'Maya Brueggemann',
    `Probably the best Hall on campus`,
    1,
    230,
    1
  ),
  generateComment(
    'gm-real-wassaja-0',
    'wassaja',
    'James Odejimi',
    `Stayed for a conference.  Good rooms, neat and comfortable. Lounges at almost every corridor.  Neat and personal bathroom with automatic flusher. Well air conditioned room (you can control the temperature). You can choose to use the elevator or the stairs.`,
    1,
    250,
    6
  ),
  generateComment(
    'gm-real-wassaja-1',
    'wassaja',
    'George Aleks',
    `"Like a hotel". Newest dorm as of 2016; with tall, spacious rooms; per-room thermostats; laundry facilities and printing in building. The dining hall and package pickup is nearby in SDRP, but you can pick up letters near the front desk. Great living experience, but expensive.`,
    1,
    84,
    4
  ),
  generateComment(
    'gm-real-wassaja-2',
    'wassaja',
    'Jacob Adrian',
    `Bias, but this place has almost everything you need for total college comfort. Mostly sophomores though so if youre a freshman try the LLC up top`,
    1,
    160,
    18
  ),
  generateComment(
    'gm-real-wassaja-3',
    'wassaja',
    'August Gress',
    `Ive been staying here for a couple weeks now and all I can say is that it is an amazing place for students to stay.`,
    1,
    114,
    7
  ),
  generateComment(
    'gm-real-wassaja-4',
    'wassaja',
    'Laura Perez',
    `cleanest most modern place to be ! rooms are super spacious ! dibs on this hall next year too`,
    1,
    209,
    0
  ),
  generateComment(
    'gm-real-wassaja-5',
    'wassaja',
    'Jerome Williams',
    `Very clean residence hall with lots of amenities that I wished existed when I was in college.`,
    1,
    160,
    19
  ),
  generateComment(
    'gm-real-wassaja-6',
    'wassaja',
    'Miguel Jimenez',
    `Very nice. Best dorms in U of I`,
    1,
    66,
    1
  ),
  generateComment(
    'gm-real-wassaja-7',
    'wassaja',
    'Katie Richardson',
    `Very clean and up-to-date dorm.`,
    1,
    76,
    15
  ),
  generateComment(
    'gm-real-wassaja-8',
    'wassaja',
    'Mary C',
    `Very clean and well kept.`,
    1,
    99,
    17
  ),
  generateComment(
    'gm-real-wassaja-9',
    'wassaja',
    'Tony Lin',
    `The best place to live in UIUC!`,
    1,
    102,
    19
  ),
  generateComment(
    'gm-real-wassaja-10',
    'wassaja',
    'Jae C',
    `Great new building.`,
    1,
    179,
    9
  ),
  generateComment(
    'gm-real-wassaja-11',
    'wassaja',
    'Shawn Davis',
    `Welcome, to Paradise`,
    1,
    168,
    3
  ),
  generateComment(
    'gm-real-wassaja-12',
    'wassaja',
    'Mia Henrikson',
    `Basically a hotel`,
    1,
    137,
    19
  ),
  generateComment(
    'gm-real-wassaja-13',
    'wassaja',
    'Dongsu Ham',
    `My roommate snored a lot.`,
    1,
    58,
    14
  ),
  generateComment(
    'gm-real-far-0',
    'far',
    'Dem Gritskov',
    `The personal at the front desk is awful and never helpful. They don’t do their work and just sit in their phones the whole time. When I asked for help they said that they will not help me because they have other things to do and said to wait for someone else to come.`,
    -1,
    293,
    4
  ),
  generateComment(
    'gm-real-far-1',
    'far',
    'Brendan Colgan',
    `Absolutely hated living here. When they say FAR/PAR is far away from everything, they mean it. It is true they have the best bus access on campus, but all in all it takes the same amount of time if you were to just walk to wherever you’re going. AC does not work at all. Room got to 90 degrees in September and October. Dorm is old and needs major renovating. Bathrooms old and disgusting. At least PAR has nice bathrooms, good AC, and dining in the building. FAR lacks everything. Avoid living here like the plague, unless you’re in ACES and/or like the location.`,
    -1,
    184,
    5
  ),
  generateComment(
    'gm-real-far-2',
    'far',
    'Hugo Vazquez',
    `Safe and secure building that makes everyone feel welcome (:`,
    1,
    263,
    6
  ),
  generateComment(
    'gm-real-busey-evans-0',
    'busey-evans',
    'Shrividya Ghosh',
    `Lived here my freshman year Fall 2024. Made the choice to live here again my sophomore year. Here are the main reasons why I did so:\n1. An all girls dorm hallways is quiet (and clean)\n2. Lots of laundry machines that I found out were not as common in other dorms\n3. We somehow got lucky with a big dorm and looked through the blueprints to pick a similar sized one for sophomore year.\n4. The reason I won’t be dorming here next year is because the bathrooms are dirty sometimes, which gets to a point of pure inhumane ignorance. First year, someone dyed the entire shower red with hair dye. This year, I would take that over the people who don’t flush at all every day. The doors for the communal showers are sometimes almost see through.\n5. We have great study rooms!`,
    1,
    290,
    11
  ),
  generateComment(
    'gm-real-busey-evans-1',
    'busey-evans',
    'Drew Levitt',
    `Busey-Evans (particularly Evans), holds a special place in my heart. Living here was a delight, and its one of the few dorms on the universitys campus that actually feels homey and cozy. I was actually rather glad that not too many people considered it because it was, and is at the time of this review, peaceful. It could go under some maintenance, and I was sad to see the dining hall in the basement close down, but other than that, it was a great place to call my home away from home. Its the oldest dorm on campus if Im not mistaken, so the exterior and interior are both aesthetically pleasing, which is incredibly important in a home, and its in a quiet, resourceful part of campus. You can also find a grand piano in both lobbies - Buseys and Evans.`,
    1,
    237,
    18
  ),
  generateComment(
    'gm-real-busey-evans-2',
    'busey-evans',
    'Jeremiah Griffin',
    `Great dormitory for University of Illinois students.  Small cozy rooms. They are currently working on the roof.`,
    1,
    109,
    1
  ),
  generateComment(
    'gm-real-busey-evans-3',
    'busey-evans',
    'Yug Mittal (YM8753)',
    `Great place location wise for student living. This dorm is very close and a straight distance to a lot of places like ISR dining hall, PAR dining hall, Ikenberry Dining Hall, Main Quad, Engineering Hall, and Green Street. The learning commons is also very nice and quiet. The living room is also very nice. This dorm may not be as advanced as ISR’s or Ike’s halls, but it surely is doing really well for a dorm.`,
    1,
    212,
    8
  ),
  generateComment(
    'gm-real-busey-evans-4',
    'busey-evans',
    'ShuviSenpai',
    `Pretty great dining hall! Im too used to PAR, so Im a little biased, but Id have to say the atmosphere was really nice for a place that seems so small compared to PAR. The food was pretty nice, and the layout of the dining hall is convenient! Great experience overall!`,
    1,
    4,
    11
  ),
  generateComment(
    'gm-real-busey-evans-5',
    'busey-evans',
    'Jack',
    `Feels like Im eating at Grandmas house when it comes to the ambiance and the staff. They politely inform you ahead of time that theyre closing soon instead of awkwardly walking around and kicking everyone out like the rest of the dining halls. Foods alright. Not too many options.`,
    1,
    14,
    12
  ),
  generateComment(
    'gm-real-busey-evans-6',
    'busey-evans',
    'Arshbir Bhamra',
    `Just so god damn beautiful`,
    1,
    27,
    12
  ),
  generateComment(
    'gm-real-busey-evans-7',
    'busey-evans',
    'Christopher BenVau',
    `Great location on campus. Common areas and room was well maintained. Looks like they cleaned them well during the summer, fresh paint and carpets cleaned.`,
    1,
    206,
    14
  ),
  generateComment(
    'gm-real-busey-evans-8',
    'busey-evans',
    'Jocelyn Mateo',
    `Honestly chill not the most social dorm. Better than Hopkins close to main quad`,
    1,
    100,
    8
  ),
  generateComment(
    'gm-real-busey-evans-9',
    'busey-evans',
    'Keyur Patel',
    `Its an all girls dorm but has really nice pasta on Friday.`,
    1,
    293,
    12
  ),
  generateComment(
    'gm-real-busey-evans-10',
    'busey-evans',
    'Rishy Rane',
    `The most underrated dining hall in all of UIUC`,
    1,
    182,
    14
  ),
  generateComment(
    'gm-real-busey-evans-11',
    'busey-evans',
    'Campbell Kraemer',
    `On Fridays this place is good`,
    1,
    206,
    9
  ),
  generateComment(
    'gm-real-busey-evans-12',
    'busey-evans',
    'Jose',
    `Delicious pasta.`,
    1,
    145,
    9
  ),
  generateComment(
    'gm-real-snyder-0',
    'snyder',
    'Macey Moody',
    `While this place is right across the street from the fitness center and has a convenient bus stop, I honestly regret choosing to stay here. Our RAs do absolutely nothing for our "quiet hours." Ive literally been woken up at 4am by screaming neighbors, and absolutely nothing was done about it. I wouldnt really recommend this place to stay, especially if you work all the time and can never get any sleep`,
    -1,
    294,
    14
  ),
  generateComment(
    'gm-real-snyder-1',
    'snyder',
    'Piyush Gandhi',
    `Good dorm facility for UIUC kids. It has bus connectivity to the university and has a huge Gym next to it. The football playground is just down the street.\n\nIf you stay in Chicago land area then the are bus service, Peoria charter, that goes everyday between UIUC and Woodfield Mall in Schaumburg or Oak Brook Mall in Oak Brook. The bus leaves the kids about 3 blocks, armory avenue, from Snyder. It is also a safe place for kids`,
    1,
    234,
    6
  ),
  generateComment(
    'gm-real-snyder-2',
    'snyder',
    'Edward W',
    `Bye bye Snyder!  First year...done.  Awesome location close to everything.`,
    1,
    143,
    10
  ),
  generateComment(
    'gm-real-snyder-3',
    'snyder',
    'Marc Backas',
    `It had some cockroaches in the bathrooms and in the hallways, very rare, but worth mentioning`,
    -1,
    288,
    12
  ),
  generateComment(
    'gm-real-snyder-4',
    'snyder',
    'Erik Beitel',
    `For a good time, call Snyder dial a carol`,
    1,
    58,
    18
  ),
  generateComment(
    'gm-real-snyder-5',
    'snyder',
    'Linda Emory',
    `Good place for food 😋 delivery. …`,
    1,
    66,
    14
  ),
  generateComment(
    'gm-real-snyder-6',
    'snyder',
    'Adam Pedro',
    `Great place to stay`,
    1,
    270,
    19
  ),
  generateComment(
    'gm-real-snyder-7',
    'snyder',
    'monica',
    `my friend lives here`,
    1,
    209,
    11
  ),
  generateComment(
    'gm-real-snyder-8',
    'snyder',
    'delbert ketteman',
    `Helping students move out`,
    1,
    174,
    4
  ),
  generateComment(
    'gm-real-hopkins-0',
    'hopkins',
    'Dhruv Tyagi',
    `Sloppy place for sloppy kidz. The kids here have no respect. They just roll around in chairs and puke in urinals. I dont like this place very much but I live here so Im screwed.`,
    -1,
    108,
    9
  ),
  generateComment(
    'gm-real-hopkins-1',
    'hopkins',
    'Alayna Li',
    `once there was no hot water\nmy friends found a cicada in their closet too 🎻 …`,
    1,
    82,
    18
  ),
  generateComment(
    'gm-real-hopkins-2',
    'hopkins',
    'Cameron Rozek',
    `most mid dorm ever and it smells and the shower gets too hot\n\n-CR`,
    -1,
    221,
    5
  ),
  generateComment(
    'gm-real-hopkins-3',
    'hopkins',
    'LaShaun Price',
    `I took my daughter back  to college from a weekend stay at home 🥰 …`,
    1,
    83,
    8
  ),
  generateComment(
    'gm-real-hopkins-4',
    'hopkins',
    'Matthew McLaughlin',
    `even more classic times`,
    1,
    252,
    16
  ),
  generateComment(
    'gm-real-hopkins-5',
    'hopkins',
    'Viola Kolcan',
    `Great place to live, when studying`,
    1,
    166,
    7
  ),
  generateComment(
    'gm-real-hopkins-6',
    'hopkins',
    'J Johnson',
    `Not too terrible`,
    1,
    299,
    9
  ),
  generateComment(
    'gm-real-hopkins-7',
    'hopkins',
    'Asif Huq',
    `Great place to live`,
    1,
    277,
    4
  ),
  generateComment(
    'gm-real-hopkins-8',
    'hopkins',
    'Hugo Vazquez',
    `The building is outstanding`,
    1,
    93,
    4
  ),
  generateComment(
    'gm-real-hopkins-9',
    'hopkins',
    'Micheal McCann',
    `Old school dorm.  It is what it is`,
    1,
    119,
    15
  ),
  generateComment(
    'gm-real-hopkins-10',
    'hopkins',
    'Rene Lopez',
    `Very big 👏 and nice university, go for it, chapito …`,
    1,
    231,
    2
  ),
  generateComment(
    'gm-real-scott-0',
    'scott',
    'David Earl',
    `Great location, due for some updates.  Insect control isn’t the greatest.`,
    1,
    24,
    3
  ),
  generateComment(
    'gm-real-scott-1',
    'scott',
    'Robbie Plank',
    `Basic Dorm with community bathrooms, always pretty clean. Good location by the recreation center, stadiums, and bus stop.`,
    1,
    67,
    7
  ),
  generateComment(
    'gm-real-scott-2',
    'scott',
    'Emily Dailey',
    `Decent place to live. People have a problem with spilling soup tho 🤔 …`,
    1,
    194,
    3
  ),
  generateComment(
    'gm-real-scott-3',
    'scott',
    'Danielle Cozzola',
    `An older dormitory on campus, but the rooms are pretty big compared other out dated dorms.`,
    1,
    86,
    11
  ),
  generateComment(
    'gm-real-scott-4',
    'scott',
    'ko ko',
    `Noisy, low tier dorm. You can do better for yourself`,
    -1,
    228,
    5
  ),
  generateComment(
    'gm-real-scott-5',
    'scott',
    'Declan Fisher',
    `Wandered here, played ERS, left.`,
    1,
    228,
    11
  ),
  generateComment(
    'gm-real-scott-6',
    'scott',
    'Jerome Williams',
    `Why is this building not condemed?`,
    -1,
    151,
    17
  ),
  generateComment(
    'gm-real-scott-7',
    'scott',
    'Nick Reidy',
    `Place is goated`,
    1,
    232,
    17
  ),
  generateComment(
    'gm-real-scott-8',
    'scott',
    'Ben Ch (bean)',
    `This isnt Scott Hall.  Scott hall is by arc`,
    -1,
    113,
    10
  ),
  generateComment(
    'gm-real-taft-0',
    'taft',
    'Lucas',
    `Absolute beautiful environment and bathroom situation. Shoutout to my nephew, Giovanni Walker!`,
    1,
    210,
    4
  ),
  generateComment(
    'gm-real-taft-1',
    'taft',
    'Greg',
    `I had more fun in Taft Van Doren than I did in my other 78 years combined.`,
    1,
    229,
    10
  ),
  generateComment(
    'gm-real-taft-2',
    'taft',
    'Tu Yiren',
    `worst place I have ever lived in my life. Noise canceling is terrible and neighbors party all day. Now, if ur into parties and the smell of weed I do not stop you. Be ready for door slam at late night since rubber pads are weak/not there. RA is nicd tho, but still would not recommend living here.`,
    -1,
    9,
    10
  ),
  generateComment(
    'gm-real-taft-3',
    'taft',
    'Pope Magiet',
    `For a moment,\n\nBut now... 😾 …`,
    1,
    227,
    14
  ),
  generateComment(
    'gm-real-taft-4',
    'taft',
    'Eva H',
    `The student art was cool. But I really liked the stuff from the ming  dynasty and the old stuff.`,
    1,
    161,
    4
  ),
  generateComment(
    'gm-real-taft-5',
    'taft',
    'Monica Soto',
    `Proud parent of an alumni`,
    1,
    238,
    0
  ),
  generateComment(
    'gm-real-taft-6',
    'taft',
    'James D',
    `Worst dorms on campus, but I had a lot of fun there!`,
    -1,
    214,
    9
  ),
  generateComment(
    'gm-real-taft-7',
    'taft',
    'Falcon',
    `Do yourself a favor and find somewhere else to live`,
    -1,
    156,
    6
  ),
  generateComment(
    'gm-real-taft-8',
    'taft',
    'Krystofer Han',
    `It exists which is pretty cool`,
    1,
    157,
    5
  ),
  generateComment(
    'gm-real-taft-9',
    'taft',
    'Jennifer “Thao” Nguyen',
    `Bathrooms are stellar`,
    1,
    99,
    17
  ),
  generateComment(
    'gm-real-van-doren-0',
    'van-doren',
    'Lucas',
    `Absolute beautiful environment and bathroom situation. Shoutout to my nephew, Giovanni Walker!`,
    1,
    172,
    0
  ),
  generateComment(
    'gm-real-van-doren-1',
    'van-doren',
    'Greg',
    `I had more fun in Taft Van Doren than I did in my other 78 years combined.`,
    1,
    284,
    5
  ),
  generateComment(
    'gm-real-van-doren-2',
    'van-doren',
    'Tu Yiren',
    `worst place I have ever lived in my life. Noise canceling is terrible and neighbors party all day. Now, if ur into parties and the smell of weed I do not stop you. Be ready for door slam at late night since rubber pads are weak/not there. RA is nicd tho, but still would not recommend living here.`,
    -1,
    261,
    8
  ),
  generateComment(
    'gm-real-van-doren-3',
    'van-doren',
    'Pope Magiet',
    `For a moment,\n\nBut now... 😾 …`,
    1,
    240,
    16
  ),
  generateComment(
    'gm-real-van-doren-4',
    'van-doren',
    'Eva H',
    `The student art was cool. But I really liked the stuff from the ming  dynasty and the old stuff.`,
    1,
    53,
    12
  ),
  generateComment(
    'gm-real-van-doren-5',
    'van-doren',
    'Monica Soto',
    `Proud parent of an alumni`,
    1,
    176,
    6
  ),
  generateComment(
    'gm-real-van-doren-6',
    'van-doren',
    'James D',
    `Worst dorms on campus, but I had a lot of fun there!`,
    -1,
    180,
    7
  ),
  generateComment(
    'gm-real-van-doren-7',
    'van-doren',
    'Falcon',
    `Do yourself a favor and find somewhere else to live`,
    -1,
    274,
    4
  ),
  generateComment(
    'gm-real-van-doren-8',
    'van-doren',
    'Krystofer Han',
    `It exists which is pretty cool`,
    1,
    46,
    15
  ),
  generateComment(
    'gm-real-van-doren-9',
    'van-doren',
    'Jennifer “Thao” Nguyen',
    `Bathrooms are stellar`,
    1,
    261,
    3
  ),
  generateComment(
    'gm-real-daniels-0',
    'daniels',
    'Vetri Mahesh',
    `High school students are usually very excited to take the next step forward, but parents are often the ones who feel more pressure and anxiety when settling their kids into a dorm.\n\nI have already reviewed Newman Hall and ISR, where my child previously lived. Daniel Hall is also a very good option. My child stayed here during the summer, and she liked it.\n\nIt is a quiet and cozy place, perfect for focusing and engaging in studies.\n\nI would strongly recommend taking a tour and deciding early before spots are taken.\n\nWhy am I so detailed in my reviews?\nAs a mom, I truly had a hard time finding the right dorm. It was stressful, overwhelming, and emotional.\nI want to share my honest and realistic experience so other parents don’t have to go through the same uncertainty.\n\nAs always, parents—please make sure your kiddo is matched with a compatible roommate. It truly makes a big difference in their comfort, happiness, and overall experience.`,
    1,
    198,
    11
  ),
  generateComment(
    'gm-real-daniels-1',
    'daniels',
    'Penny Christie',
    `My son stayed in Daniels Hall for a semester in 2017 from January to May. He was on exchange from Sydney Australia and stayed on his own in a double sized, carpeted room with a private bathroom. The bathroom had a toilet, shower and a double vanity with storage underneath as well as in the mirror cabinet. There was a large desk with drawers. The single bed had two drawers under it. A tall chest of drawers was also included as well as a small fridge and microwave. The room also included two wardrobes to hang clothes. The students are not provided with any kind of linen so we needed to buy everything including sheets, pillow, quilt and a blanket.`,
    1,
    166,
    16
  ),
  generateComment(
    'gm-real-daniels-2',
    'daniels',
    'Lodger',
    `I have been living at Daniels for about 2 years as an undergrad and I really enjoy it. I live in a single with a private bathroom. The room is spacious (no kitchen in room,) and the bathroom is decently sized. I love being right next to several buses, and an easy 5-8 minute walk to green street.\n\nThere are study rooms on each floor. They are empty a lot of the time so you have a peaceful studying environment. There is also a exercise room on floor 2 and a game room (table tennis) on floor 3. Having an exercise room is extremely convenient, but the equipment is basic.\n\nThe one thing I enjoy most about Daniels is that it is extremely quiet. There are mostly grad students here and everyone minds their business. The only real noises are occasional door slams.\n\nOverall, Daniels is a great place to live. I really enjoy my time here!`,
    1,
    11,
    4
  ),
  generateComment(
    'gm-real-daniels-3',
    'daniels',
    'Alec',
    `Had a great experience living here! Very peaceful and quiet. The one thing that would help though is if each floor had their own water fountains instead of just the water fountains in the lobby areas. Other than that, had a very excellent experience! Clerks and staff are very patient and courteous.`,
    1,
    197,
    7
  ),
  generateComment(
    'gm-real-daniels-4',
    'daniels',
    'Kasia Krakowianka',
    `Decent interior although wall to wall carpeting is dusty and smells. Outdated bathroom. Windiws hard to close and open. Ammenities are ok. Location across the street from the dining hall is a plus`,
    1,
    131,
    16
  ),
  generateComment(
    'gm-real-daniels-5',
    'daniels',
    'John Newcomer',
    `I lived here over the summer.  The staff are pretty incompetent.  It took them 1 week to activate my card properly for the doors.  Perhaps this is an anomaly I dont know... Originally, I signed up for a double, but the setup was terrible.  They put two beds right next to each other on the floor.  Im not into strangers sleeping right next to me.  The single rooms (which I transferred into) are much better, but again, I dont think the staff know what they are doing.  The shower curtain does not match the shower, so every time the shower is used, water pools on the floor and onto the carpet.  The shower head  is designed for elves, I am guessing it is 5 8" tall.  Not a terrible place to stay, but I would not want to live here for an entire semester.`,
    -1,
    235,
    19
  ),
  generateComment(
    'gm-real-daniels-6',
    'daniels',
    'Christina Lopez',
    `Great place to live with large room and semi-private bathrooms. However, dont sign up to live in the basement, there are consistently roach problems.`,
    1,
    118,
    2
  ),
  generateComment(
    'gm-real-daniels-7',
    'daniels',
    'Amitesh Srivastava',
    `You dont have to take meal plans. Big sizes for rooms and your own bathroom. Perfect for a dorm.`,
    1,
    116,
    16
  ),
  generateComment(
    'gm-real-daniels-8',
    'daniels',
    'Katie Richardson',
    `I lived here for two years and loved it. Its quiet, the staff are all friendly, and theres lots of study space.`,
    1,
    53,
    0
  ),
  generateComment(
    'gm-real-daniels-9',
    'daniels',
    'Quinn Calvert',
    `Large dorms, private bathrooms, and a quiet atmosphere make it a great place to live and study.`,
    1,
    7,
    5
  ),
  generateComment(
    'gm-real-daniels-10',
    'daniels',
    'Greg Krawiec',
    `Nice place to visit, but what is more important, my daughter likes it. She lives in Daniels Hall so knows this place better...`,
    1,
    179,
    0
  ),
  generateComment(
    'gm-real-daniels-11',
    'daniels',
    '김중완',
    `Ive lived there 20 years ago, it was old but very quite, this building was for graduate students, still for them?`,
    1,
    110,
    4
  ),
  generateComment(
    'gm-real-daniels-12',
    'daniels',
    'Dana Hilgers',
    `Good suite style rooms. quiet. Good location on green st`,
    1,
    273,
    12
  ),
  generateComment(
    'gm-real-daniels-13',
    'daniels',
    'Jessica Williams',
    `So far, living here looks like it is going to be stellar.`,
    1,
    216,
    0
  ),
  generateComment(
    'gm-real-daniels-14',
    'daniels',
    'Kwame ansah',
    `Very wonderful place to live`,
    1,
    237,
    6
  ),
  generateComment(
    'gm-real-weston-0',
    'weston',
    'Macey Moody',
    `While this place is right across the street from the fitness center and has a convenient bus stop, I honestly regret choosing to stay here. Our RAs do absolutely nothing for our "quiet hours." Ive literally been woken up at 4am by screaming neighbors, and absolutely nothing was done about it. I wouldnt really recommend this place to stay, especially if you work all the time and can never get any sleep`,
    -1,
    222,
    11
  ),
  generateComment(
    'gm-real-weston-1',
    'weston',
    'Piyush Gandhi',
    `Good dorm facility for UIUC kids. It has bus connectivity to the university and has a huge Gym next to it. The football playground is just down the street.\n\nIf you stay in Chicago land area then the are bus service, Peoria charter, that goes everyday between UIUC and Woodfield Mall in Schaumburg or Oak Brook Mall in Oak Brook. The bus leaves the kids about 3 blocks, armory avenue, from Snyder. It is also a safe place for kids`,
    1,
    250,
    7
  ),
  generateComment(
    'gm-real-weston-2',
    'weston',
    'Edward W',
    `Bye bye Snyder!  First year...done.  Awesome location close to everything.`,
    1,
    212,
    12
  ),
  generateComment(
    'gm-real-weston-3',
    'weston',
    'Marc Backas',
    `It had some cockroaches in the bathrooms and in the hallways, very rare, but worth mentioning`,
    -1,
    81,
    4
  ),
  generateComment(
    'gm-real-weston-4',
    'weston',
    'Erik Beitel',
    `For a good time, call Snyder dial a carol`,
    1,
    201,
    2
  ),
  generateComment(
    'gm-real-weston-5',
    'weston',
    'Linda Emory',
    `Good place for food 😋 delivery. …`,
    1,
    114,
    14
  ),
  generateComment(
    'gm-real-weston-6',
    'weston',
    'Adam Pedro',
    `Great place to stay`,
    1,
    80,
    16
  ),
  generateComment(
    'gm-real-weston-7',
    'weston',
    'monica',
    `my friend lives here`,
    1,
    34,
    14
  ),
  generateComment(
    'gm-real-weston-8',
    'weston',
    'delbert ketteman',
    `Helping students move out`,
    1,
    256,
    7
  ),
  generateComment(
    'gm-real-isr-0',
    'isr',
    'khayria abumaye',
    `I wish that I could give this place zero stars. They will try everything possible to take advantage of you and extort as much money from you as possible. Take your money and live somewhere else. Nobody I know that has lived here has had a pleasant experience. Im constantly going back and forth with these people for them over-charging me. Last year they even cancelled my friends lease without telling any of us living with her and were just going to assign a random person to live with us until we threatened legal action. Someones roof caved in on them too last winter. Just do yourself a favor and avoid this place. It is also just unsafe in general since the doors are always unlocked and the spaces are never cleaned. The elevators dont even have inspection certificates inside them. Even for a college apartment this place sucks.`,
    -1,
    202,
    4
  ),
  generateComment(
    'gm-real-isr-1',
    'isr',
    'Isabella Chou',
    `Very sweet gentlemen who fixed the issue of door having a gap and allowing cold air to enter. One of them brought cat treats for the kitties here! I’m very thankful. :)\n\nBut I waited a week after putting the request in, and I was worried about the cold air affecting our electricity bill throughout the week. Hopefully response time can be quicker in the future.\n\nOverall, great service and wonderful people!`,
    1,
    125,
    2
  ),
  generateComment(
    'gm-real-isr-2',
    'isr',
    'Vytautas Zumas',
    `Lived here for 2 years and haven’t had any problems. The only problems that I’ve ever experienced were with the other residents living in the area, either being too loud or dirty. Other than that, the actual building and staff are good and have a good system. Also they have good prices and a good location which helps a lot as a college student.`,
    1,
    244,
    0
  ),
  generateComment(
    'gm-real-isr-3',
    'isr',
    'Ari Belotserkovsky',
    `The employees who work here are wonderful. They are kind and handle day-to-day work pretty efficiently. But, the fact that this business charges a high fee ($600/year) if you do not have a guarantor reduces my rating to 1. Sorry that I do not have family who can sign with me, I guess? Thought maybe I can get someone from out of country to be my guarantor, but turns out the "validation company" requires a SSN. Now Im stuck paying a waiver fee on top of rent. Absolutely absurd and wish this SSN information was provided to me in the lease agreement. Word of caution to all international students.`,
    -1,
    136,
    15
  ),
  generateComment(
    'gm-real-isr-4',
    'isr',
    'Etanm',
    `Pretty underrated place to live tbh. I think they got a flurry of negative reviews when the were doing renovations 2 years ago but theyre a pretty great and relatively affordable place now. Havent had any problems in the 1.5 years me and my roommates have lived here.`,
    1,
    94,
    16
  ),
  generateComment(
    'gm-real-isr-5',
    'isr',
    'Lani kiene',
    `The apartments here are nice, clearly recently renovated and everything works well enough. Maintenance was provided quickly, though I lived here at a chill time. I subleased an apartment over the summer, and it was a pain in the ass to get the leasing agent(s) to do anything to keep the process moving. Multiple passive aggressive calls to the office had to be placed just to get the official lease to be sent out to myself and the subleaser, both who had filled out the necessary applications weeks prior! Staff unassociated with the leasing process and just working the phones/packages are lovely. When the lease was finally provided two days before my move-in, it was incredibly unprofessional/incomplete and didn’t even feel like a legal document (even compared with my First Site lease, an isu leasing company). I do not recommend paying with a check, since one month they lost my roommates check and charged her a late fee and also reported it to the credit bureau. When they found it a week later, they said they didn’t know how to remove the late fee from her account. Yugo has too many hidden fees that are not disclosed of on the lease as well. Before you rent, make sure you check out the underground parking garage. The slope on that thing is so scary`,
    -1,
    123,
    2
  ),
  generateComment(
    'gm-real-isr-6',
    'isr',
    'Desi Stone',
    `Great maintenance and actual apartments. Management seems to always be on different pages than other people in management or each other or something they always seem confused, and the blame or whatever is lost because of miscommunication is absorbed by you, but the apartments themselves are nice.`,
    1,
    293,
    18
  ),
  generateComment(
    'gm-real-isr-7',
    'isr',
    'Meghana Ramoju',
    `DO NOT LIVE HERE. This management of this apartment is inconsiderate, lacks any sort of empathy, and does not care one bit about their residents. They care only about the money they can make. My roommate and I signed here and when we were signing they promised us that we would get most of our preferences matched since we signed VERY early. We left our leasing company with the promise from Yugo that we would have a double layer of security. NOW, after we signed with them they gave us an apartment facing the road without security where anyone walking by can see us. THIS IS NOT WHAT WE WERE PROMISED UPFRONT. They can’t take accountability for their words and do not care for the safety of their residents. Despite expressing our concerns they have dismissed us and said we will try to do something about it. Even in that case, we would have the burden of finding other residents to hand our lease over to. DONT SIGN HERE DESPITE HOWEVER THEY ADVERTISE IT TO YOU!!!`,
    -1,
    146,
    10
  ),
  generateComment(
    'gm-real-isr-8',
    'isr',
    'Isaiah Kuehl',
    `Don’t let the decent rating fool you — this place is chaos hiding behind a clean facade. While the maintenance team deserves all the praise, the real problems lie in management’s complete lack of communication, accountability, and compassion. Imagine coming home to your heat mysteriously cranked up (on your dime), frozen pipes, and not one but two major floods that forced you into hotel living — with no kitchen, minimal support, and still full rent and utility bills.\n\nThe kicker? During finals and graduation, they tried to kick me out of their hotel (which the property owned) just to make more money off the room. Updates were rare, rent was full price, and empathy was nonexistent.\n\nIf you value your money, sanity, and basic housing rights — run.`,
    -1,
    79,
    14
  ),
  generateComment(
    'gm-real-isr-9',
    'isr',
    'Bradley Wassef',
    `Avoid this place at all costs. Management is completely incompetent and unresponsive. The building is extremely old and falling apart. We experienced two floods during our time living there due to infrastructure issues. One of them was so bad it caused a unit’s ceiling to collapse. Hallways and stairwells are constantly dirty and never properly cleaned. Fire alarms would also inexplicably go off at random times. At one point, a bird got into our apartment after a maintenance visit and we couldn’t get a response from management for days. This place is neglected and not worth the price.`,
    -1,
    265,
    3
  ),
  generateComment(
    'gm-real-isr-10',
    'isr',
    'Bernice Vernet',
    `I had a great conversation with the Property Manager, Sydney, this afternoon. Her insight and knowledge of the property and local area was more the helpful. One of the best interactions I have ever had with a property. Thank you Sydney!`,
    1,
    191,
    4
  ),
  generateComment(
    'gm-real-isr-11',
    'isr',
    'Lily Stavropoulos',
    `Unsafe, Unresponsive, and Disrespectful Management\n\nMy time at Yugo South 3rd Lofts has been incredibly disappointing due to serious tenant rights violations, poor communication, and a general lack of concern for residents’ well-being. One of the most alarming issues was management entering my apartment multiple times without the legally required 24-hour notice. This ongoing violation of my privacy left me feeling unsafe in my own home and showed a blatant disregard for Illinois tenant law.\n\nThe parking garage, which I paid for, was unusable on several occasions during the winter due to unsafe conditions. Most concerning, the garage door once shut on the top of my car, posing a serious safety hazard and causing damage—with no follow-up or accountability from management. The building also went nearly a week without running water in January due to frozen pipes, during which time we were told to use a bathroom in the leasing office and communal showers. Meanwhile, maintenance across the building was ignored: trash, food, and even vomit were left in hallways for weeks, and a large broken mirror near the main entrance was left untouched for over two weeks after I moved in.\n\nTo make matters worse, the fire alarms go off randomly at all hours of the day and night—sometimes multiple times in a row—disrupting sleep and creating unnecessary anxiety. These constant disturbances, combined with chronic neglect and poor communication, made living here extremely stressful and uncomfortable. I strongly urge others to avoid Yugo South 3rd Lofts. This building does not meet basic standards of safety, respect, or livability.`,
    -1,
    104,
    19
  ),
  generateComment(
    'gm-real-isr-12',
    'isr',
    'Landon Riggenbach',
    `On our tour we were told many times that the 3 bed 2 bath model would have both bathrooms outside of bedrooms, this was disproved when we arrived.\nFrozen pipes, collapsed ceilings, and stolen property from my car were a few of the biggest issues. No cameras are in the above ground lot which I was forced to pay extra for even though it was agreed I could get the spot for the same price as below ground parking. Unclean stairwells and broken elevators werent uncommon either.`,
    -1,
    222,
    18
  ),
  generateComment(
    'gm-real-isr-13',
    'isr',
    'Aalia Angirish',
    `do not live here!! terrible building infrastructure- there were two separate instances of flooding where a number of residents were displaced from their units. Fire alarms every two days for no reason. bad overall management`,
    -1,
    199,
    14
  ),
  generateComment(
    'gm-real-isr-14',
    'isr',
    'Peyton Kraft',
    `Don’t live here!! This year our pipes froze twice. Then, the pipes burst and flooded our apt. After 2 months, it was fixed. Then, our apartment got flooded again by sprinklers. It happed on a Friday morning and they did not let us know. We came back on a Sunday to everything in our apartment moved and fans!! They don’t communicate anything. We have been told that this is the 7th year in a row that pipes have burst.`,
    -1,
    155,
    10
  ),
  generateComment(
    'gm-real-isr-15',
    'isr',
    'Talia Sriram',
    `I lived here my sophomore year and they definitely have stepped up their management! Maintenance always comes in a timely manner and the staff are incredibly nice. I also like the apartment bonding events they host often to encourage bonding between residents. I would say that South 3rd Lofts definitely improved from previous years and I had a great time living here. Additionally, their apartments are renovating this year and so they will be a lot more innovative and modern. However, my apartment there was still incredibly cozy and convenient for having groups of people over. Definitely consider it!`,
    1,
    10,
    12
  ),
  generateComment(
    'gm-real-isr-16',
    'isr',
    '魏凱莉',
    `I lived here last year and I have never had such a bad rental experience in my life. Dont believe five-star reviews, because they tell residents that leaving five-star reviews will result in rent reduction. Believe me, if the minimum isnt one star, I wouldnt even want to give a star. 1. The place of the room and floor we were assigned were completely different from what we were promised when we viewed the house. 2. Our car was bump in the basement on the day we moved in. After waiting for more than a week to inquire again, we got a bad attitude reply saying that the surveillance camera didnt capture anything. 3. Last year, my home was flooded during a thunderstorm, and I stayed in a hotel arranged by them for a month. The apartment handled things very slowly. 4. To facilitate maintenance personnel, the safety lock is removed and cannot be put back on, which allowing homeless people to sleep in the stairwill, which is extremely unsafe. 5. The smoke detector would beep at any time for a while, several times even in middle of the night, without any explanation and apology. 6. The staff will enter your home without notice for next years renovation, and they will still smoke in your home. They showed no privacy and are rude. 7. Something happened that can only be said to be unfriendly to pets. 8. I am an international student. I dont know if this is normal, but the charging utility company that cooperated with them estimated in advance the utility for the two months before I moved out and charged them, but the company and the apartment did not notify us that we had to apply for a refund for the overcharged part within 14 days. As a result, my roommate and I were overcharged for more than 200 dollars in utility bills with no way to refund (we are not even in the United States).`,
    -1,
    129,
    17
  ),
  generateComment(
    'gm-real-isr-17',
    'isr',
    'Edison T',
    `Please avoid renting this place!!! I lived here for a year and it was a disaster. If there is an option to not give stars, they must not even deserve one.\n1. Don’t believe too much in the five-star reviews here because they tell residents that they can reduce their rent if they leave a five-star review.\n2. There are very big concerns about safety. Most of their doors have no safety equipment, which means that anyone can enter the atrium and basement. There were even homeless sleeping in the stairwell.\n3. During the year I lived there, the repair work throughout the building never stopped. I was even asked to move out of my apartment and temporarily live in other apartments owned by their company (due to flooding caused by their negligence).\n4. Most of their staff have good attitudes, but some of them are very rude in their communication. One man in particular who always wore a cap (probably the maintenance guy but not the guy with the big beard and glasses) was very rude and disrespectful.\n5. The fire alarms in the entire building often go off for no reason, even in the middle of the night, which is very disturbing to peoples daily routine. I have never received a reason or apology for the random alarms.\n6. Anyway, please read the reviews before signing the contract. Maybe they will improve it after the renovation is completed, but these are terrible things from my personal experience of being here for a year.`,
    -1,
    96,
    7
  ),
  generateComment(
    'gm-real-isr-18',
    'isr',
    'Dylan Taglang',
    `I lived here for a year and Im telling you avoid living here at all costs. First, they have rats in the walls. They also enter your apartment without even knocking while your sleeping (not safe). The fire alarm went off at random times 20-30 times before they tried to get it fixed. My roommate and I needed our dryer fixed in March and no one ever came to fix it and and our lease just ended.  When my roommate and I walked into our apartment for the first time we found left over food and many things in the apartment that were broken.`,
    -1,
    298,
    2
  ),
  generateComment(
    'gm-real-isr-19',
    'isr',
    'Joseph Cahill',
    `My son and roommates lived there for 1 year, moved out and left the place spotless.  Yugo claimed smoke damage to the walls and charged us to have the place repainted.  No smoking happened, no fire, nothing.  The showed us no evidence - no photos, no video, nothing.  Also oddly, no smoke damage to cloth furniture or beds?  But to the walls?  they threatened credit damage if we didnt pay.  This felt like extortion -DO NOT RENT HERE!!`,
    -1,
    123,
    13
  ),
  generateComment(
    'gm-real-isr-20',
    'isr',
    'Declan Fisher',
    `Found broken glass on my floor when I arrived. Definitly hadnt been cleaned. Lots of flies in the cupboards. Complex flooded... multiple times. Garbage not managed well.`,
    -1,
    125,
    14
  ),
  generateComment(
    'gm-real-isr-21',
    'isr',
    'Dawn Haken',
    `AVOID THIS LEASING AGENCY.\n\nI was given an eviction notice due to unpaid rent. In fact, my apartments rent was paid completely - we turned in checks on time. The manager had not showed up to work for 2 weeks, and according to the employees, no one else can cash checks. So they know they had our checks but we got late fees and an eviction notice anyway.\n\n$600 of damage fees were initially applied on our move-out statement, and when we asked for justification, the fees were waived. So obviously, they had no actual reason to charge us. 60 days and countless phone calls and emails to different people, and still no portion of the security deposit has actually been sent to us.\n\nApartment was filthy at move-in, broken glass and trash on the floor. Furniture was broken and took weeks to replace, and one bed was replaced with a slightly less broken bed from another unit. They argued very hard to try to get us to sign a new utilities addendum which would have lost us money. Heating system broke down and was stuck on and apartment temperature reached over 90F multiple times, thermostat was eventually replaced.\n\nSometimes they just dont deposit the checks we give them, and charge late fees, and then myself or roommates have to go to the office multiple times to get them to remove the fees. I was told to "not pay too much attention" to my account records before a certain date, because they were "totally messed up". I am not at all confident that Midtown handles finances competently or correctly.\n\nWater leaked in from outside, under my bedroom wall, and soaked my carpet. Their solution? Leave a large, extremely loud industrial dehumidifier and blowers in my room for days. This happened twice before they fixed the wall. I could not sleep or study in my room for 8 days/nights in total.\n\n"Emergency" maintenance can take hours to respond and sometimes no response is given without a second call. Emails are never answered. They never remember anything asked in person in the office.\n\nThe property looks nice, but is cheaply constructed and not maintained. Bike racks are totally overcrowded. They don’t clear snow. Find somewhere else - rent here is way too high and you will spend too much time trying to get things fixed.`,
    -1,
    10,
    1
  ),
  generateComment(
    'gm-real-isr-22',
    'isr',
    'autumn wallis',
    `Been living at this building for 3yrs now and ever since Yugo bought this building it’s been an absolute nightmare. Pipes burst and flooded my apartment so 5 months of my lease were spent in a hotel room owned by the same company with every outlet on one circuit so I couldn’t even plug in a desktop computer without blowing a fuse. After my apartment was “repaired” they moved me in before it was finished. Furniture was all temporary, washer & dryer not plugged in, lights in the kitchen all flicker when oven is turned on, blinds were missing from bedroom & living room windows, etc. Two weeks into being back only 1 of these issues was fully resolved and that was getting the washer & dryer plugged back in. The building manager is completely inexperienced and is either unwilling or unable to handle situations that arise/Can’t hold adult conversations so if you have any frustrating issues with your lease or apartment you’re out of luck. If you want to lease with this company I recommend having a good lawyer on standby.`,
    -1,
    87,
    6
  ),
  generateComment(
    'gm-real-isr-23',
    'isr',
    'Gabriella Dumo',
    `I do not recommend living at South Third Lofts. When I moved in, my unit smelled like cigarettes and was dirty. The management is not good, does not understand communication, and is constantly changing. Most of the positive reviews were left by people who work for the building and do not accurately portray South Third Lofts.\n\nThe apartment itself is fine, however it is not worth the constant issues that the management causes. Not to mention, the rent payments are always higher than as promised which leads to more avoidable problems. Trying to get help with anything rent or lease related is a nightmare because the people in the office never seem to know the answer.`,
    -1,
    188,
    13
  ),
  generateComment(
    'gm-real-isr-24',
    'isr',
    'Ryan Manahan',
    `The issue wasn’t fixed. We were told the the ac is always stuck on even though in the previous days we have been able to turn it off and on when we wanted to.`,
    -1,
    245,
    6
  ),
  generateComment(
    'gm-real-isr-25',
    'isr',
    'Erin',
    `Don’t move here. Don’t live here. Just don’t. Maintenance requests might as well not be made since they don’t do them even if you ask again and again. Insulation is so terrible that the windows froze over ON THE INSIDE and condensation causes mold. Basically no ventilation so the apartment is always stuffy. The laundry machine is horrible. Apartment feels like it was put together by Ikea manuals and things break all the time. Don’t move here. If I could give zero stars I would.`,
    -1,
    78,
    9
  ),
  generateComment(
    'gm-real-isr-26',
    'isr',
    'JA',
    `Save yourself the trouble and do not live here. Management and staff is really condescending when I had any questions or concerns. There were charges added to my account that I had to call and get taken off because the lease stated I did not owe anything. Felt unsafe when maintenance staff came to my door without being called and without warning, wearing plain clothes and no uniform, after the office had closed and asked to look in my room. Then was scolded by manger for not letting random men into my apartment with no identification after hours!!\nWhen I finally was able to move out, took actual months to get my security deposit back since they said the post office lost my check. But they kept giving excuses for weeks as to why they were not reissuing a new check. It was a new excuse every time I called. They only sent me a check after I filled an official complaint and talked to a lawyer. Big surprise, after that it only took 1 day to get my money. If you do end up living here (avoid at all costs is my recommendation) make sure you do not set up automatic payments, and always check your account for random charges, because good luck getting a refund after they overcharge you.`,
    -1,
    99,
    4
  ),
  generateComment(
    'gm-real-isr-27',
    'isr',
    'Brianna Legner',
    `So far I have had a great experience at Midtown Loft. I love my apartment! It is a great location right across from the park and county market and close enough to Green Street where I feel apart of campus but far enough away from all the noise. The newly remodeled common area is so sleek and cozy!\nWhen I first moved in the fridge was not properly temping. I made the management aware and within an hour the maintenance brought me a brand new fridge that works great!\nThe staff have been very nice and helpful and I think it will be a great year!`,
    1,
    98,
    3
  ),
  generateComment(
    'gm-real-isr-28',
    'isr',
    'Melanie Brianne',
    `I don’t recommend living here! I signed with CPM and halfway through my lease Midtown Lofts acquired the building. They would put extra charges on my account and when we would go to the office to dispute them they would tell us oh don’t worry about them, but why post them to the account? Luckily I did not have automatic payments set up, but some of my neighbors did and got charged without even knowing until it was too late! I moved out August 8th, and have been battling with management for over a month to get my security deposit back. It wasn’t until I threatened them with court that they finally sent my deposit back. There are so many better choices on campus to live with much better, NICER management! Ryan, the property manager, is extremely rude and unprofessional. These people will try to take advantage of college students. Don’t live here`,
    -1,
    291,
    4
  ),
  generateComment(
    'gm-real-isr-29',
    'isr',
    'Shahnoor Shahzad',
    `Save yourself! Do not lease from Midtown Lofts. The customer service is extremely unprofessional and the management lacks communication. They do not care for their tenants. My experience with Midtown Lofts has made me question moving into the dorms. I signed a lease with them this past academic year, but due to unforeseen medical circumstances, I had to transfer schools (it is completely within my right to cancel a lease, given I provide proper reasoning and timeline, which I did)  I had contacted them speaking about how I needed to get out of the lease far prior to any lease cancellation deadlines, and while they claimed my issue was resolved, I was contacted again a week ago, this time with a $3,000+ balance on my account. I have not set foot in this apartment. They are forcing me to pay a balance for an apartment I have not leased. The person I spoke to was extremely unprofessional as well. Do not subject yourself to this type of customer service. I assure you there are much better living options in Campus-town.`,
    -1,
    56,
    8
  ),
  generateComment(
    'gm-real-isr-30',
    'isr',
    'Karl Brown',
    `When I moved in, my apartment wasn’t ready and the staff was unorganized & short handed. However, throughout my lease term the staff has gotten much better with taking care of issues and maintenance has been efficient. It seem like Midtown has made major improvements with satisfying residents needs.`,
    1,
    69,
    0
  ),
  generateComment(
    'gm-real-isr-31',
    'isr',
    'Katelynn Moser',
    `I lived with Midtown Lofts from February to August and my roommate and I had so many issues while living with them. First, the manager, Ryan yelled at my roommate and I for asking a question in his office, saying we were rude and disrespectful to think he would have the time to talk to us. We tried to have subleasers rent our apartment for the summer and they were not helpful at all. We would try calling and they were never available to help. Our balcony neighbors had a table outside, so Midtown Lofts charged us $50 until we took a picture and showed them that we did not put the table outside. All year before Midtown Lofts took over the building which was previously owned by CPM, I was paying rent online so I did not need checks. A day before March rent was due, Midtown Lofts says they will only except hand written checks and payments made late will be charged with late fees. So, I had to miss class and go to the bank so I could get checks to pay my rent. My roommate had a care package that midtown lofts would not let be delivered to our door for 2 weeks and never notified us that it was there. This company has NO customer service skills at all. They act as though they are flexible with students but they are not. I had so many issues living with them and they were so unhelpful with solving all of them.`,
    -1,
    89,
    14
  ),
  generateComment(
    'gm-real-isr-32',
    'isr',
    'Rishi Patel',
    `Everyone needs to read this review this instant. My 3 roommates and I signed with CPM and unfortunately the management of Mid Town lofts took over. I never understood how a managing crew could be so useless to their customers. First, on move-in day we had no doors. My parents and my roommates parents were absolutely blown because what kind of apartment doesn’t have DOORS TO THE ROOMS. The manager explained that the people who used to live here trashed it and the doors would be replaced. Keep in mind this was late August. My friends, it is late September and we still do not have doors. Every time me and my roommates go downstairs to talk to the manager or staff they turn into mimes or lie about when the doors are coming in. Not to mention they almost fined me on rent day because they claimed they didn’t get my check, but put my check under the wrong name. Guys, do yourselves a favor and do not sign here. It will be the best decision of your lives and pay the extra $200 to live at GST or 212. If i don’t get doors in my apartment in the next two days i am bringing absolute war to this staff.`,
    -1,
    31,
    16
  ),
  generateComment(
    'gm-real-isr-33',
    'isr',
    'Morgan',
    `Definitely needs to be shut down. They actively hide problems (see pictures) and don’t know how to handle money. I had many other issues but here are the main two:\n\nIssue #1: They actively hide problems.\nThe mailbox was broken to where anybody could open up an entire section of mail. I brought this up to them. They said they knew, said “Don’t tell anyone”, and that they’d fix it eventually. They didn’t take out the unsecured mail and store it in their locked office… they knew it was broken and actively left it out. (Photos attached for proof). The elevator was also past due for inspection for months when I was living there.\n\nIssue #2: Mishandling Money and Threatening Residents\nI lived there for a year and they were constantly saying we owed money when we didn’t. I asked them to prove where charges came from, they couldn’t, but still said we owed money. I eventually gathered the proper expenses myself, calculated everything, and it turned out that THEY owed US money. Ridiculous.\n\nRecently got an email from “South 3rd Lofts”. Seems like they’re trying to change their name to hide from the bad reviews.`,
    -1,
    121,
    0
  ),
  generateComment(
    'gm-real-isr-34',
    'isr',
    'Gabby Urbonaite',
    `I signed with CPM originally last year and then Midtown Lofts took over in the middle of February. From the moment they began managing the property my roommate and I had countless issues. First, instead of emailing us information they would waste hundreds of pieces of paper and post notices on our doors even if it didn’t apply to us. Second, they continued to be unhelp and proceeded to make everything harder than it needed to be by not allowing delivery services such as UPS, USPS to deliver packages directly to our doors. Instead they insisted on keeping the packages at the main office and refused to call us when a package arrived. They stated that we should check and see when our things have arrived and then come down which just made the whole process more complicated. For 2 weeks I had a care package sitting in their office with food inside since nobody bothered to tell me until the sender notified me. Next, we were charged $50 for having indoor furniture outside on our balcony when, in fact, it was our neighbors, with whom we shared the balcony with, that had their furniture outside. They didn’t even bother to check before charging us. Finally, we went down to the main office to inquire about how to begin the subleasing process for the summer. Ryan, the property manager, stated that he did not have time to help us and said that we were being “very disrespectful” to assume he was available to assist us. He went on to explain how my roommate and I were being very rude to think he could take time out of his busy schedule to help. I have never been more disrespected by someone who claims to represent a company whose goal to provide “excellent customer service”.`,
    -1,
    111,
    4
  ),
  generateComment(
    'gm-real-isr-35',
    'isr',
    'Daniel Cahill',
    `When I needed maintenance assistance in my apartment, George (one of the maintenance staff ) showed up in a timely manner and could not have been more helpful. He was polite and solved all of my issues with ease. People like that make me glad I live here!`,
    1,
    176,
    12
  ),
  generateComment(
    'gm-real-isr-36',
    'isr',
    'Nirmal Kathiravan',
    `Management is super nice and gets maintenance requests done in a timely manner. Had an issue with lease renewal however it was fixed within a few days. Apartments are really nice as well and its been a pretty good experience.`,
    1,
    148,
    17
  ),
  generateComment(
    'gm-real-isr-37',
    'isr',
    'Daniel P',
    `When I went to go tour this place last year the guy basically lied through his teeth about amenities and the plans they have for the building. They care about getting you to sign a lease. Dont trust anything that the person whos giving a tour says if you look at the apartments here.\n\nThere appears to be high turn over. Staff dont care. Building manager is not accountable. He prefers to say something like "oh, Im sorry to hear about your bad experience. Let me deflect the blame onto our corporate office blah blah blah." Then they wont give you contact for corporate.\n\nI am currently a tenant here. You should sign a lease somewhere else. Theyre under new management this year, but its still bad. I overall agree with the other negative reviews.`,
    -1,
    261,
    8
  ),
  generateComment(
    'gm-real-isr-38',
    'isr',
    'Wil Burns',
    `Im writing this review as the parent of a UIUC student that lived in this complex in the past year. First of all "lived" is a bit of a misnomer. Very early in her tenure there, the building suffered major water damage, most likely largely a function of years of negligence in maintaining the place from my survey of the buildings (and I have expertise in this context). She was then shuttled from hotel to hotel, because the Yugo either couldnt, or chose not to, secure longer-term contracts for the students. This was severely disruptive to her studies. NEVER did the facility apologize, or adjust the rent of the students, despite clearly violating the warranty of habitability in Illinois.\n\nI also found the staff alternatively dismissive or rude in terms of virtually every inquiry. The facility is now in total disarray, theres lots of construction going on, and this is late July. I suspect that if you move in in August, youll be subject to constant noise, and perhaps youll be lucky enough to get moved around.\n\nTo put it mildly, NO ONE should consider this apartment "option."`,
    -1,
    106,
    5
  ),
  generateComment(
    'gm-real-isr-39',
    'isr',
    'Caden Hall',
    `The new management at Midtown has done an amazing job of improving this living community. Rent is a great price, they’ve offered amazing promotions, and they’ll help you with any issue you might encounter. With renovated units, it’s a great living space for students and grads like myself.`,
    1,
    278,
    16
  ),
  generateComment(
    'gm-real-isr-40',
    'isr',
    'Abby Hutter',
    `This has got to be the worst apartment you can live on campus. They do not care at all about their residents. They messed up scheduling for basement repairs where the parking garage is, and now all residents who pay $50 a month for a spot have nowhere to park for an entire week, and the apartment is not offering any other alternatives. If you need maintenance done in your unit, you have to wait at least two weeks for them to figure something out. Property manager is never able to answer any questions because shes never there. The parking garage is also a death trap for both people and vehicles. My roommates and I have packages stolen at least once a month. Do not lease from here.`,
    -1,
    43,
    3
  ),
  generateComment(
    'gm-real-isr-41',
    'isr',
    'Sydney Rivers',
    `Thankful to this property as this was my first time renting an apartment. The renovations are beautiful and I love having a balcony so close to campus. Maintenance and the office staff were super helpful during my stay`,
    1,
    123,
    11
  ),
  generateComment(
    'gm-real-isr-42',
    'isr',
    'Ava Illinois',
    `Dont rent here. Ever. I cannot stress this enough. Theres been bloody puke in the hallway for the last month. Dryers been broken for four months. Put in several work orders; theyve told us four or five times a new dryer would "be here next week," but somehow next week has never come. If you have two people in a room, they charge a "double occupancy fee" of $100 over base price. They dont have time to fix my dryer or clean the blood-puke, but they have plenty of time to host "Waffle Wednesdays!"\n\nThe place has changed its name twice since I moved in, if that tells you anything. Please, dear God, if you do yourself one favor in your college apartment search, heed my warning:  do not rent here.`,
    -1,
    259,
    12
  ),
  generateComment(
    'gm-real-isr-43',
    'isr',
    'Raj',
    `The new management is as garbage as the old one. You will have to be very desperate to stay here. Dont get lulled into a sense of security by the sweet talking staff or the decent rooms. These jerks cancelled our lease out of the blue, saying that they could not sign one for us as they had no apartments left. This was AFTER we signed the bloody lease. They will then cite their terms and conditions. I am appalled on how they have shown absolutely no care for the state of the consumers. Absolute lack of compassion.`,
    -1,
    170,
    8
  ),
  generateComment(
    'gm-real-isr-44',
    'isr',
    'Radha Patel',
    `Under the new management, things have really improved. Our maintenance requests get fulfilled quicker now too. Our unit has new furniture and the loft style apartments have nice high ceilings.`,
    1,
    199,
    12
  ),
  generateComment(
    'gm-real-isr-45',
    'isr',
    'Amanda Lam',
    `I was signed with CPM before Midtown Lofts had taken over this apartment complex and I am completely appalled by how they are handling things. Customer service is very inconsistent, ranging from representatives that give extremely different answers to being very dismissive of customer concerns. Moreover, those that signed with CPM were E-MAILED about an early move-in fee (which was not included in the lease) just a little over a week before the early move-in date. The calculations of the fee were to be split evenly between all roommates as if everyone was moving in on the same date, but of course it is unfair to those that dont. Be cautious when renting here.`,
    -1,
    134,
    13
  ),
  generateComment(
    'gm-real-isr-46',
    'isr',
    'Serena Jackson',
    `I haven’t had any major issues since I’ve moved in aside from some maintenance requests taking longer than normal. I really love the jetted tub, it’s one of my favorite features. Rates were pretty reasonable so I would recommend living here.`,
    1,
    265,
    1
  ),
  generateComment(
    'gm-real-isr-47',
    'isr',
    'Tom Bergström',
    `Ive also received the made up damage charges. And management refuses to answer emails about it. We were lucky to get a good unit, there were only a few broken/loose things when we moved in. We fixed them ourselves. The place was in great condition when we moved out. Spotless. Now they think were going to pay 1500 bucks in made up damage charges, with no explanation or any proof. Heck no. Im in contact with lawyers about it now.\n\nThis is such a shame since the staff on site are so nice. The maintenance guys are great.\n\nI though it wouldnt be as bad to live here as the reviews here on Google made it out to be. I was wrong. Great job Midtown Lofts at proving all these people right. Your ways of doing things are distasteful. Appalling really.\n\nIf this was a mistake, please try to set things right asap. If not, seriously think about what you are doing to these poor college kids.\n\nIll be in touch.`,
    -1,
    279,
    9
  ),
  generateComment(
    'gm-real-isr-48',
    'isr',
    'Joey Zilber',
    `DO NOT LIVE HERE THIS PLACE IS A SCAM. SAVE YOUR TIME, MONEY, AND EFFORT AND FIND A NEW PLACE BEFORE YOU GET SCREWED OVER. I’m surprised this place is still in business and hasn’t been sued yet concidering their reputation and things they have done. SAVE YOUR MONEY AND TIME PEOPLE, these reviews are here for a reason. We had a 3 bedroom room (secured) in the middle of first semester and end up getting an email saying we don’t have a room available anymore in the middle of second semester. This means when we could have gotten a good deal on a different apartment we now are stuck with crazy prices and bad location all because MIDTOWN LOFTS screwed us over. READ THE COMMENTS, there are real and here for a reason. Don’t get scammed like us.`,
    -1,
    254,
    16
  ),
  generateComment(
    'gm-real-isr-49',
    'isr',
    'Ellissoide Rotondo',
    `Not recommended at all.\nMy main issues with this place:\n1: the building is poorly designed, and certain bedrooms get no natural sunlight during the day. I had to work remotely with my light turned on all day for a full year. Not pleasant.\n2: the management is usually not very helpful. If you have easily fixable problems (broken lightbulb, etc.)  they will usually fix that within a couple days, but anything bigger than that can be a nightmare. Example: both the washer and the dryer where not working properly when I moved in (washer was leaking, dryer would randomly stop working in the middle of a cycle). It took about six months to fix the washer, and a whole year to replace the dryer, despite frequent requests to the office.`,
    -1,
    125,
    9
  ),
  generateComment(
    'gm-real-isr-50',
    'isr',
    'Hank Hill',
    `The manager who works there does not even deserve to be called a manager. He lacks the organization, care and respect for tenants that a manager needs to have for a rental property. When I went in at 9 A.M. on a summer day, I spoke with Ryan (the manager) to have him call me to have access to my account so i could pay rent online. He actually PROMISED me that he would call me by 12 P.M. to have the issue resolved. In classic Ryan fashion, he failed to call me at all and when I came into office at 4:30 P.M. and confronted him about it, he went into a state of anger and threatened to cut access to my account (which Im sure is illegal). Real classy Ryan. Secondly, they took off approximately $400 dollars off the security deposit when my roommate and I spent 7 hours cleaning up the apartment to the best of my ability. Ryan will probably try to act nice towards you and may seem like a kind caring manager, but in reality, hes a terrible person. All in all, I HIGHLY RECOMMEND that you do NOT lease with Midtown Lofts.`,
    -1,
    207,
    12
  ),
  generateComment(
    'gm-real-isr-51',
    'isr',
    'Ravi Ranganathan',
    `For everyone that has thought about filing a lawsuit against this leasing company - Im doing it. If you want in, I will gladly take any information that would help the suit - photos, false charges, etc. Beyond done at this point - they sent false information to a collections agency based an accounting error on their behalf. Now I cant buy a car because I cant get financing.\n\nRegional manager is also crazy. Their "corporate network" is extremely unprofessional and this is the worst experience I have had with a leasing company every.`,
    -1,
    289,
    13
  ),
  generateComment(
    'gm-real-isr-52',
    'isr',
    'Nicole Hruby',
    `I put in for maintenance at around 11 pm on Wednesday evening. The next day my door was fixed! The maintenance team at Yugo is amazing and I could not recommend this complex enough!`,
    1,
    124,
    12
  ),
  generateComment(
    'gm-real-isr-53',
    'isr',
    'AJ Johnson',
    `I would seriously beware of renting here. I was a resident when CPM was in charge of the building and I had no issues and CPM’s communication was excellent. However Midtown Lofts is a different story. Sadly I signed another lease with them before realizing how much of a nightmare they are. I would really recommend that you do not rent here! I could write a book on the issues I have. Poorly managed. Ryan the manager is very very  unprofessional and rude.`,
    -1,
    49,
    11
  ),
  generateComment(
    'gm-real-isr-54',
    'isr',
    'Ned Ellis',
    `Have had some rough patches in the past but as a "long term" resident I definitely see that they are trying to improve. I really appreciate how available their maintenance has been even during the COVID-19 lockdown has been, Josh was able to replace my blinds within a week and has always responded to any requests within a day. If they could take the rent down by about $100 a month, and the management does not change, then I would certainly recommend signing a lease. The internet is also best in class, free for about 100MB/s up/down`,
    1,
    226,
    1
  ),
  generateComment(
    'gm-real-isr-55',
    'isr',
    'Khaylan Foy',
    `The new property manager Lisa Laur is the most unprofessional manager that I have ever encountered. She had an attitude, raised her voice, and also used profanity when having a conversation. Under her management I will never renew a lease here and will be leaving as soon as my lease is up. Without meeting me or my other roommate of color, we were considered “bad” compared to our other caucasian roommate.`,
    -1,
    237,
    13
  ),
  generateComment(
    'gm-real-isr-56',
    'isr',
    'Siddhant Sharma',
    `Originally this place was just alright. But after a change of management, this place has become an apartment building worthy to call home. The management has brought a new sense of community that was earlier missing from this complex. Having a great time living here !`,
    1,
    4,
    5
  ),
  generateComment(
    'gm-real-isr-57',
    'isr',
    'Anena Majumdar',
    `Best place for students! They respond to maintenance requests very quickly, they’re efficient in terms of administration and they collect your packages on your behalf. Location wise, you’ll not get a better place. It’s a good place for grad students too.`,
    1,
    61,
    0
  ),
  generateComment(
    'gm-real-isr-58',
    'isr',
    'James Romans',
    `Had two major items stolen from me. My bike was cut from my porch and watch was stolen as my roommate moved out. I have never paid this much for power. Theyll give your keys to your roommate and put power in their name if you ask.`,
    -1,
    262,
    14
  ),
  generateComment(
    'gm-real-isr-59',
    'isr',
    'Maria Brynza',
    `Awful place. Impossible to get in touch with management, and the office in general. Staff working there barely know where the place is located. They add extra bills to your monthly rent even though they are supposed to be covered by the lease which they claim is right, but then still fail to remove the bills. This place needs to get shut down. Do not live here, I guarantee that you will regret it. I do.`,
    -1,
    41,
    13
  ),
  generateComment(
    'gm-real-isr-60',
    'isr',
    'Sade Dozier',
    `My experience with Midtown hasn’t been as terrible as these other reviews. The rent is affordable and inexpensive for being so close to Green st. The office staff is very hands on and tries their best to communicate what is to be expected.`,
    1,
    126,
    14
  ),
  generateComment(
    'gm-real-isr-61',
    'isr',
    'Phish Rodham',
    `Do not rent here. You will find disgusting trash on your deck, construction noises at 6am and filthy unusable bathtubs and sinks. Watch the management give this review a generic response like all the rest of the reviews.`,
    -1,
    189,
    16
  ),
  generateComment(
    'gm-real-isr-62',
    'isr',
    'Ethan Truong',
    `The maintenance worker, George, was very efficient and professional. He helped fix the shower, and routinely comes in to address our concerns with the apartment. Thanks`,
    1,
    131,
    15
  ),
  generateComment(
    'gm-real-isr-63',
    'isr',
    'Abishek Venkit',
    `Echoing other reviews, DO NOT LIVE HERE. Terrible management, terrible experience. They overcharge you for utilities, do not do any renovations that are promised, and have terrible service. The water has gone out and the roof has partially collapsed. Save your money, rent somewhere else.`,
    -1,
    43,
    19
  ),
  generateComment(
    'gm-real-isr-64',
    'isr',
    'Sandeep Gorantla',
    `Very satisfactory with my move in. The building management is quite responsive and kind and helpful.`,
    1,
    103,
    11
  ),
  generateComment(
    'gm-real-isr-65',
    'isr',
    'Jason Shannon',
    `wow this place sounds like an absolute tragedy. If I were some of these people I dont think Ryan would have any teeth left. Overcharging people? Not informing people of arrived packages? Slow maintenance? Asking for help is considered disrespectful? I hope people see these reviews and pass just like myself and many of my roommates.`,
    -1,
    18,
    2
  ),
  generateComment(
    'gm-real-isr-66',
    'isr',
    'Mario boyas',
    `I have been trying to contact someone for the past 3 DAYS with calls, voicemails, and emails (i even tried Facebook thats how desperate i was) With no success. All i had was a simple question, but due to this poor, irresponsible service i want more then a questioned answered. I want a apology not only to me, but everyone having this problem. I know people that use to live there that still havent gotten a response on emails for MONTHS. Its just disrespectful to everyone. They claim to " take(s) pride in delivering service with excellence and is in the process of addressing resident issues," but here we all are addressing issuing that they seem not to care about. If they really cared as well they wouldnt have less then 2 stars here.`,
    -1,
    208,
    2
  ),
  generateComment(
    'gm-real-isr-67',
    'isr',
    'Brittany Miller',
    `I love living here. I enjoy my own space upstairs in the loft area. I would recommend living here. Maintenance is also timely and helps a lot.`,
    1,
    236,
    2
  ),
  generateComment(
    'gm-real-isr-68',
    'isr',
    'Ruchi Gupta',
    `Can someone  please share management contact number to get the attention. AC is not working. Windows are not opening. Getting same update from the manager from past 3 hrs maintenance guy is on his way he will get there.`,
    -1,
    144,
    8
  ),
  generateComment(
    'gm-real-isr-69',
    'isr',
    'Maha H',
    `Midtown Lofts was overall an okay apartment, decently spacious. Although the staff was friendly, they often seemed like they did not have time to manage all of the maintenance requests.`,
    1,
    267,
    6
  ),
  generateComment(
    'gm-real-isr-70',
    'isr',
    'Nataly Quito',
    `What I hated is that Midtown Lofts bought the apartment complex on 3rd without even notifying the residents about it until late summer, since it used to be CPM that owned it. They are SO LATE in giving details and its a mess. Literally I dont even know how to set up a rent payment yet or any details on the move in process... and its a week before classes begin :/`,
    -1,
    249,
    12
  ),
  generateComment(
    'gm-real-isr-71',
    'isr',
    'V.A.',
    `I love living at Midtown Lofts. The staff are very helpful and I love the activities and contests that they set up for us as residents! Price point is great as well.`,
    1,
    75,
    19
  ),
  generateComment(
    'gm-real-isr-72',
    'isr',
    'Karolina Urban',
    `I lived here 2 years ago and it was the worst place I could have chosen. The combination of the gross apartment, mold, water leaking from our bathroom ceiling, terrible management, struggling to receive our security deposit back. Never sign here.`,
    -1,
    85,
    2
  ),
  generateComment(
    'gm-real-isr-73',
    'isr',
    'Hoang Le (Austin)',
    `better than most places around here to be honest.`,
    1,
    261,
    8
  ),
  generateComment(
    'gm-real-isr-74',
    'isr',
    'Thomas Shultz',
    `It’s a great place to live. Super awesome maintenance staff and friendly management. I never really had any major issues and it’s a great price for what you get.`,
    1,
    68,
    19
  ),
  generateComment(
    'gm-real-isr-75',
    'isr',
    'Jesus Flores',
    `This place doesnt even have a functional fire alarm. Always starts going off without warning, causing the entire building to leave the place and wait for the fire department only to learn its a false alarm. This cant possibly comply with regulations...`,
    -1,
    152,
    5
  ),
  generateComment(
    'gm-real-isr-76',
    'isr',
    'Tanner Murphey',
    `Lived there with both CPM and Midtown, somehow these people made me miss CPM, very rude and incompetent, constantly losing records and taking weeks to do any repair no matter how minor\n\nTheyre also harassing my roommate for unpaid damages/utilities.....in an apartment he didnt even live in`,
    -1,
    234,
    16
  ),
  generateComment(
    'gm-real-isr-77',
    'isr',
    'Ray Welch',
    `Their incompetence is unmatched.\n\nSave yourself from being overcharged ($ THOUSANDS above contract agreement) for some of the WORST customer service youve ever seen.`,
    -1,
    184,
    1
  ),
  generateComment(
    'gm-real-isr-78',
    'isr',
    'Yutong Qiu',
    `The building management is very enthusiastic, and the apartment was newly renovated this year, and the maintenance is very timely.`,
    1,
    43,
    18
  ),
  generateComment(
    'gm-real-isr-79',
    'isr',
    'Evelyn m',
    `Front desk is great! And the living space for 4B 2BA is very spacious ! Would recommend you live here.`,
    1,
    186,
    0
  ),
  generateComment(
    'gm-real-isr-80',
    'isr',
    'Angela Creely',
    `I had a great experience at Midtown lofts! For the cost, it was really nice and spacious and maintence was always really quick.`,
    1,
    59,
    4
  ),
  generateComment(
    'gm-real-isr-81',
    'isr',
    'Amari Taitt',
    `I have had some complications due to the weather of being in Illinois how’ve we they were very understanding of my circumstances and worked with me I would definitely recommend them and this location`,
    1,
    141,
    10
  ),
  generateComment(
    'gm-real-isr-82',
    'isr',
    'Alec McEachern',
    `The staff is phenomenal. They are extremely organized and really do care for the residents living there. Highly recommend.`,
    1,
    266,
    12
  ),
  generateComment(
    'gm-real-isr-83',
    'isr',
    'luke zardzin',
    `Save yourself and do not live here.  There is much better places that you can live at for the same price.  We’re in the middle of a heat`,
    -1,
    193,
    0
  ),
  generateComment(
    'gm-real-isr-84',
    'isr',
    'Georgia Kapetaneas',
    `I have loved living here for the past 2 years and the staff has always been friendly!`,
    1,
    23,
    18
  ),
  generateComment(
    'gm-real-isr-85',
    'isr',
    'Sanjana Sastry',
    `Terrible communication. No one knows what anyone else is doing and they fail to respond to my multiple attempts to contact them to solve my issues. Would not recommend staying here to anyone I know.`,
    -1,
    164,
    2
  ),
  generateComment(
    'gm-real-isr-86',
    'isr',
    'Mundé Brown',
    `My room flooded and I asked for help and they never responded to this day and I had to live elsewhere until all the water had dried up..They didn’t seem to care at all.`,
    -1,
    206,
    12
  ),
  generateComment(
    'gm-real-isr-87',
    'isr',
    'Jay Garcia',
    `This place got a lot of space, nice people for staff, and give out free food from time to time. What else do you need?`,
    1,
    128,
    8
  ),
  generateComment(
    'gm-real-isr-88',
    'isr',
    'Shea Blais',
    `The new staff is very helpful and responsive and have been making steps to really improve the property.`,
    1,
    278,
    17
  ),
  generateComment(
    'gm-real-isr-89',
    'isr',
    'Mia Castaneda',
    `New management is so helpful and kind!! Very glad i signed here.`,
    1,
    253,
    3
  ),
  generateComment(
    'gm-real-isr-90',
    'isr',
    'Andrew Harlan',
    `Gross management. Lying about documents. Withholding security deposits. Save yourself a headache and avoid this place!`,
    -1,
    138,
    4
  ),
  generateComment(
    'gm-real-isr-91',
    'isr',
    'Vitaly Kpten',
    `The apartments are pretty spacious and I live the location!`,
    1,
    295,
    2
  ),
  generateComment(
    'gm-real-isr-92',
    'isr',
    'Randy Lahey',
    `Enjoy getting woken up at 7 AM by random construction sounds.`,
    -1,
    259,
    17
  ),
  generateComment(
    'gm-real-isr-93',
    'isr',
    'COOL COOL',
    `Youre better off homeless. The place is a scam.`,
    -1,
    294,
    8
  ),
  generateComment(
    'gm-real-isr-94',
    'isr',
    'Fiona OConnor',
    `The leasing people are so kind and helpful!`,
    1,
    58,
    19
  ),
  generateComment(
    'gm-real-isr-95',
    'isr',
    'Rohan Gupta',
    `Ryan the property manager is extremely rude and unethical.`,
    -1,
    288,
    14
  ),
  generateComment(
    'gm-real-isr-96',
    'isr',
    'Vedant FNO',
    `In short,one of the most useless organisation Ive experienced.`,
    -1,
    18,
    18
  ),
  generateComment(
    'gm-real-isr-97',
    'isr',
    'Andrew Kanelos',
    `They suckkkkkkk. Trash company.`,
    -1,
    97,
    19
  ),
  generateComment(
    'gm-real-isr-98',
    'isr',
    'Krishna Desikan',
    `New management is great!`,
    1,
    56,
    7
  ),
  generateComment(
    'gm-real-isr-99',
    'isr',
    'Saksham Gupta',
    `Live here! Love it!`,
    1,
    115,
    7
  ),
  generateComment(
    'gm-real-isr-100',
    'isr',
    'Emily Ho',
    `Wish giving zero stars was possible. Current resident here and we have not had working AC all year long with consistently being told they are going to “have someone look at it” and having multiple people come by yet absolutely no progress. Their only solution was portable AC units for our room while they are “waiting for a response from the external vendors” for months at a time. Absolutely no compensation for this as well despite the apartment unit getting as hot as 87 degrees F. Do not lease here as it seems like they can never solve problems. Apartment complex walkways are fairly always dirty, as with the staircases and elevators as well. The trash and recycling is overflowing most of the time as well.`,
    -1,
    40,
    11
  ),
  generateComment(
    'gm-real-isr-101',
    'isr',
    'Ian Laird',
    `Thank you for taking the time to leave us a review! We love hearing that you enjoy living with us, and we love that you are here at Yugo Champaign South 3rd Lofts!! – The Yugo Champaign South 3rd Lofts Team`,
    1,
    114,
    13
  ),
  generateComment(
    'gm-real-isr-102',
    'isr',
    'Aiden McNabb',
    `Hi Aiden, We’re happy that you’re happy! \nWe’re glad to hear you have a great experience with \nus, thanks for taking the time to leave us a positive \nreview! -Yugo Champaign South Third Lofts`,
    1,
    252,
    2
  ),
  generateComment(
    'gm-real-isr-103',
    'isr',
    'yani',
    `Hi Yani, Thanks for your 5 star review. It’s \nalways great to get feedback from our wonderful Yugo \ncommunity. -Yugo Champaign South Third Lofts`,
    1,
    150,
    8
  ),
  generateComment(
    'gm-real-isr-104',
    'isr',
    'li wenwen',
    `Hi li, \n\nThanks so much for the 5 rating. It means a lot! And we’re curious — how could we take your experience to the next level? If you’ve got any ideas, we’d love to hear them! \n\nThe Yugo Champaign South 3rd Lofts Team, ChampaignSouth3rdLofts@yugo.com`,
    1,
    295,
    15
  ),
  generateComment(
    'gm-real-isr-105',
    'isr',
    'shiny roosevelt',
    `Thanks for sharing your valuable feedback. We are \ncommitted to continually improving our services and \nensuring a positive resident experience. Although we do not have you in our system, wed love to hear how we can make your experience better. Feel free to contact us directly at mgr.champaignsouth3rdlofts@yugo.com`,
    -1,
    197,
    14
  ),
  generateComment(
    'gm-real-isr-106',
    'isr',
    'Tim Flavin',
    `Hi Tim, we’re sorry to hear that your stay in our community has been less than enjoyable. We want everyone to be happy and comfortable in their homes, so please give us a call so we can discuss your concerns and work on solutions. Thanks.`,
    -1,
    122,
    12
  ),
  generateComment(
    'gm-real-isr-107',
    'isr',
    'Destiny Worthy',
    `Hi Destiny, Thanks for your 4-star rating and positive review of South 3rd Lofts. We are pleased that you have enjoyed living in our community! As always, please feel free to reach out to us at (541)393-8080 if you ever need anything. Thanks again!`,
    1,
    196,
    10
  ),
  generateComment(
    'gm-real-isr-108',
    'isr',
    'Kevin Arguello',
    `Hi, Kevin! Thank you so much for sharing your experience so far. We appreciate your kind words and glad to hear that our staff made such a good impression on you. We’re so excited to have you with us at our community. Please stop by the office and let us know if you have any concerns or questions in the future. Thank you for choosing to call us home! - South 3rd Lofts Team`,
    1,
    151,
    9
  ),
  generateComment(
    'gm-real-isr-109',
    'isr',
    'Olivia Gomez',
    `Hi, Olivia! Thank you for taking the time to leave us a review and a 5-star rating! We are thrilled to see that you are enjoying your experience here and that our staff has been able to provide you with great service. We are looking forward to continuing to have you as a valued resident. Please reach out to us if you need anything moving forward. Thanks again! -  South 3rd Lofts Team`,
    -1,
    48,
    13
  ),
  generateComment(
    'gm-real-isr-110',
    'isr',
    'Caio Silva',
    `Thank you for the kind words, Caio! We strive to give every resident a wonderful living experience they deserve. We invite you to reach out to us at the office if there is ever anything we can do to make living here even better! – South 3rd Lofts Team`,
    1,
    102,
    1
  ),
  generateComment(
    'gm-real-isr-111',
    'isr',
    'Darien Snyder',
    `Thank you for sharing this rating, Darien. Were sorry to hear youve had a less than 5-star experience. If you would like to discuss your experience further, please feel free to reach out directly at (217) 210-4911.`,
    -1,
    291,
    5
  ),
  generateComment(
    'gm-real-isr-112',
    'isr',
    'J. Colin Glatz',
    `Thank you for taking the time to leave us a rating. Were sorry to hear that your experience with us wasnt the best it could have been. Wed like the opportunity to make things right. Please give us a call, (217) 210-4911.`,
    -1,
    251,
    19
  ),
  generateComment(
    'gm-real-isr-113',
    'isr',
    'Kim Parket',
    `Hi Kim, we’re sorry to hear that your stay in our community has been less than enjoyable. We want everyone to be happy and comfortable at Midtown Lofts, so please give us a call at (217) 210-4911 so we can discuss your concerns and work on solutions. Thanks!`,
    -1,
    141,
    4
  ),
  generateComment(
    'gm-real-par-0',
    'par',
    'Aminur Rahman',
    `Used to live here as a freshman. Great place and the gardens in the back are always a nice place to chill with the homies. PAR late night used to be a big thing in my freshman year, I dont know if they still offer it anymore but people from all the halls used to pull up here because the dining halls were open the longest.`,
    1,
    161,
    8
  ),
  generateComment(
    'gm-real-par-1',
    'par',
    'Ted B',
    `The donut shop in the lobby closes too early, if not it would be 5 stars.`,
    1,
    230,
    14
  ),
  generateComment(
    'gm-real-par-2',
    'par',
    'Vladislav Ekimtcov',
    `A very old dorm, built somewhere in the sixties. No ACs.`,
    1,
    185,
    0
  ),
  generateComment(
    'gm-real-par-3',
    'par',
    'Mayur Ganta',
    `At least theres air conditioning`,
    1,
    36,
    1
  ),
  generateComment(
    'gm-real-par-4',
    'par',
    'Jacob Park',
    `Interesting dorm.`,
    1,
    37,
    6
  ),
  generateComment(
    'gm-real-bromley-0',
    'bromley',
    'Lillian Jungles',
    `I can honestly say I peaked at Bromley Hall. Living here has been such a great experience, and I’ve always felt safe and at home. The RAs are the best—you can tell they genuinely care about the students and go out of their way to build a supportive community. The dining hall staff are some of the friendliest and funniest people on campus, and they make the day better with their kindness. The food also gets a bad rep, but in my experience it’s not bad at all it’s better than people say, and there’s always something to enjoy. Overall, Bromley has been the highlight of my time at UIUC. Between the community, the staff, and the atmosphere, it’s been more than just a dorm, it’s truly home.`,
    1,
    199,
    0
  ),
  generateComment(
    'gm-real-bromley-1',
    'bromley',
    'adeline kilgus',
    `By far best freshman dorm on campus. I wish I could live there every year. I made so many lifelong friends there! Amazing location too. I also loved the ice cream machine in the dining hall! They do a really good job of having socials like bingo nights, carnivals, etc.`,
    1,
    152,
    3
  ),
  generateComment(
    'gm-real-bromley-2',
    'bromley',
    'NKyla Rainey',
    `I lived at Bromley Hall my Freshman year and I had nothing short of a good experience. Kendra which is the business manager, was very welcoming. She, the maintenance team, and other managers within the building were very helpful and efficient. The RAs were great about hosting events which made it very easy to make friends! :)`,
    1,
    79,
    16
  ),
  generateComment(
    'gm-real-bromley-3',
    'bromley',
    'Natalia Strama',
    `I lived at Bromley my freshman year and made so many great memories. I met some of my closest friends in that dorm and tons of memories that will last a lifetime! It was definitely a great choice for a freshman dorm, especially with the private bathrooms and gym!`,
    1,
    234,
    1
  ),
  generateComment(
    'gm-real-bromley-4',
    'bromley',
    'Danielle Bulthuis',
    `I live at bromley my freshman year and I had a great experience. Having suite style bathrooms is one plus and another is the biweekly cleaning lady that comes. All the workers here are great, from management, all the way to the dining hall staff.`,
    1,
    288,
    13
  ),
  generateComment(
    'gm-real-bromley-5',
    'bromley',
    'Michael Casaletto',
    `Very social dorm people are very nice and outgoing. Rooms r very nice and spacious. Always fun events going on to bring people together. Only complaints are the food isn’t the best and it’s sometimes hard to go to sleep because people are always out.`,
    1,
    224,
    4
  ),
  generateComment(
    'gm-real-bromley-6',
    'bromley',
    'Logan Nikitow',
    `Staying at bromley hall made my freshman year so much better. The rooms are nice, the staff is friendly, and they have really good food. I’d definitely recommend it to others.`,
    1,
    206,
    13
  ),
  generateComment(
    'gm-real-bromley-7',
    'bromley',
    'John Leoris',
    `Bromley is the place to be. High quality rooms, lots of dining options, super social living space. This dorm is the envy of my freshman class.`,
    1,
    243,
    13
  ),
  generateComment(
    'gm-real-bromley-8',
    'bromley',
    'Evan Raffin',
    `Best private dorm on campus and definitely worth the money to upgrade. Incredibly social and great staff including Rylinn (the best RA)`,
    1,
    268,
    16
  ),
  generateComment(
    'gm-real-bromley-9',
    'bromley',
    'Alexa Okeefe',
    `I have had only great experiences at Bromley! All the staff is so wonderful and engaging. They help their residents above and beyond.`,
    1,
    166,
    0
  ),
  generateComment(
    'gm-real-bromley-10',
    'bromley',
    'Mick Porter',
    `Lived here as a freshman! It’s a very social and extroverted dorm which is great if you are trying to make friends and join groups.`,
    1,
    177,
    13
  ),
  generateComment(
    'gm-real-bromley-11',
    'bromley',
    'Ava Dizon',
    `Love bromley! Literally best place to live as a freshman on campus, my RA Devon is awesome too`,
    1,
    265,
    16
  ),
  generateComment(
    'gm-real-bromley-12',
    'bromley',
    'claire dunahee',
    `Best dorm for freshman year. Great staff. Great food. Great friends. Great location. Loved it.`,
    1,
    249,
    8
  ),
  generateComment(
    'gm-real-bromley-13',
    'bromley',
    'Yousra Mahmoud',
    `I have only good things to say about Bromley! The staff is wonderful-very helpful and supportive! You’ll have a wonderful experience here!`,
    1,
    165,
    2
  ),
  generateComment(
    'gm-real-bromley-14',
    'bromley',
    'Alec Porch',
    `Impossible to have a good well balanced diet here. Dining hall hours are odd and not long enough. The food is terrible, there shouldn’t be eggs soaking in juice. I also got a parasite while living here and it very well may have been from here. I always felt sick after eating here. In addition, the elevators were always broken here and I would have to walk up and down 12 flights of stairs just to get to my room. The infrastructure is poor despite the higher price of living here. A pipe burst while I was living here and half the building flooded with a foot of water. A pipe also burst above my bathroom and there was always huge pools of water drooping from the ceiling. People are also always up late and screaming in the hallways at 2am on weekdays. I suggest against living here and spending your money to live elsewhere.`,
    -1,
    41,
    19
  ),
  generateComment(
    'gm-real-bromley-15',
    'bromley',
    'Brad Martin',
    `I had the pleasure of being a resident of Bromley Hall this past year. The food service offers great variety and quality product. The staff was excellent and very accommodating to requests of the residents. One of my favorite perks was the option to grab a to-go lunch if I had to run to class in a hurry. I enjoyed thoroughly the flexibility of the staff/management in the room selection process as well. I wanted to live with my friends and Bromley was able to put us all together as I had hoped they would.\n\nUnlike University Housing, Bromley offers premium amenities. Whenever I felt like getting a quick workout in, it was so simple to take a quick elevator ride to the fitness center. No other residence hall offers an indoor pool either. The stress and dread of move-in/move-out was quick and easy. There were multiple assistants to help load all of my things and the entire process took maybe an hour. If I were to have to go through the whole process again, I would look no further than Bromley Hall. There is a reason that it fills up every academic year.`,
    1,
    66,
    14
  ),
  generateComment(
    'gm-real-bromley-16',
    'bromley',
    'Brett Porter',
    `My son lived here as a freshman and he had a great experience!`,
    1,
    182,
    14
  ),
  generateComment(
    'gm-real-bromley-17',
    'bromley',
    'Kelsey ONeill',
    `This dorm seems only enjoyable for freshmen. I lived her as a transfer student at the age of 20 and it was a horrible experience. Everyone that lives there is rowdy because they are 18 and have no serious classes they are taking. Bromley will not work with you on anything, they are one of the only dorms on campus that charges you for laundry (which you have to put CASH on a plastic card that is used for nothing  except to do laundry). The dinning hall hours are horrible. The stairwells are trashed at all times and smell like weed constantly. You pay top dollar to live in this dorm and the ceilings are chipping, the paint on the walls is chipping, the chair and bed they provided me were both broken, and the internet went down for two weeks. The worst thing about Bromley is that on breaks and at the end of the year they kick you out by 8:00pm on the last class day. For the end of the Spring semester I had a last final that went until 4:00pm and they still forced me to pack all my stuff up and be COMPLETELY moved out by 8:00pm that same day NO EXCEPTIONS. I was counting down the days until I could move out after only living here for a month. The only positive about living here is that it feels safe. I would only recommend living here if you are a freshmen.`,
    -1,
    162,
    18
  ),
  generateComment(
    'gm-real-bromley-18',
    'bromley',
    'Zujey Barrera',
    `Bromley is a great place to live!! My favorite parts about living in Bromley as a freshmen were definitely the huge rooms and biweekly housekeeping. Staff was also always very accommodating and my RA was very helpful throughout the year as well`,
    1,
    125,
    15
  ),
  generateComment(
    'gm-real-bromley-19',
    'bromley',
    'Nick Ferguson',
    `Bromley Hall is excellent. By far the best place to live on campus as a freshman. Excellent food service, top notch, qualified resident advisors and a very helpful management team. Also a very great place to work as a student during the school year and/or summer.`,
    1,
    284,
    4
  ),
  generateComment(
    'gm-real-bromley-20',
    'bromley',
    'Karolina Stachnik',
    `Nicest & most social freshman dorm on campus, definitely recommend!`,
    1,
    14,
    5
  ),
  generateComment(
    'gm-real-bromley-21',
    'bromley',
    'Kay Bixby',
    `you think the food isn’t gonna be a big deal but it is. the dining hall hours are unbearable so if you’re taking any classes you’re pretty much not getting lunch and dinner ends at 7 so we’ll see if you get dinner either. even when you make it to the dining hall the food sucks bad the vast majority of the time. idc how big the rooms are you still gotta eat so just live in university housing and save yourself the malnutrition`,
    -1,
    10,
    12
  ),
  generateComment(
    'gm-real-bromley-22',
    'bromley',
    'Wack Green',
    `Dani Bulthuis is such a great RA and really helps make this place amazing!`,
    1,
    179,
    6
  ),
  generateComment(
    'gm-real-bromley-23',
    'bromley',
    'Lainey Nielsen',
    `The staff is super friendly and accommodating!  You feel like they really care about making your college experience great and helping you reach your goals.  Not having to leave the building to eat or for a workout is a lifesaver in the winter!`,
    1,
    18,
    17
  ),
  generateComment(
    'gm-real-bromley-24',
    'bromley',
    'Shari Schmidt',
    `The rooms and old and the bathrooms moldy. The food situation is terrible. Bromley contracts with the police training program. Our student says most food is gone by the time they get there because the trainees get first dibs.`,
    -1,
    19,
    16
  ),
  generateComment(
    'gm-real-bromley-25',
    'bromley',
    'Elisa Laurini',
    `Bromley Hall is such a great place to live. The staff there is extremely friendly and always go out of their way to help you. Living so close to the main quad makes it easy to get to class and there are so many amenities available in the building that you really have everything you need. I would definitely recommend Bromley!`,
    1,
    137,
    11
  ),
  generateComment(
    'gm-real-bromley-26',
    'bromley',
    'David Perez',
    `Bromley Hall is a nice residence hall. The rooms are big and the semi-private bathrooms are nice to have. It is a pretty good location because there is a bus stop right on the corner and the work out room and pool are convenient. A/C is really nice in the summer too. However this is one of the more expensive dorms over 10k in most cases and as it is the most expensive it attracts richer students. Also as this is private housing not all of the students even go to UIUC but some go to Parkland. They usually happen to be the ones with nothing better to do other than blast music at 2AM though im not saying UIUC students dont. The worst part about the dorm though is the food. Easy Mac tastes better than their Mac and Cheese and their food is very low quality. If you do dorm here your best option is to get a low meal plan and eat other places whenever possible. overall it isnt necessarily a bad dorm but I wouldnt stay in it another year. Id rather get an apartment which would save around $4000 with much better foodl`,
    1,
    263,
    18
  ),
  generateComment(
    'gm-real-bromley-27',
    'bromley',
    'Sarah Maghrabi',
    `Peaked here at Bromley. A sophomore rn and I still reminisce about my times there. 😪 …`,
    1,
    116,
    2
  ),
  generateComment(
    'gm-real-bromley-28',
    'bromley',
    'Jules',
    `Best place to live on campus as a Freshman. The most social spot to be and a great location from bars, green st, and class! Definitely recommend getting the Double XL room as well. The staff is so friendly and accommodating.`,
    1,
    97,
    5
  ),
  generateComment(
    'gm-real-bromley-29',
    'bromley',
    'Kate kwas',
    `Met some of my best friends here! Attentive staff and very clean!`,
    1,
    181,
    19
  ),
  generateComment(
    'gm-real-bromley-30',
    'bromley',
    'Luca Listi',
    `Kitchen Staff and RAs are cool but dont live here if you like edible food and wifi that actually works! The food is edible 2-3 out of 7 times a week. Also the wifi is always disconnecting and even when its connected it is the slowest wifi I have ever used in my life. You think for paying $15,000 a year they would be able to have these things under control but trust me they most definitely do not!`,
    -1,
    77,
    6
  ),
  generateComment(
    'gm-real-bromley-31',
    'bromley',
    'Callie Eisenmann',
    `I love Bromley!!! Best place to live freshman year!!`,
    1,
    87,
    10
  ),
  generateComment(
    'gm-real-bromley-32',
    'bromley',
    'Jordan Walters',
    `This is far and away the worst place you could live at uiuc. I put the deposit down without first visiting and I was very astonished at how miserable I ended up being as a resident here. I seriously would move if I didn’t have a contract for both semesters. First of all, it is $2000 more a year than any other university housing so you’d think it would be up to some standard. It is not. The management only cares about profit and is not willing to spend any more money than they legally have to. There is MOLD in bromley people. It is in all rooms on all floors and I got extremely sick from it. The windows don’t open. The food is fine but  repetitive and there is no healthy or vegetarian options. They would not fix the WiFi in our room until my roommates dad threatened to sue. They do not respect the students that live here. Worst of all, management. They came into my room while I was not here without a warning they would be coming. They ripped apart my bed and stole my personal belongings and did not tell me. I came back to a mess. When I went down to figure out what happened, I was told that it was my fault and received my belongings back defaced. I told them I was not comfortable with people in my room when I am not there and I received an “I don’t care.” Shoutout to the RAs and cleaning stafff and dining hall staff though.`,
    -1,
    297,
    3
  ),
  generateComment(
    'gm-real-bromley-33',
    'bromley',
    'Jack L',
    `I got poisoned from the food at this dorm along with a lot of people on my floor. Don’t get me started on the leathery sausage, I’d recommend you don’t eat any of this food it’s absolutely terrible. The ribs looked like  grounded up mystery meat. Also the eggs were wet and watery.`,
    -1,
    300,
    12
  ),
  generateComment(
    'gm-real-bromley-34',
    'bromley',
    'Stabs2994',
    `Bromley Hall is no questions asked, the place for freshman coming to University of Illinois to live. The resident advisors are well trained, the food is great, and move in and move out process is refined for maximum efficiency.  Bromley Hall has all of the amenities that a parent can ask for within their childs living arrangement their first year of school.`,
    1,
    265,
    16
  ),
  generateComment(
    'gm-real-bromley-35',
    'bromley',
    'Zu',
    `Honestly I regret choosing to live here more than anything. If you think you’re going to get something better here since it’s private housing you’re not. Public housing is the way to go and that’s where you can meet actual real genuine people unlike here. Elevators never work, and if they do they take extremely long to get to you, food is absolutely terrible, and wifi never works. If you have a problem with something it never gets fixed no matter how many times you email the director/tech people, it never gets done. Not to forget the mold everywhere and the constant screaming in the hallways at 2 in the morning. If you’re basic and want fake friends I suggest you go for it and live here but if not don’t and stay far away.`,
    -1,
    274,
    17
  ),
  generateComment(
    'gm-real-bromley-36',
    'bromley',
    'Mack Mack',
    `Food was horrible. Food hours made no sense. I have never seen a breakfast this nasty. Why can i not get food that i paid thousands for past 7pm everyday or before 10:30am on weekends. Their covid precautions also made no sense whole time. The rooms were nice and my RA was nice but overall way overpriced. Also why am I paying full price when the ammenities are so limited this year.`,
    -1,
    210,
    13
  ),
  generateComment(
    'gm-real-bromley-37',
    'bromley',
    'Alex V',
    `Major rip off. Public school in a state where weve been paying taxes for 18 years charges $ 11,000 for two semester accommodation in a tiny room with outdated ac , stains on the ceiling,  holes in the ugly yellowish walls. Let me rephrase this: two students pay a total of $ 22,000 August through May for a run down room, antiquated furniture and a bathroom they share with another 4 students. For that kind of money  you can rent a one bedroom condo with a lake view  in a high rise downtown Chicago.  Best part? They kick you out of the dorm for holidays on the last day of school - 1 week in November, one month winter holidays and obviously, summer.`,
    -1,
    76,
    16
  ),
  generateComment(
    'gm-real-bromley-38',
    'bromley',
    'Devon',
    `Where do I start… got flooded, overheated, staff r creepy and stare at u, got victim blamed by the manager, got my stuff thrown away, micro aggressions, and so much more😭😭 it’s like ur paying for the ritz Carlton and instead u get a cheap motel …`,
    -1,
    81,
    8
  ),
  generateComment(
    'gm-real-bromley-39',
    'bromley',
    'Sydney Greim',
    `Wouldnt want to live anywhere else! I LOVE my RA and I am so thankful for all the friends that Bromley has brought me. I would recommend living in Bromley to everyone!`,
    1,
    145,
    0
  ),
  generateComment(
    'gm-real-bromley-40',
    'bromley',
    'Cayden Vaeth',
    `Love it so much. RA Devon da goat 🐐 …`,
    1,
    95,
    17
  ),
  generateComment(
    'gm-real-bromley-41',
    'bromley',
    'Lisa Stewart',
    `As a parent I feel Bromley has a done good job overall. They definitely communicate well and deliver on what they promise.`,
    1,
    208,
    14
  ),
  generateComment(
    'gm-real-bromley-42',
    'bromley',
    'Sam Holmes',
    `Lovely People and Staff, would recommend 110%!!`,
    1,
    29,
    4
  ),
  generateComment(
    'gm-real-bromley-43',
    'bromley',
    'Dan Bulthuis',
    `Bromley has been a great experience!`,
    1,
    150,
    12
  ),
  generateComment(
    'gm-real-bromley-44',
    'bromley',
    'Michael Howardgkf your videos are so awesome',
    `The best service and hard working people. Caring and the food is awesome.  Great for first year experience at the University of Illinois.`,
    1,
    164,
    5
  ),
  generateComment(
    'gm-real-bromley-45',
    'bromley',
    'Giuseppe Biundo',
    `Anyone Ive met that complains about this dorm is entitled/spoiled. This is a real step up from any other dorm Ive lived in or visited.`,
    1,
    23,
    11
  ),
  generateComment(
    'gm-real-bromley-46',
    'bromley',
    'Kelsey Franz',
    `Best time ever!`,
    1,
    112,
    5
  ),
  generateComment(
    'gm-real-bromley-47',
    'bromley',
    'Rick Langlois',
    `Love the authentic 1960s design.`,
    1,
    42,
    18
  ),
  generateComment(
    'gm-real-bromley-48',
    'bromley',
    'Rylinn Harvey',
    `Love this place!!!!`,
    1,
    257,
    10
  ),
  generateComment(
    'gm-real-bromley-49',
    'bromley',
    'J',
    `Garbage food, garbage dorms`,
    -1,
    174,
    12
  ),
  generateComment(
    'gm-real-bromley-50',
    'bromley',
    'Ava Spreitzer',
    `Bruh I hate it here`,
    -1,
    178,
    5
  ),
  generateComment(
    'gm-real-illini-tower-0',
    'illini-tower',
    'Kathy Dieringer',
    `Illini Towers has been a great fit for my daughter! The staff is very responsive, helpful and kind. There was one issue w the refrigerator in which they resolved very quickly in getting a brand new fridge. They went above and beyond. The building is safe and secure. They got rid of extension cords that were not safe and replaced with safe ones.  Huge bonus:  there is air conditioning in all of the units with zero issues. Thank you Illini Towers!`,
    1,
    17,
    1
  ),
  generateComment(
    'gm-real-illini-tower-1',
    'illini-tower',
    'Michael Pister',
    `Visited Illini Towers today and Teylor gave us an amazing tour, answered all our questions and was very excited to show us around. The rooms are huge with super nice provided furniture. My son left super excited about his choice to stay here freshmen year…thanks teylor😀 …`,
    1,
    203,
    3
  ),
  generateComment(
    'gm-real-illini-tower-2',
    'illini-tower',
    'Megan Phillips',
    `I took a tour with my brother this week with Georgia and it was absolutely amazing! The staff is great and welcoming and definitely has more amenities than I’ve seen at other schools!`,
    1,
    268,
    12
  ),
  generateComment(
    'gm-real-illini-tower-3',
    'illini-tower',
    'Luz Lara',
    `Beautiful place! My brother is an upcoming freshman and we did a tour with Cody. He was extremely nice and helpful.`,
    1,
    88,
    14
  ),
  generateComment(
    'gm-real-illini-tower-4',
    'illini-tower',
    'Harley Smith',
    `I did a tour with Georgia and I’m very impressed with the kindness and welcoming staff! Definitely signing a lease for next year!`,
    1,
    95,
    5
  ),
  generateComment(
    'gm-real-illini-tower-5',
    'illini-tower',
    'Sadeem M',
    `I lived in IT last year and as much as I read really negative reviews about the place I was lucky enough to never face any of the issues like leaking and etc. John, and the two old workers at the dining hall really made my dining experience better. The location was ideal ( 2 mins away from the quad, and there were 3 bus stops next to IT). My roommate and I also got our security deposit back.`,
    1,
    220,
    11
  ),
  generateComment(
    'gm-real-illini-tower-6',
    'illini-tower',
    'Zhi HAode',
    `Dont even want to give one star. Totally SCAM. One month, the elevator still doesnt fixed. Dinning hall food service people are unrespectful to people and I dont know why the food is limited but they told me so. Food often only provides 2 or 3 kinds with most area empty, sometime dont even provided basic foods such as milk. Also, maintaince people are rude to come to the room.It promises free print on the advertisement, well you know the front desk people always ask me to bring my own paper. Leaking proof, and terrible study area. Really Speechless.`,
    -1,
    3,
    1
  ),
  generateComment(
    'gm-real-illini-tower-7',
    'illini-tower',
    'Lys Garner',
    `it smells weird and is never very clean, the elevators are excruciatingly slow and amenities are mediocre. and bugs…`,
    -1,
    220,
    6
  ),
  generateComment(
    'gm-real-illini-tower-8',
    'illini-tower',
    'Alaina Browne',
    `I came and toured the property and it was amazing. The leasing staff are so welcoming I plan to sign here for the 26-27 term!`,
    1,
    264,
    18
  ),
  generateComment(
    'gm-real-illini-tower-9',
    'illini-tower',
    'El Pollo',
    `When I first came to Illini tower, I was blown away by the beautiful architecture of my unit 🥰\nThere was water damages and broken ceiling lights, it felt just like home!\nAnd now, they added a new indoor pool right outside my unit! Illini tower, you shouldn’t have! How did you know I love swimming?\nI only gave 4 stars because I still haven’t received a lung transplant from MY R.A, but I’m sure we’ll get to that level of companionship soon ❤️`,
    1,
    261,
    17
  ),
  generateComment(
    'gm-real-illini-tower-10',
    'illini-tower',
    'Clix809 8',
    `Love living hear such a great community and staff can think of a better place to live freshman year!`,
    1,
    257,
    6
  ),
  generateComment(
    'gm-real-illini-tower-11',
    'illini-tower',
    'Cameron Newmes',
    `Dont live here. The apartments are in horrible condition and require constant maintenance. The elevators often take 30 minutes or more and there are no stairs.`,
    -1,
    137,
    12
  ),
  generateComment(
    'gm-real-illini-tower-12',
    'illini-tower',
    'Amy Immergluck',
    `My family just has a wonderful tour given by Cody at Illini Towers. The place was clean & bright. The living space was impressive. The amenities were pretty awesome! If my son decides to commit to University of Illinois he will be living at Illini Towers.`,
    1,
    228,
    12
  ),
  generateComment(
    'gm-real-illini-tower-13',
    'illini-tower',
    'Loay Abusalah',
    `Extremely Disappointing Experience: The experience at Illini Tower has been terrible. The heating control doesn’t work, and the building often feels unsafe with constant noise and the smell of marijuana everywhere. The food quality is horrible — no one eats there. It’s way overpriced for what you get, and they charge $175 if you lock yourself out.\n\nThis is definitely a bad choice for freshmen or anyone serious about their education. The bathrooms are extremely small, and hot water is rarely available for showers. Instead of focusing on school, you’ll spend your time dealing with building issues.\n\nI strongly advise looking elsewhere.`,
    -1,
    172,
    16
  ),
  generateComment(
    'gm-real-illini-tower-14',
    'illini-tower',
    'Myles Stortzum',
    `I’ve never seen so many elevators constantly break. At least one or 2 elevators are down every day`,
    -1,
    227,
    1
  ),
  generateComment(
    'gm-real-illini-tower-15',
    'illini-tower',
    'Alysa Fulkerson',
    `I’ve been at Illini Tower for about six months now and everyone is always so nice. The maintenance man, Chandler, came in to fix my bathroom light, he was very efficient. They have plenty of areas to play games or just hang out and the front desk staff are always kind and available to help out with whatever I need!`,
    1,
    19,
    6
  ),
  generateComment(
    'gm-real-illini-tower-16',
    'illini-tower',
    'Caitlyn Land',
    `Kennedy Williams has been such a good RA. Anytime I’ve had an issue she was there to help, she’s super nice, and I can tell she cares about her job and the residents! ALSO her and I did the karaoke on move-in day and it was super fun!`,
    1,
    189,
    0
  ),
  generateComment(
    'gm-real-illini-tower-17',
    'illini-tower',
    'KEEPING UP WITH SHAY',
    `I cant say enough good things about Christy, the RA ! She is incredibly helpful, always going above and beyond to make sure everyone feels comfortable and supported. Whether its answering questions or offering a friendly smile, Christy’s welcoming attitude makes the floor feel like home. She’s truly amazing at what she does and makes a huge difference in creating a positive.`,
    1,
    17,
    11
  ),
  generateComment(
    'gm-real-illini-tower-18',
    'illini-tower',
    'Bob Oakley',
    `Wouldnt recommend for freshman everything about this place is just terrible. The elevators are slow sometimes taking 10 minutes. That if the 4 elevators are working because at least 1-3 are down at all times. The food is terrible, bland and  cheap.  The maintenance is extremely slow leaving you to fix your own problems your self. Cant forget the fact that this place always has some form of water related issue whether that be flooding clogged drains or no hot water. ****if youre a freshman please for the love of god dont live here******`,
    -1,
    157,
    6
  ),
  generateComment(
    'gm-real-illini-tower-19',
    'illini-tower',
    'Alexander Fako',
    `Living at IT is a blast! It’s fun and has many social events. The game room and mezzanine (study area) are standouts, as well as the in-building gym! I’ve loved living here my first year as a student at UIUC and recommend it to everyone looking for a fun, relaxed, and accomodating living community!`,
    1,
    220,
    15
  ),
  generateComment(
    'gm-real-illini-tower-20',
    'illini-tower',
    'AYCE',
    `Christy is hands down one of the best RAs I’ve had. Super chill, always there when you need her, and knows how to make the floor feel like home. 10/10.`,
    1,
    231,
    2
  ),
  generateComment(
    'gm-real-illini-tower-21',
    'illini-tower',
    'Madison Jones',
    `The property is amazing! I toured with Georgia and she showed me a quad room! She was so helpful throughout the experience and the room was amazing! Great views, great amenities and the living room space was big enough!`,
    1,
    23,
    0
  ),
  generateComment(
    'gm-real-illini-tower-22',
    'illini-tower',
    'stefany roberts',
    `Transferring from a smaller college to the UOI is overwhelming. But Georgia was able to calm our nerves a little more when she took us around the Illini Tower. She explained the amenities very clearly and how everything worked. Huge thank you to Georgia for everything she did!`,
    1,
    163,
    4
  ),
  generateComment(
    'gm-real-illini-tower-23',
    'illini-tower',
    'Amanda Birkner',
    `My son lived in the tower. The building has water, elevator and fire alarm problems. No one cleans the hallways, pile of vomit in front of the elevators for weeks. Not to mention how expensive it is to live there. On move out day we had to walk over HUGE piles of trash lining the hallways. I wish I took pictures, I’ve never seen anything like it. Felt sorry for the people who had to clean it up. Being respectful, we bagged our son’s trash and left it in his apartment so we didn’t add to the pile. To my surprise we received a move out statement invoice with a $60 trash charge. But honestly the roommate matching was terrible, if his roommates said they were clean- it was a lie. So I bet they left trash everywhere since they never disposed of it thru the school year. Requiring freshman to live on campus is terrible. Glad he has an apartment to himself next year.`,
    -1,
    209,
    2
  ),
  generateComment(
    'gm-real-illini-tower-24',
    'illini-tower',
    'Tammy Runge',
    `1/15/24 UPDATE\nStill would not recommend- For what you pay- its not worth it.\nFood has not improved, Front desk does not answer the phone even during business hours. You get a central billing office that only takes messages. I dont even bother leaving a message\nNow going back from winter break, the rooms are freezing- it’s 56 degrees in the room and no hot water. 1/16/24 still no heat or hot water. This has gone on since he arrived on 1/14/24\n\nWould not recommend- still waiting on a final reply from Sam from this summer on false advertisement on bed size, then upon checking we were given a room with SOAKING WET carpet and were told we would receive credits on our account- We are still waiting on those. Parking is a mess and you dont get your assigned spot and my sons truck will end up damaged and I am still waiting on a return call from a week and a half ago on that. They do not follow up if you call nor do they resolve issues. For what you pay- its not worth is. Dont go by reviews on social media either- If you post anything there, it gets deleted.\nFeedback is the food is not good and they dont let you downgrade your food place- only upgrade. So we will be paying for food hes not eating.\nBrandon at the front desk has been great and the crew from TX that came for check in was also great, but the crew from TX of course doesnt manage the facility.....`,
    -1,
    231,
    6
  ),
  generateComment(
    'gm-real-illini-tower-25',
    'illini-tower',
    'Rami Khosho',
    `one of the Managers D is amazing. About a month ago i mentioned wanting to bring my car down for the semester but there were no parking spots. The second a spot opened he came straight to me to let me know!`,
    1,
    11,
    8
  ),
  generateComment(
    'gm-real-illini-tower-26',
    'illini-tower',
    'Patrick Li',
    `Having lived at Illini Tower for a few months now, I can say that I have had no complaints my time here. The one time we had a small issue with our door in the suite, maintenance was prompt and addressed the issue quickly and without much disturbance. Doing laundry is free, which is a huge plus here. The lounges are all very clean, well kept, and modern. They feel lovely. The food is alright, not restaurant quality in my opinion, but their diverse options and rotating menu make up for it. Finally, the staff are all nice, informed, and have done their best to keep the building running. All in all, 5/5, will live here again.`,
    1,
    92,
    13
  ),
  generateComment(
    'gm-real-illini-tower-27',
    'illini-tower',
    'Anna Meng',
    `Time here has been really fun. The management and RAs are so friendly and helpful, shoutout to Cody and Layo :). Always willing to chat about anything and solving any issues Id have with my room. Dorms have nice layout too, basically an apartment.`,
    1,
    81,
    17
  ),
  generateComment(
    'gm-real-illini-tower-28',
    'illini-tower',
    'Meredyth Morin',
    `They have had floods for the two years I’ve been here. Also recently they’ve started doing maintenance with power tools in the room above me starting at 6:45 am. If you want to sleep and still have your belongings intact, think long and hard before choosing to live here. Also, last year they paid the RAs to badger people to give five star reviews so the ratings for the building would be higher when people search online.`,
    -1,
    85,
    15
  ),
  generateComment(
    'gm-real-illini-tower-29',
    'illini-tower',
    'Will Giblin',
    `I was here during COVID. It was alright, basically nobody else was here it felt like. I had to be there over winter break because I was an athlete and they during off our heat. It was 32 degrees in our room since our air conditioner was connected to the cold air outside. It was so bad that we could see our breath indoors. We kept calling and the issue wasn’t resolved for a week. Other than that I enjoyed this place though. It was pretty calm. If I was a NARP though I’m just going Bromley or 6 pack.`,
    1,
    25,
    13
  ),
  generateComment(
    'gm-real-illini-tower-30',
    'illini-tower',
    'Sammy Moscovitch',
    `Some issues arrived early in the semester with the people in my room and some service was required on the room. Maintenance was up and fixing the issue within 24 hours. The administrative staff in the building are absolutely amazing. They are always there to answer any questions and try to help resolve any questions you may have.  The staff is extremely social and has always been supportive and helpful in any way that they can.  I truly have to say that Illini Towers has been an amazing place to live in my freshman year, and looking forward to another semester.`,
    1,
    38,
    11
  ),
  generateComment(
    'gm-real-illini-tower-31',
    'illini-tower',
    'Casey Alana W',
    `Illini tower staff are so friendly and always willing to help. Logan, Zach, and Kelly have been there to assist me in anything I need around the clock. IT is so much better than the other dorms, it feels like an apartment. I use the kitchen in my room all the time. I would 100% recommend it. Sometimes my key card doesn’t work, but the staff always help if there is ever an issue.`,
    1,
    64,
    13
  ),
  generateComment(
    'gm-real-illini-tower-32',
    'illini-tower',
    'Madelyn Burton',
    `Georgia toured me through the property, she was very friendly and informative. She answered all my questions before I got the chance to ask! The property was beautiful and I had an amazing experience touring with Georgia! 😁 …`,
    1,
    135,
    2
  ),
  generateComment(
    'gm-real-illini-tower-33',
    'illini-tower',
    'Gabrielle Maloney',
    `Illini Tower is a great place to live. I have only lived here this semester and my time here has been very eventful. For the past two years I lived in University Housing and I loved those past two years. I made a lot of friends and I loved my RA. However, Illini Tower does offer more than University Housing. It is a central location on campus and is a few minutes away from the quad and green street. Illini Tower offers apartment style layouts with a living room, kitchen, and private bathroom. Also the dinning hall is great, they have many food options, offer the  skillet in which dinning can make whatever you would like and there is a suggestion board in which you can put what food items you would like to see in the dinning hall. Illini Towers staff is very friendly and always helpful. One thing that I love is they always have events going on for the residents, whether it is a movie night with free insomnia cookies or midnight pancakes in the dinning hall. It is a wonderful place to live and would highly recommend living here.`,
    1,
    129,
    3
  ),
  generateComment(
    'gm-real-illini-tower-34',
    'illini-tower',
    'Katelyn Townsend',
    `Living at Illini Tower was an experience. If you absolutely cannot stand dorms as a freshman this is about the best you can do. But if you are conflicted here are some things that you dont get to learn until after the leasing process:\n\nUnlike with dorms where you can use your meal card at pretty much any other dining hall, with PCH you can only eat Illini Tower, and their food is consistently not great. At one point the majority of the kitchen staff quit but most residents saw it as a benefit as we were temporarily given credits to visit other, better dining halls.\n\nThe fire alarms are incredibly busted at Illini. During winter break a student left their window open, causing pipes to burst and the fire alarm to go on for more than 12 hours(!) and some major water damage. Other than this alarms would erroneously go off during the day, night, during exams, etc. They became so frequent I knew dozens of residents that refused to leave during the alarms because they didnt want to climb upwards of 16 flights of stairs after the all clear was given or wait in the freezing cold for a nonexistent fire.\n\nElevators are constantly malfunctioning. Dont be surprised if you end up waiting 10 minutes for the elevator to finally hit your floor because 2/4 elevators are down for service. The worst part really is that unless you can somehow find a staff member willing to open the outside stairs doors, you cant go up the stairs. Meaning people on the first floor will be waiting for 5-10 minutes for an elevator when an accessible staircase would get them where they need to go in 30 seconds.\n\nUnless you like to shower at 2am or 6am, dont expect getting hot water. On good days your water may be a few degrees above lukewarm.\n\nKeycards to rooms and getting in the building would often become abruptly unusable and need replaced.\n\nYou can only control the A/C, not the heating, so bring some thick blankets for winter.\n\nThe amenities are all pretty sad. The gym is consistently dirty and gross, good luck ever getting the movie theatre, there are not enough dryers or washers and students are constantly leaving their laundry in both, and the "music room" is basically a closet with an ancient, untuned piano. The free printing you get means going down to the lobby and hoping there is a staff member there who can print your sheet in the office.\n\nThere are some pros to Illini, however. The in-room kitchen is great if you enjoy cooking or want to eat something that actually tastes good. You only have to share your bathroom with up to three other people. It is very close to the main quad and most classes are within easy walking distance. You can stay over breaks and they have an indoor parking lot in the basement for any students that dont want to part with their vehicle. The maintenance staff was great and very nice. However, thats about it.\n\n**** I just wanted to add that Illini Tower suspiciously went from a 3.2/3.1 to nearly four stars in a few weeks. Management is allegedly bribing RAs to meet good reviews. I honestly cannot at all recommend living here.`,
    -1,
    119,
    10
  ),
  generateComment(
    'gm-real-illini-tower-35',
    'illini-tower',
    'Starr Gibson',
    `This is a good place to live. The resident assistants are always having fun programs every month. I get to meet people from my floors and make friends. I really like the building wide programs because I meet students from every floor. The rooms are a nice size and we even have a bathroom in our room.`,
    1,
    188,
    7
  ),
  generateComment(
    'gm-real-illini-tower-36',
    'illini-tower',
    'Ruei Kao',
    `Illini Tower is one of the best luxury dorms on campus. As a freshman, I believed the negative reviews of Illini Tower and chose University housing. I immediately regret my decision after I visited one of my friends room at Illini Tower. Do not be fooled by its pricing as the rooms are of top quality and there are plenty amenities. The price also includes a meal plan for the cafeteria on the 1st floor. The food isnt gourmet but its better than your average cafeteria food as the choices are overwhelming. The rooms are spacious, you get your own suite that comes with a bathroom, living room, and a kitchen. This offers you a chance to not only meet great roommates but be able to become friends with them as you are able to socialize in your suite. The staffs are extremely friendly and approachable.  Also, Illini Tower gives its resident free laundry service.`,
    1,
    239,
    19
  ),
  generateComment(
    'gm-real-illini-tower-37',
    'illini-tower',
    'Omar',
    `Great experience overall with my stay here so far. I currently have Tasho as my RA, and he is the absolute best. Tasho is always eager to help with any issues or questions I have, and is great to have a conversation with. The building has great amenities overall, and is an amazing place to reside. Would definitely stay for as long as I can!`,
    1,
    145,
    13
  ),
  generateComment(
    'gm-real-illini-tower-38',
    'illini-tower',
    'Max Runge',
    `Terrible food, my toilet has been broken for 3 weeks and no maintenance has been up to fix it, the elevator has been broken for the past month, the floor has flooded multiple times, the fire alarm will go off randomly at 2 am. I do not recommend living here. For the price I am paying, it should be much nicer than it is.`,
    -1,
    199,
    15
  ),
  generateComment(
    'gm-real-illini-tower-39',
    'illini-tower',
    'carter',
    `My time living at IT has been a blessing. From my amazing RA, Melaney, my floor 14 residents, and my delightful roommates. I am going to live here when I am older, the food here is like a 3 star Michelin restaurant.`,
    1,
    98,
    1
  ),
  generateComment(
    'gm-real-illini-tower-40',
    'illini-tower',
    'Bill d',
    `Went to dining hall near closing. They wouldn’t give me another portion.`,
    -1,
    83,
    9
  ),
  generateComment(
    'gm-real-illini-tower-41',
    'illini-tower',
    'Mingchu Tang',
    `We love Illini Tower! It is not cheap of course, but it is clean. It is stylish. It is organized. It feels like home. The management team is friendly and responds to student concerns and needs very timely. A big plus: Free food for the first week of a new semester!`,
    1,
    105,
    18
  ),
  generateComment(
    'gm-real-illini-tower-42',
    'illini-tower',
    'Genieva Martin',
    `For a U of I student I must say that Illini tower is an awesome place for student housing. The lounge is a great place for studying or hanging out with friends, doordash friendly, pet friendly and the rooms have comfortable living space included. But I must say my favorite part of IT has to be my RAs. There is always someone at the desk during the day and they always answer the on call phone throughout the night. Special shout-out to the one RA KellyAnna Lucas. For one she always has your back. She very good at resolving any issues with account problems, roommate problems and is well versed in the building rules. She even has the cutest dog that follows her around and is super friendly! Definitely a place to consider if you’re an incoming student`,
    1,
    124,
    10
  ),
  generateComment(
    'gm-real-illini-tower-43',
    'illini-tower',
    'Deja Hood',
    `Amazing staff! They have Resident Appreciation Week but lowkey every day feels like Resident Appreciation!!! The staff throughout the building is so attentive to the needs of the residents and anyone else that passes through their doors. You get that sense of freedom and responsibility better than in dorms/University Housing, yet it is still so family oriented. Great alternative to expensive University Housing pricing and more diverse food options! They also have a really rad movie theatre in the basement--Check it out!`,
    1,
    140,
    4
  ),
  generateComment(
    'gm-real-illini-tower-44',
    'illini-tower',
    'Nacala Bollinger',
    `The RAs were the highlight of the tower especially the social events. Shoutout to  Kennedy- she was nice to help me out with some roomie stuff, and she has cute boards.`,
    1,
    135,
    7
  ),
  generateComment(
    'gm-real-illini-tower-45',
    'illini-tower',
    'Vincent Williams',
    `The experience I have had at Illini Tower is completely not what I expected to have based on prior reviews.  The staff here is so friendly and respectful.  They make Illini Tower so warm and welcoming.  The rooms are the perfect size for four people to reside in comfortably.  I have even made new friends that I will have for life.  The resident assistants are so welcoming and give so many tips on how to succeed in college.  This is definitely the best place incoming students should look at when coming to the University of Illinois.`,
    1,
    167,
    11
  ),
  generateComment(
    'gm-real-illini-tower-46',
    'illini-tower',
    'Michael Echavez',
    `Both the ambiance and community give a welcoming feeling. The person that makes this place like a home is my RA Ryan Talusan. Not only is he there for his residents, he’s able to actively engage with his floor through art and activities. His bulletin boards increase awareness of the diversity of Asian diaspora by displaying many pictures of various women, specifically in size and shape. Never have I loved learning about the beauty of the female form. One time he held a dance class in our lobby, and let me tell you not even Jennifer Lopez could work a pole like him.`,
    1,
    121,
    0
  ),
  generateComment(
    'gm-real-illini-tower-47',
    'illini-tower',
    'Basel Hajyousif',
    `Illini Tower is awesome. It is the staff and especially the RAs who make it so great. Logan, Chloe, Dan, Adedoyin, Tasho, and Markus are incredible RAs. They have helped me or have helped my friends tremendously during my time living there. They always give advice about school and campus life. They made my stay at IT really fun and comfortable.`,
    1,
    146,
    8
  ),
  generateComment(
    'gm-real-illini-tower-48',
    'illini-tower',
    'Tatiana V',
    `I choose to live in Illini Tower my freshman year (2015).\nThey are terrible at roommate matching. I had 6 different roommates, and I only really liked one. A lot of dorms are welcoming and everyone wants to get to know each other. Not at Illini Tower. There are cliques, and you stick with them.\nThe washing machines were always broken. The printers were always broken. Maintenance literally walked into my bedroom while I was Sleeping at 8am on a Sunday!  They charge for every little thing. There was mold in the first apartment. I told them about it. They said there was nothing that they could do about it! Management really does not care about students. The model does not look anything like the real thing. The RAs are extremely rude.  One of them was prejudice to international students and minorities. I dont know why he hasnt been fired yet.\nThe food was extremely repetitive. If you are a vegetarian, then the food is perfect for you. Tofu everyday. The only good thing about the dining hall was Tammy who works the desk. She is the sweetest woman.\nOverall, my experience was terrible. I would just save the money and go live in public housing.`,
    -1,
    208,
    10
  ),
  generateComment(
    'gm-real-illini-tower-49',
    'illini-tower',
    'Elsie B',
    `Please note that this review is from someone who lived there the first semester it was open - spring semester of 1967.  I roomed with three friends, and since it was our first year not living in a university dorm, we loved it and had no complaints.  Its interesting to read the current reviews of this building 46 years later.  The one thing that hasnt changed is the slow elevators! In addition, there was no required meal plan, so we prepared all of our own meals.`,
    1,
    6,
    3
  ),
  generateComment(
    'gm-real-illini-tower-50',
    'illini-tower',
    'Kendall Rice',
    `This is absolutely the best place to live on campus, have met the best people in this building and I brag about living here all the time. I have convinced some more friends to come and move into Illini tower. It is the most modern, diverse, inclusive, fun, and beautiful places on the campus. Would recommend to everyone coming in or already here at school!!`,
    1,
    299,
    15
  ),
  generateComment(
    'gm-real-illini-tower-51',
    'illini-tower',
    'Tadeáš Plaček',
    `It has been my first few months as an international student here an I love Illini Tower. The dorms are cool and there is a lot of opportunities to hang out and socialize. Shout out to RAs Tasho and Zach for helping me move in and settle in!`,
    1,
    53,
    15
  ),
  generateComment(
    'gm-real-illini-tower-52',
    'illini-tower',
    'Ariel Brown',
    `I got a tour from one of the desk people named Taylor. She was fantastic and answered all of my questions. I tour a studio. I think this is the place.  I’m excited to live here in the fall!`,
    1,
    103,
    1
  ),
  generateComment(
    'gm-real-illini-tower-53',
    'illini-tower',
    'Evelyn Wai',
    `Very nice swimming pool！ I like it！Never a good choice for living here.`,
    -1,
    14,
    4
  ),
  generateComment(
    'gm-real-illini-tower-54',
    'illini-tower',
    'casey',
    `Illini tower is super pet friendly. It is the only dorm with a full kitchen, allows pets, and actually has good times for when you can get food at the caf. Dee, Logan, and Kelly (3 of the RAs there) always surprise me with new animals they bring in. It makes me so happy and so much less stressed throughout the year!`,
    1,
    291,
    4
  ),
  generateComment(
    'gm-real-illini-tower-55',
    'illini-tower',
    'Alexis Arana',
    `Did not personally live here, but I stayed there every weekend! IT was one of the few dorms that actually allows guests to stay with you. They have a place to actually study and the rooms are nice. Illini Tower food is good and it has everything you need to study so you dont have to make late night trips to the library!`,
    1,
    5,
    15
  ),
  generateComment(
    'gm-real-illini-tower-56',
    'illini-tower',
    'Diana Choi',
    `Overall, Im glad that I chose Illini tower to live in my freshmen year. What I most liked about IT was its location. With a little exaggeration, it took me no more than 5 minutes to go to all my classes this year. Especially if you are in College of Business or College of Media, I would strongly recommend Illini Tower for your next resident hall as all your future lecture halls will be gathered in this Champaign side of campus. As far as food, people say really bad things about it all the time. Personally, I think no matter how good the quality or the taste of foods are, you are going to sick of it after certain amount of time. I agree that IT doesnt always offer the best food, but it is still not too terrible to eat. Lastly, IT offers many side facilities such as movie room, study lounges, and fitness room. The residents assistants are friendly people who are so caring and supportive for their residents all the time. There are a lot of fun activities offered through out the year, as well! You will enjoy your experience at IT as I did :)`,
    1,
    175,
    14
  ),
  generateComment(
    'gm-real-illini-tower-57',
    'illini-tower',
    'Jaunai Parson',
    `I lived at Illini Tower last year and loved it so much I returned this year. The location is great, I never have to walk more than 5 minutes to get  to class, grab food, or meet up with friends. Along with the location, the staff is great and is always helpful and kind. The community that is fostered in this building is what really makes me want to return here for a third year.`,
    1,
    224,
    17
  ),
  generateComment(
    'gm-real-illini-tower-58',
    'illini-tower',
    'Benjamin Sturm',
    `This place was absolutely awful to live at!  This is THE single most over-priced living environment that I have ever seen!!!  Let me start with some of the obvious problems, THERE WAS MOLD IN THE SHOWER FOR THE ENTIRE YEAR THAT I LIVED THERE!!!  No one would come clean it up, and I couldnt afford the equipment to handle such a task since Im in college!  My roommates were absolutely the worst, they wouldnt pick up or bathe!  We were at each others throats by the end of the year!  I always got sick while eating at IT!  They hire people who were previously convicted, one of which was a freaking cross dresser!  Not even joking, he has been seen across campus in a dress attempting to pick up young men.  They fired the only good employee that they had for the stupidest reason ever (my RA was fired for lending someone a card with money on it for laundry)!  In summary, I would never recommend anyone ever living here ever again!  Its just for foreign students who dont know any better!!!`,
    -1,
    152,
    18
  ),
  generateComment(
    'gm-real-illini-tower-59',
    'illini-tower',
    'Flavia Adewumi',
    `Called in to check out this place for a friend who has a child who will be attending in the fall of 2023. The fabulous young lady who answered the phone, her name was Kelly Lucas, who is an RA.  Convinced me that this place was the best place to live for freshman’s coming in she convince me that this would be an experience of a life time.  She sounds so pleasant and smart and had lots of great things  to say about the unit I was thinking of. Thanks so much for the information Kelly.`,
    1,
    199,
    7
  ),
  generateComment(
    'gm-real-illini-tower-60',
    'illini-tower',
    'Aldo Davila',
    `Illini Tower introduces a certain level of nuance prestige to an otherwise lack luster college dorming experience.\nLiving in luxury at Illini Tower is made possible by its proximity to countless social hubs as well as all the academic buildings.\nLeasing an apartment in Illini Tower has granted me the experience of meeting new people from all around the world that I may have otherwise not had the chance to fraternize with.\nThe facilities in Illini Tower also make it easy to balance a healthy life style focused on academics, fitness, healthy eating, and socializing.\nThe amazing atmosphere has truly motivated me to renew my lease for a second consecutive semester. I couldn’t and wouldn’t imagine calling any other place home!`,
    1,
    139,
    12
  ),
  generateComment(
    'gm-real-illini-tower-61',
    'illini-tower',
    'Sarah Morrow',
    `Living at Illini Tower has been an enjoyable experience, and I would recommend it. From the easily accessible accommodations such as the printers in the think lounge, and the new washers and dryers that are available in the building to the fully capable staff it is a great place to live especially for those first adjusting to campus. The resident assistants are great about putting aside time in their busy schedules to plan floor events, and they also help and encourage residents in their academics.`,
    1,
    39,
    17
  ),
  generateComment(
    'gm-real-illini-tower-62',
    'illini-tower',
    'Gabby Carreño',
    `I have been living at Illini Tower for the past 3 years and it is safe to say that the place keeps improving as the years go by. The staff pays attention to the residents needs, and fixes whatever problem they might have, all while doing such an amazing job. The dining hall food can get repetitive, but we do have the option to cook our own meals at our own apartment and if you ask the dining staff nicely, they do take recommendations. As a business student, the location of Illini Tower is the best. The college of business is nearby so literally, I only have to walk for 5 minutes to get to my classes. Illini Tower is always hosting events throughout the year to try to build a better community for the residents to get them to interact with each other and participate in fun activities. If youre looking for a great place to live at during your college years, Illini Tower is an excellent option to consider.`,
    1,
    151,
    13
  ),
  generateComment(
    'gm-real-illini-tower-63',
    'illini-tower',
    'Jazmine Saavedra',
    `I have lived in Illini Tower for two years and I can honestly say it is a great place to live and it offers more than just a spacious dorm. Compared to other residence halls, this dorm is near to an apartment style dorm with a full kitchen and a private bathroom. One of the best things about Illini Tower is not only the dorm styles but also the amenities, students have floor lounges where they can study or simply watch tv and there’s even a 24/7 study lounge available for us to use. There’s even a movie theatre and a gym open for our access. The staff is very welcoming and helpful, they’re always looking to improve communication with residents and hold fun events.`,
    1,
    172,
    5
  ),
  generateComment(
    'gm-real-illini-tower-64',
    'illini-tower',
    'Maria Michelis',
    `I love Illini Tower! Honestly, people dont realize how good they have it. Where else on campus will you be able to live your first two years where the rooms are bigger than a closet, have your own kitchen, and private bathroom where you will not have to share it with 50+ people. And you have a dining hall, gym, movie theater, and a think lounge all in one building. The price is cheap compared to what university housing will cost you and what you get out of it. 110% recommend!`,
    1,
    195,
    18
  ),
  generateComment(
    'gm-real-illini-tower-65',
    'illini-tower',
    'Joe Liao',
    `Tasho, zack, Logan, and chole are my favorite RAs here at Illini tower. The service the provide to all the students here are amazing. They work so fast and the make sure everything we need is done as soon as possible. The building here is as nice and everything you need for an apartment is here.`,
    1,
    76,
    0
  ),
  generateComment(
    'gm-real-illini-tower-66',
    'illini-tower',
    'A Google User',
    `I highly recommend Illini Towers as a home away from home for your child.\n\nThe General Manager of the facility, Roy, is a major reason for my recommendation.  On move in day, Roy introduced himself personally to our family and explained to our daughter that he was available.  Before we left, we did need his attention to repair some minor but important mechanical issues.  Even though it was move in day and with the chaos just that brings, Roy had our issues addressed.  He followed up with our daughter the following day to make sure that she was settled.  He made himself visible throughout the semester in the hallways, always a friendly face.    On several other occasions, Roy and the staff at Illini Towers went out of their way to ensure that our child had what was needed.\n\nWe’d already had two very successful years with other children living in the facility, but Roy has ensured that this year would be great.  Needless to say, Roy has endeared himself and Illini Towers to us.  He continually has guided us through some hurdles of the first year away from home.  He has provided a safe, comfortable and friendly place to live and study in Champaign.`,
    1,
    166,
    6
  ),
  generateComment(
    'gm-real-illini-tower-67',
    'illini-tower',
    'Raegan W',
    `Omg I love Illini Tower!!! My RA Chloe Solarte has made my freshman experience a true blessing at this magnificent residence! The hallway tiles sparkle with Chloes elbow grease and the ceiling chandeliers reflect her outstanding attitude. Just last week, I was sick in bed with the most horrible cold, when Chloe strode into my room with a bowl of hot chicken noodle soup on her head. Instantly, I was cured of my ailment. Thank goodness for Chloe at Illini Tower - highly recommend living here!`,
    1,
    221,
    10
  ),
  generateComment(
    'gm-real-illini-tower-68',
    'illini-tower',
    'Tracey Mahoney',
    `This has been the worst experience. Illini Tower does not answer the phone, return calls or emails. They advertise microwaves in the kitchen (listed on website) but there are none and I was told "too bad." Kitchen has no drawers at all. They tried to tell us we did not have a lease and wanted to have us apply again and charge a second application fee. We were required to  prove payment was made and lease was signed by them. They are one of the most unprofessional companies I have had to deal with. Renter beware.`,
    -1,
    3,
    7
  ),
  generateComment(
    'gm-real-illini-tower-69',
    'illini-tower',
    'K Han',
    `If you have a choice between here, dorms, or apartment, PLEASE for the love of everything holy do NOT live here. When I first moved in, my room was completely trashed, with leaky ceilings, water damage on the floors, broken kitchen lights, broken toilets, etc. You would think after living here for almost 2 months now, and after several maintenance requests, it would be fixed now, but no. This place is horrible, the required meal plan is horrible, the food is horrible, everything is horrible. Not only that, they charged me an extra 200 dollars for a tax that we werent told is part of the rent/meal plan charge. They steal your money and expect you to enjoy your stay here. STAY AWAY FROM ILLINI TOWER.`,
    -1,
    41,
    12
  ),
  generateComment(
    'gm-real-illini-tower-70',
    'illini-tower',
    'Amir Abusharif',
    `Illini Tower is by far one of the most impressive residence halls on campus.  They are the most friendly people who are just looking to make your home away from home experience as comfortable as they can.  The dinning hall has such a variety in what they prepare for each meal.  The maintenance staff would make repairs in my room, any issue big or small they would fix in a timely manner.   No matter where you come from Illini Tower is an absolutely phenomenal place to reside.`,
    1,
    23,
    7
  ),
  generateComment(
    'gm-real-illini-tower-71',
    'illini-tower',
    'Jamie Im',
    `Illini tower is truly one of the best residence halls in Champaign!\n\nMy RAs Logan and Ryan are super thoughtful and they even helped me print out my lab reports for my chemistry lab class!\n\nI would highly recommend staying here, especially for your freshman year!`,
    1,
    261,
    0
  ),
  generateComment(
    'gm-real-illini-tower-72',
    'illini-tower',
    'Adrian Lara',
    `Rooms are way better than having a dorm and I think they are actually cheaper. The food is pretty good too. I just wish the pool cues weren’t broken. Props to Kelly for always being able to help.`,
    1,
    249,
    16
  ),
  generateComment(
    'gm-real-illini-tower-73',
    'illini-tower',
    'Sean Talmage',
    `Illini Tower is in a great location and its modern, affordable, great view, decent food and the staff are motivated to help as best they can. Great place to live on campus and there are especially nice RAs like Logan, Zack, and Tasho.`,
    1,
    2,
    19
  ),
  generateComment(
    'gm-real-illini-tower-74',
    'illini-tower',
    'Omar Ahmed',
    `After trying out a lot of different residences, I am glad to say I have finally found a place to call home. Illini Tower offers many great services, none of which come close to the amazing customer service that Tasho offers. Tasho has never let me down, and was always respectful and kind. I will definitely be offering him a job opportunity once I finish school and start my own company,`,
    1,
    222,
    7
  ),
  generateComment(
    'gm-real-illini-tower-75',
    'illini-tower',
    'Juseok Oh',
    `Card keys don’t work so you’re often locked outside your room. Flooding happens at winter. There are many many additional fees aside from rent. Room has mold in it and doorknobs are rusty. You can live in far better conditions paying less rent in other apartments`,
    -1,
    63,
    15
  ),
  generateComment(
    'gm-real-illini-tower-76',
    'illini-tower',
    'John Balch',
    `I would definitely recommend Illini Tower. Initially, I had reservations, but in almost each area or concern, I was proven wrong. While some complain about the food, there are almost always alternatives in case one does not like want the main courses being served. The staff of IT is incredibly congenial and open to suggestions, and quick to fix what is broken. While I understand that its possible to be paired living with people youre incompatible with, I have had great experiences with all of my roommates. The rooms are expansive and not many students in my position can say they have a living room, kitchen and bathroom their Freshman year. While the internet connection is lacking, Im assured that a new service is being introduced soon. Overall, a huge step up from any other dorm on campus, private certified or not.`,
    1,
    167,
    6
  ),
  generateComment(
    'gm-real-illini-tower-77',
    'illini-tower',
    'Kayla Dixon',
    `I live at IT currently and I love my RA Kennedy to the moon and back! She’s more like a friend than an RA and she’s so fun`,
    1,
    79,
    13
  ),
  generateComment(
    'gm-real-illini-tower-78',
    'illini-tower',
    'Sujay Reddy',
    `Illini Tower has been a great place to live and especially with the dining option, I am glad that I am living here instead of public housing. My RA Logan has been helpful and has made freshman year better!`,
    1,
    268,
    13
  ),
  generateComment(
    'gm-real-illini-tower-79',
    'illini-tower',
    'Divya Robin',
    `Loved Illini Tower!! The RAs were awesome, and the living style was amazing. It is very comfortable to live with 4 people, and it gave my college experience a very homey feel. Whenever my roommates and I were down, we would talk to our RA, the staff is awesome! Our floor was very close and did many activities together. One time we even made guacamole together! Illini Tower would have building events, such as halloween parties, and a casino night (where we were able to win really cool prizes). Whenever my roommates and I needed a repair, maintenance was there to help us whenever we needed it. Definitely recommend Illini Tower to anyone. It will make your experience at the University of Illinois one where you feel you are in a place where you matter.`,
    1,
    175,
    9
  ),
  generateComment(
    'gm-real-illini-tower-80',
    'illini-tower',
    'Patrick Alonso',
    `Logan, Zach, and Tasho are goats I love living with them. They make Illini Tower feel like a home away from home and have always been super welcoming and supportive. Keep up the great work guys!`,
    1,
    39,
    10
  ),
  generateComment(
    'gm-real-illini-tower-81',
    'illini-tower',
    'Sriram mysore',
    `Georgia from Illinois Tower was extremely helpful and courteous. She provided best information and help. Her services were outmost professional. Very pleased with her service and provide her 5 Star for her professional service.`,
    1,
    3,
    18
  ),
  generateComment(
    'gm-real-illini-tower-82',
    'illini-tower',
    'Ben Shlau',
    `I had problems from Day 1 in August. When I moved in I was given the wrong mail box key, and a bedroom key that also didnt work. I was assured that both of these issues would be solved within the next couple days. Fast forward to October, and I still dont have either functioning key, so I had to get maintenance to open the mailbox for me to get my vital mail (this took 3 days to get them to do). After this, they finally tried to resolve the problem by creating new mail box keys and replacing the lock for me and my roommates.\n\nOn top of this, throughout the year many people had trouble with the card to get into their rooms (similar to a hotel card), including me. Wed often need to go to the front desk to get it re-magnetized so we could enter our rooms; this wasnt much of a problem until a week before Thanksgiving Break when the machine that re-magnetized the cards broke. For the remainder of that week not only was this information not disclosed to residents but when youd ask the front desk for an update on when it would be fixed they said by the end of break. Fast forward to everyone coming back, and this still wasnt fixed. Meaning me and many other residents either had to wait until a roommate was home, or have their door crowbarred open. We were then promised this machine would be fixed before Winter Break. This went on and on until finally in LATE-JANUARY we were told theyd be replacing everyones doors with new locks to support a new system with fobs instead of cards. Not only did this mean I couldnt enter the dorm I was paying for, but management at no point sent communication to residents informing us of the problem, the solution and the timeline of the 3 month fiasco.\n\nThese were only a small number of management problems that scratch the surface, not including the sometimes inedible food served at the dining hall (although to their credit the food became a lot better in March after upper management visited, albeit with 2 months of school left), and a shady practice of RAs giving free pizza to residents that left 5 star reviews with their names mentioned with the promise of RAs getting bonuses.`,
    -1,
    277,
    12
  ),
  generateComment(
    'gm-real-illini-tower-83',
    'illini-tower',
    'Syed Hadi Jawed',
    `Living here was great. I was really amazed at how welcoming the staff are and how well trained the RAs are in making all of us feel like we all belong. Special thanks to Tasho who went above and beyond in showing hospitality and friendliness.`,
    1,
    223,
    15
  ),
  generateComment(
    'gm-real-illini-tower-84',
    'illini-tower',
    'isabel guan',
    `It is such a nice place that you can enjoy your freshman year. Illini tower allows you to view the waterfall from the main hall, enjoy fire alarm in the midnight, and listen to workers’ music since 7am during holidays and finals. Enjoy the great illini tower and welcome home.`,
    -1,
    134,
    8
  ),
  generateComment(
    'gm-real-illini-tower-85',
    'illini-tower',
    'Tommy B',
    `My son spent there his freshman year and survived so I guess 1 star is a given. Parents what you see while touring the facility is nothing like the actual room you are paying for. Layout of the rooms is exactly the same but the condition is horrible. The tour room looked really good but my sons room looked almost like a 3rd world apartment. Beware of the extra fees and something that is called a security deposit at the beginning of the lease and non refundable fee at the end. I wish Id save my receipts​ but oh well I lost it and there goes my $350. I guess the place is liveable and if you decide to go with them make sure to keep a copy of your contract and all receipts. Good luck but I wouldnt recommend it.`,
    -1,
    9,
    14
  ),
  generateComment(
    'gm-real-illini-tower-86',
    'illini-tower',
    'Alex Wang',
    `DO NOT choose this dorm. I was drawn in by the promise of AC, which as a person with asthma and hyperhidrosis is very important for me, but that benefit pales in comparison to the myriad of problems in this dorm. My ceiling has leaked seven times in two different places this semester alone, and maintenance’s solution was to provide me with a dehumidifier and recaulk the upstairs shower, which did not fix the problem. The elevators are slow (there are only 4 for 16 floors, and at least one of them usually doesn’t work). As a result, it often takes upwards of 5 minutes for the elevator to arrive, which risks making you late to class. The fire alarm goes off so often many students don’t even bother leaving anymore. The walls are paper thin, so anything over a whisper from adjacent rooms you will hear. The emergency number for after-hours assistance (i.e. you lock yourself out of your room, there is a leak, etc.) is often unmanned and has had a full voicemail for over a week. Don’t give the crooks that run this place any more money, and don’t put yourself through the hell that is living here. FIND A DIFFERENT DORM.`,
    -1,
    121,
    17
  ),
  generateComment(
    'gm-real-illini-tower-87',
    'illini-tower',
    'Lillian Tan',
    `I really enjoy staying here! The rooms are all super clean and I love having my own kitchen. The RAs are all super chill. RA Zach and Tasho were the best!`,
    1,
    101,
    17
  ),
  generateComment(
    'gm-real-illini-tower-88',
    'illini-tower',
    'Emma White',
    `Tasho, Zach, Logan, Dan and Kelly are great RA’s! IT is a great option for freshman who are looking to have more of an apartment style dorm and it’s close to campus! But the food is a little questionable.`,
    1,
    287,
    11
  ),
  generateComment(
    'gm-real-illini-tower-89',
    'illini-tower',
    'Zean Li',
    `This is literally the worst apartment that I have ever been. First, there is no stairs that can take you up to your floor. Everywhere you go, you must take the elevator, and the elevator is down from time to time. The door card is easily dis-magnetized, you can’t put it with other cards or your phone. The fire alarm was triggered easily, several weeks ago the fire alarm kept alarming for over 12 hours and no one was able to fix it. The bedroom is small, and during winter, the AC can’t block the wind so it’s always freezing cold. If you are an incoming student, don’t live here, leave!`,
    -1,
    199,
    6
  ),
  generateComment(
    'gm-real-illini-tower-90',
    'illini-tower',
    'Joyce Li',
    `One time I was very unhappy with the dining hall food and expressed this to my friends in the dining hall. Tasho, Zach, and Logan actually went out and bought me Potbelly after overhearing me complain and told me it was on them. Great RAs, they went out of their way to ensure I was happy`,
    1,
    132,
    4
  ),
  generateComment(
    'gm-real-illini-tower-91',
    'illini-tower',
    'Damon',
    `Look hard at your other options.  Dining hall regularly is closed or does not always have basic food items like milk.  Sometimes no menu posted.  When dining hall is not open, they order pizza or sandwiches and dont order enough and it is a free for all in the lobby.  Meal plan only works in Illini Tower.....last few weeks of Fall Semester they couldnt keep their dining hall open so gave students campus wide meal card access which was 1,000 times better than IT food.\nIn January they had a significant water line break and the alarms went off for almost 20 hours straight......told residents it was okay to go back to their rooms when I am sure every fire marshall in the country would tell you that is not safe and I am sure the owner of Illini Tower, Campus Living Villages, their legal team would not approve.  Took almost 2 weeks at the beginning of the fall semester to get a window unit A/C fixed, even though it was reported upon inspection at move in.  Do yourself a favor and look for something better than living here.`,
    -1,
    15,
    8
  ),
  generateComment(
    'gm-real-illini-tower-92',
    'illini-tower',
    'Erin Rotundo',
    `Move in was great. Staff was available for questions. We had an issue with the ac unit in our daughters room and a new one was replaced within a few hours. We were impressed with the move in process.`,
    1,
    90,
    2
  ),
  generateComment(
    'gm-real-illini-tower-93',
    'illini-tower',
    'Eddie Lennon',
    `Living here has been amazing. Great place to help freshmen adjust to college life. Had an amazing RA as well, Tasho Madondo was a huge help to me whenever I needed it. Wouldn’t suggest a better place to live.`,
    1,
    137,
    10
  ),
  generateComment(
    'gm-real-illini-tower-94',
    'illini-tower',
    'Luminor',
    `Room (B2 private) ★★★★☆\nAverage level cleaness/ well functioning appliances/ blocking fair amount of noise from neighbors.\n\nHeat/ AC system ☆☆☆☆☆\nYou cannot control the temperature urself. One of the biggest reason why I am leaving IT.\n\nFood ☆☆☆☆☆\nGross and dirty. But It is mandatory to have meal plan to live here.\n\nMaintanance ★★☆☆☆\nTakes few days ~ week to come. Many said they are rude but they were fine to me.\n\nPeople in leasing office ☆☆☆☆☆\nTotally a joke.\n\nLocation ★★★★★`,
    -1,
    4,
    14
  ),
  generateComment(
    'gm-real-illini-tower-95',
    'illini-tower',
    'Julie Hampton',
    `I would give zero stars if Google would alllow. W are unable to reach someone to inquire about a balance on his account. We have tried calling (mailbox is full), no emails are being returned, and he cant login to the portal to pay even if we didnt have questions. This has been an ongoing issue throughout his time living there. I will be happy to share more as to why it would be a zero star and will if we dont get some assistance soon.`,
    -1,
    77,
    4
  ),
  generateComment(
    'gm-real-illini-tower-96',
    'illini-tower',
    'Dustin Reeder',
    `There was flooding twice in the fall sememster. The first time was early in the semester and resulted in a week of fans and water damage.  The second time resulted in a month of repairs being done with fans in the room after over an inch of standing water was in the 4th floor rooms.  They refused to test for mold, refused to communicate trying to resolve finances.\n\nEdit: Two Weeks after this review I havent heard from them.  I emailed them through their website portal a week ago and still havent received a response.`,
    -1,
    178,
    3
  ),
  generateComment(
    'gm-real-illini-tower-97',
    'illini-tower',
    'Emma Coonan',
    `This place is so nice! Im super lucky to have Logan as my RA this year. I was telling him how unfortunately I need glasses, which would be extremely costly for me. He instantly came up with a solution, and performed LASIK eye surgery on me right in the study room, saving me hundreds of dollars! Thank you Logan!`,
    1,
    142,
    18
  ),
  generateComment(
    'gm-real-illini-tower-98',
    'illini-tower',
    'Neon Riahn',
    `I was a prospective student at UICI and I toured a lot of housing options on campus. Everyone tells you that the nicest options are Greek houses, Bromely, or Illini Towers (IT). So I looked at those, some of the public dorms, and IT was by far the nicest housing. The Ikenberry dorms are nice as well, but hard to get into and didnt have the warm feel of IT. The rooms are gorgeous and the staff were more than helpful when it came to not only helping get a dorm and quickly answering any questions I had.`,
    1,
    179,
    0
  ),
  generateComment(
    'gm-real-illini-tower-99',
    'illini-tower',
    'Kristie Krigbaum',
    `Worst mistake of my college career was living here for a semester. Besides the location, everything else was horrible. The amenities are not worth what you pay for them. The food is horrible, the laundry is way too expensive, rooms are filthy upon move in, and the printers never work. The administrators and RAs are rude and careless people. They dont care about students, just about your money.`,
    -1,
    288,
    4
  ),
  generateComment(
    'gm-real-illini-tower-100',
    'illini-tower',
    'Amari Maisonet',
    `Super close location to the quad. Amazing lounges and study spaces. Love having a kitchen in suite. RA staff is friendly and likes to get to know their residents and interact with them.`,
    1,
    260,
    8
  ),
  generateComment(
    'gm-real-illini-tower-101',
    'illini-tower',
    'Evan',
    `Illini tower is an amazing place to live and definitely glad I chose to live here instead of public housing. The RAs are super helpful especially Logan, Zach, and Tasho.`,
    1,
    165,
    10
  ),
  generateComment(
    'gm-real-illini-tower-102',
    'illini-tower',
    'Julia Kruczak',
    `Living at IT has been so much fun, there are so many fun activities organized by the RAs. I love the atmosphere and the people!`,
    1,
    72,
    13
  ),
  generateComment(
    'gm-real-illini-tower-103',
    'illini-tower',
    'Hadi Jawed',
    `It was a pretty fun experience living here. Tasho, the RA, really made it easy for me and others to get around and learn about the place. It was a really warm welcome and I enjoyed every minute!`,
    1,
    16,
    6
  ),
  generateComment(
    'gm-real-illini-tower-104',
    'illini-tower',
    'andy Kelly',
    `I thought having an RA would be the actual worst, but Logan Talmage, Tasho and and Zach have been very kind souls through my experience here so far. They have been very informative and helpful through my days here. These three have always been willing to assist with any questions or concerns that I have had! #GoatRA’s`,
    1,
    101,
    4
  ),
  generateComment(
    'gm-real-illini-tower-105',
    'illini-tower',
    'Murphy Lynch',
    `DO NOT LIVE HERE. im begging yall go anywhere but here. every single part of the leasing process is a bait and switch, dont be fooled by all the cute balloons and cupcakes in the lobby (that was JUST fixed after being destroyed by a flood two months ago). all the staff in the building doesnt care about residents, and management straight up lies to residents all the time (all the way up to the company owners as well). scam doesnt even begin to cover it.`,
    -1,
    219,
    19
  ),
  generateComment(
    'gm-real-illini-tower-106',
    'illini-tower',
    'Alba Fleming',
    `It is exciting to know my granddaughter is looking at Illini Tower as her new home away from home.   We sought safety, fun and convenience and think this facility (after our visit) had all we required.\n\nThe students we spoke to were kind and helpful in giving us the real "nitty gritty" of what goes on behind the scenes...Yes, all new student are a little fearful of leaving home, but they assured us they adjusted and are doing fine.\n\nThe amount of activities available will hopefully let Daevona fell relaxed when she has an opportunity (because studying is first).  Thank you for helping us make this very important decision for her future.   Looking forward to moving her in.\n\nLenora Walker\nThe Grandma that rocks`,
    1,
    225,
    13
  ),
  generateComment(
    'gm-real-illini-tower-107',
    'illini-tower',
    'Eleni Johnson',
    `This place is marvelous. All the staff is so welcoming and kind especially my RA Logan (shmo). Last summer he saved my family from a pack of wolves. Fought them all off with his bare hands. ⭐️⭐️⭐️⭐️⭐️ guy`,
    1,
    259,
    15
  ),
  generateComment(
    'gm-real-illini-tower-108',
    'illini-tower',
    'Rachael Adewumi',
    `Christy was an excellent help, I got lost trying to find my way up in the building and she noticed and helped me get to my destination! Very sweet girl.`,
    1,
    55,
    9
  ),
  generateComment(
    'gm-real-illini-tower-109',
    'illini-tower',
    'Miguel E',
    `My family and I went earlier this week to Illini Tower and we were warmly received by the staff. Angie an RA gave us a great tour and made sure to answers all our questions which made it a helpful experience`,
    1,
    241,
    11
  ),
  generateComment(
    'gm-real-newman-0',
    'newman',
    'Jacob Sellett',
    `Beautiful church both before and after the renovation. St. Johns is simply the best place on campus to gather, grow, and meet friends youll hold on to for life. As a residence hall, the amenities are excellent and the staff are all committed to their mission. I highly recommend Newman Hall for prospective residents and St. Johns for all UIUC students seeking a vibrant Catholic community.`,
    1,
    122,
    0
  ),
  generateComment(
    'gm-real-newman-1',
    'newman',
    'Frederick Bradbury V',
    `This is a great campus church. The artwork and stained glass are amazing. Its well worth a visit.`,
    1,
    67,
    1
  ),
  generateComment(
    'gm-real-newman-2',
    'newman',
    'Simon R Tiffin',
    `Simply the greatest place for Catholic worship on the University of Illinois campus. St. Johns offers so many opportunities to get involved and deepen your faith, and the worship space is one of the most beautiful I have ever seen. 9pm worship on Sundays is by far my absolute favorite--the candlelight vibes are very reverent and peaceful.`,
    1,
    258,
    12
  ),
  generateComment(
    'gm-real-newman-3',
    'newman',
    'Jenny A',
    `Beautiful church, amazing choir and passionate priests.  Catch an Easter Saturday Mass here if you can it will blow you away with reverence. Newman hall is a great housing option for kids to be in a nurturing environment with other nice kids and great food and a great campus location.`,
    1,
    72,
    17
  ),
  generateComment(
    'gm-real-newman-4',
    'newman',
    'Vetri Mahesh',
    `As a parent, Im thrilled to recommend Newmans dormitories for students. The facilities are exceptional, offering unparalleled convenience and safety. I appreciate the thoughtful design and attention to detail in the housing. The staff are kind, caring, and dedicated to providing a supportive environment. The food is top-notch, and I love knowing my child is well taken care of. Thank you, Newman, for providing a comfortable and convenient home away from home for our students.`,
    1,
    175,
    19
  ),
  generateComment(
    'gm-real-newman-5',
    'newman',
    'David Leatherwood',
    `I would highly recommend Newman hall.  They have a really fun move in day!  Tons of helpful staff that help your students move and make them feel welcome. The food is fantastic.  They have great events for the students every week.`,
    1,
    120,
    14
  ),
  generateComment(
    'gm-real-newman-6',
    'newman',
    'Jason Gutmann',
    `I love coming here for Mass! It is such a gorgeous Church and the priests are very kind and dedicated.`,
    1,
    28,
    15
  ),
  generateComment(
    'gm-real-newman-7',
    'newman',
    'Noah Legenski',
    `Great dorm to live in for all students! There is a fair share of practicing Catholics, so it’s easy to get involved, but no judgement is passed if you don’t want to. Best food of any dorm on campus and extremely convenient mass times!`,
    1,
    262,
    12
  ),
  generateComment(
    'gm-real-newman-8',
    'newman',
    'Peter Roeder',
    `Really pretty church`,
    1,
    222,
    17
  ),
  generateComment(
    'gm-real-newman-9',
    'newman',
    'Frederick Dabbelt',
    `Im lucky to be able to us it and it offers true information`,
    1,
    264,
    9
  ),
  generateComment(
    'gm-real-newman-10',
    'newman',
    'Colette Lucille Photography',
    `St. Johns Catholic Newman center is nestled in the heart of the UOIC campus and is the most perfect church community for the college aged. I had the honor of photographing a wedding here and it was a dream! Father Chase said the most beautiful mass and the church was absolutely stunning both inside and out. I look forward to returning soon!`,
    1,
    223,
    15
  ),
  generateComment(
    'gm-real-newman-11',
    'newman',
    'Rebecca McGreal',
    `Very nice, clean & safe facility. A warm welcoming for parents & students. First time for us to send a kid to college. Felt at peace leaving daughter Newman Hall. Beautiful church & lovely mass for college kids & their families.`,
    1,
    217,
    9
  ),
  generateComment(
    'gm-real-newman-12',
    'newman',
    'Jeff Neal',
    `A great place a wonderful sanctuary and parishioners.  The priests were willing to connect and personable.  The facility has great spaces for study and contemplation.  Beautiful with a peaceful secure stable feeling.`,
    1,
    184,
    14
  ),
  generateComment(
    'gm-real-newman-13',
    'newman',
    'Jackie Jordan',
    `This is my daughters 2nd year at Newman Hall. It is a welcoming environment and community. It truly provides a home away from home and a place to be "centered."  The location is right on campus, and the awe and God inspiring St Johns Chapel is  a short walk from the dorms. Living here, my daughter is more likely to to maintain a Catholic focus and avoid the secular indoctrination that can be promoted in classes and campus lifestyles.`,
    1,
    225,
    2
  ),
  generateComment(
    'gm-real-newman-14',
    'newman',
    'Matthew Lugardo',
    `A fantastic place to find calm in the hectic life of campus. The chaplains and staff are all great, as is the food.`,
    1,
    291,
    6
  ),
  generateComment(
    'gm-real-newman-15',
    'newman',
    'Dan Korenchan',
    `Absolutely wonderful place! Newman offers tons of student-run ministries to help young men and women grow, whether affiliated with the Catholic faith or not. Lively and fun living environment as well.`,
    1,
    116,
    3
  ),
  generateComment(
    'gm-real-newman-16',
    'newman',
    'Adam Camp',
    `High quality amenities and dining, open to the public during the day.  With competitive prices and the most vibrant student body on campus, this is more than a residence hall; this is home.`,
    1,
    193,
    0
  ),
  generateComment(
    'gm-real-newman-17',
    'newman',
    'Lazaro Ramos',
    `I was glad to call for place my home in campus for 4 years. The chapel is beautiful and the most important "classroom" on campus, where I learned my greatest lessons.`,
    1,
    133,
    16
  ),
  generateComment(
    'gm-real-newman-18',
    'newman',
    'Kaitlin Vahling',
    `I attended Mass at SJCNC during my undergraduate years at Illinois. Beautiful church, caring priests & nuns, many opportunities to learn & grow in my Catholic faith.`,
    1,
    62,
    18
  ),
  generateComment(
    'gm-real-newman-19',
    'newman',
    'SHIRLEY BECKMIER',
    `Beautiful Church could tell that our God was there. The priest made all the difference in the world at the wedding ceremony thats wonderful`,
    1,
    21,
    2
  ),
  generateComment(
    'gm-real-newman-20',
    'newman',
    'Myeong Caleb Lee',
    `It is a beautiful Chatholic church. I love to hear their Pipe Organ and cantors singing over the mass.`,
    1,
    248,
    19
  ),
  generateComment(
    'gm-real-newman-21',
    'newman',
    'alice murray',
    `Fr Brokaw is an amazing homilist!! Do yourself a spiritual favor and go to St John’s!`,
    1,
    202,
    12
  ),
  generateComment(
    'gm-real-newman-22',
    'newman',
    'Giovanna Theisen',
    `Beautiful church.  Parking was difficult during the day. Homilies were inspirational!\nMostly college students`,
    1,
    78,
    17
  ),
  generateComment(
    'gm-real-newman-23',
    'newman',
    'Charles Morton',
    `They are serving all of us here. Daily communion. Now open visiting times. Lots more happening there. Come Holy Spirit!`,
    1,
    192,
    9
  ),
  generateComment(
    'gm-real-newman-24',
    'newman',
    'Joel Sarmiento',
    `Definitely owe much of my development during college to this place. If you desire to seek truth, beauty, or goodness, this is the place to be!`,
    1,
    1,
    7
  ),
  generateComment(
    'gm-real-newman-25',
    'newman',
    'Rafey Syed',
    `Beautiful Church like building, one of many beautiful architectural buildings at Urbana Champaign`,
    1,
    290,
    17
  ),
  generateComment(
    'gm-real-newman-26',
    'newman',
    'Totustuus3',
    `Best Newman Center in the country with a beautiful and devout legacy.`,
    1,
    48,
    1
  ),
  generateComment(
    'gm-real-newman-27',
    'newman',
    'Morgan S',
    `Dining hall open to public. $9 lunch, all you can eat, including a drink.`,
    1,
    182,
    1
  ),
  generateComment(
    'gm-real-newman-28',
    'newman',
    'Photography by Erin B.',
    `Gorgeous venue for a wedding!`,
    1,
    101,
    13
  ),
  generateComment(
    'gm-real-newman-29',
    'newman',
    'Juan Pablo M',
    `They took my sons application fee and then immediately notified that there were no rooms available. Do not apply!`,
    -1,
    134,
    16
  ),
  generateComment(
    'gm-real-newman-30',
    'newman',
    'Leo Kirsch',
    `Best dorm ever conceived. I didnt know how good I had it until I left! Cherish it you guys!!!`,
    1,
    207,
    5
  ),
  generateComment(
    'gm-real-newman-31',
    'newman',
    'Zuzu Madanat',
    `Wonderful place with great priests and the community of believers is on fire for the faith and a fun bunch.`,
    1,
    71,
    16
  ),
  generateComment(
    'gm-real-newman-32',
    'newman',
    'Michael Cannon',
    `Jen and Cindy were tremendously welcoming and individually focused. Ready for fall 2017!`,
    1,
    273,
    0
  ),
  generateComment(
    'gm-real-newman-33',
    'newman',
    'Aliza James',
    `One of the most beautiful and peaceful places on campus`,
    1,
    297,
    4
  ),
  generateComment(
    'gm-real-newman-34',
    'newman',
    'Chris Johnson',
    `Great place to live, we are very happy with their offering`,
    1,
    194,
    15
  ),
  generateComment(
    'gm-real-newman-35',
    'newman',
    'Sam Kopec',
    `Loved the cafeteria until I tried the oranges. Pretty disappointed`,
    -1,
    212,
    3
  ),
  generateComment(
    'gm-real-newman-36',
    'newman',
    'Morgan Miller',
    `Wonderful people, wonderful church, a wonderful place to live.`,
    1,
    140,
    4
  ),
  generateComment(
    'gm-real-newman-37',
    'newman',
    'Layton Alfreda',
    `Beautiful!! The presence of God is truly felt.`,
    1,
    40,
    3
  ),
  generateComment(
    'gm-real-newman-38',
    'newman',
    'EL PARAISO STAR A',
    `Very beautiful church peaceful`,
    1,
    265,
    9
  ),
  generateComment(
    'gm-real-newman-39',
    'newman',
    'Nick B',
    `Send your kids here. You cant do better for them.`,
    1,
    172,
    16
  ),
  generateComment(
    'gm-real-newman-40',
    'newman',
    'Paige Bakker',
    `Large church very nice service`,
    1,
    205,
    9
  ),
  generateComment(
    'gm-real-newman-41',
    'newman',
    'Nicholas Hall',
    `Beautiful chapel and caring pastor`,
    1,
    258,
    9
  ),
  generateComment(
    'gm-real-newman-42',
    'newman',
    'Allen Darby',
    `Big rooms and pool tables`,
    1,
    300,
    4
  ),
  generateComment(
    'gm-real-newman-43',
    'newman',
    'Wei-Chia Su',
    `Nice place for gathering`,
    1,
    157,
    17
  ),
  generateComment(
    'gm-real-newman-44',
    'newman',
    'Justin Frank',
    `This place is like a second home to me`,
    1,
    155,
    0
  ),
  generateComment(
    'gm-real-newman-45',
    'newman',
    'Amber Bohlen',
    `Excellent help and nice people`,
    1,
    110,
    16
  ),
  generateComment(
    'gm-real-newman-46',
    'newman',
    'B Joseph Smith',
    `Welcoming and devout community.`,
    1,
    265,
    11
  ),
  generateComment(
    'gm-real-newman-47',
    'newman',
    'franck terence',
    `Your home away from home`,
    1,
    74,
    6
  ),
  generateComment(
    'gm-real-newman-48',
    'newman',
    'TIANWEI CHEN',
    `Plain canteen,  plain food`,
    1,
    185,
    1
  ),
  generateComment(
    'gm-real-newman-49',
    'newman',
    'leila hernandez',
    `Beautiful place`,
    1,
    102,
    17
  ),
  generateComment(
    'gm-real-newman-50',
    'newman',
    'Andy H',
    `Beautiful church`,
    1,
    175,
    9
  ),
  generateComment(
    'gm-real-newman-51',
    'newman',
    'Rodney Vanous',
    `Excellent priest`,
    1,
    51,
    15
  ),
  generateComment(
    'gm-real-newman-52',
    'newman',
    'Erich Wassilak',
    `The bananas rock!!!`,
    1,
    142,
    11
  ),
  generateComment(
    'gm-real-newman-53',
    'newman',
    'Kanji Aiura',
    `Jesus lives here`,
    1,
    91,
    14
  ),
  generateComment(
    'gm-real-newman-54',
    'newman',
    'Logan Talmage',
    `Whether you’ve been Catholic your whole life or have no experience with church, this is an incredible place to spend time with Jesus and go to mass. I went here over 3 years ago for the first time and it was my first time in a Catholic Church- I had an amazing experience and ended up becoming Catholic (baptized, confirmed, and first communion) a few months later and met my fiancé here. Great place to stop by and meet people or find peace in prayer!`,
    1,
    60,
    2
  ),
  generateComment(
    'gm-real-newman-55',
    'newman',
    'Josiah Biver',
    `Will be living here soon, and I cant wait`,
    1,
    24,
    18
  ),
  generateComment(
    'gm-real-hendrick-0',
    'hendrick',
    'Jessica Barker',
    `Hendrick House was such a great place for my son to live last year, that he returned for his 2nd year. Every worker has been friendly to my son and our family when we visit - from the kitchen staff to the front desk. It has a warmer, family like vibe than other dorms and they get to know you better. The food has been great, no complaints on the room and the location has been convenient for engineering classes. Some older reviews made me doubtful, but new management since then and we have nothing but accolades across the board!`,
    1,
    133,
    12
  ),
  generateComment(
    'gm-real-hendrick-1',
    'hendrick',
    'McArthur Tolbert Jr',
    `WOW, I stayed in this dorm in 1989 and I see nothing has changed.  From the food, to the staff and some other things.`,
    -1,
    22,
    16
  ),
  generateComment(
    'gm-real-hendrick-2',
    'hendrick',
    'Suzi Armstrong',
    `I recently enjoyed a special college reunion weekend at a private dorm called Hendrick House on the UIUC campus. College friends  returned to campus from CA, NJ, OH, AZ, MO, IN and, of course, IL. We talked late into the night to catch up on each others lives, then slept in comfortable HH dorm room suites. It was just like college waking up to have breakfast with my long-time friends! In fact, we enjoyed all of our meals together at HH as they are known for their delicious home-style food. It was the perfect location for our reunion with terrific facilities, and an easy walk to the quad and campus town. We planned our reunion for the weekend between graduation and the start of summer school so the dorm was available and the parking easy. THANKS to the fantastic HH staff for being so wonderful and attentive! Last, but not least, the coffee was delicious!!`,
    1,
    55,
    14
  ),
  generateComment(
    'gm-real-hendrick-3',
    'hendrick',
    'P M',
    `Just stood outside. This is the corner my Dad proposed to my Mom, many moons ago. Just wanted to see if it was special.`,
    1,
    209,
    5
  ),
  generateComment(
    'gm-real-hendrick-4',
    'hendrick',
    'Prashant N',
    `Yesterday from 10:50pm-12:15am, a student was stuck shut in the elevator. The residents have been complaining about this elevator for about a year now, but it has gotten really bad in the past few months. The door won’t close unless you hard reset the elevator, causing the alarm to ring. The elevator rarely ever says the right floor you are on, and it hasn’t opened to the basement floor recently. There was also a period of time where it would simply go to different floors instead of the floors you clicked on. It also feels generally unstable and will shake if you move sporadically.\nBesides the elevator, the dining situation is fairly unreasonable as well. They served rotten food occasionally (although relatively rare, it shouldn’t be something that has happened 2-3 times in the past semester). On top of this, their hours for dining are short (dinner ends at 7, and they don’t serve dinner on sundays). While this in itself is definitely not an issue, it is definitely something to think about before deciding to live here.\nThere are some basic needs that constantly do not get met. There was a solid few months where the wifi would randomly stop working during the day (when people are in class and taking exams) and heating and ac wouldn’t be provided when needed to.\nThe RA’s and a few staff members are basically the only people responsible for things here. They work extremely hard to keep this place running, but it is so clear they need more help from upper management that they simply aren’t getting.\nIf you are considering to live here, I urge you to please READ THE RECENT REVIEWS. I’m sure Hendrick House may have been a great place to live in the past, but it certainly was not at all worth the price this year. Also, it would not be in good faith if I did not give credit to other areas of Hendrick House. Rooms are spacious compared to other dorms, we used to get cleaning twice a week, and the closets are spacious as well. They have well kept amenities such as the pool table and lounge. It’s also important to note that they have claimed that they will be rebuilding the elevator that is causing all these issues by next year.`,
    -1,
    300,
    4
  ),
  generateComment(
    'gm-real-hendrick-5',
    'hendrick',
    'Sri Prasad',
    `Great location, short walk from Engineering Quad and Illini Union. Great food (most of the time), this is a well-known fact. Most of the time its nice and quiet, which is very conducive to studying. Staff are very friendly and helpful, cleaning service is a nice luxury, and rooms are bigger and more comfortable compared to most University housing rooms. If you have classes in the Engineering Quad, like great food, and want a quiet and comfortable living environment basically devoid of noisy partying, then this is definitely the place for you.`,
    1,
    69,
    0
  ),
  generateComment(
    'gm-real-hendrick-6',
    'hendrick',
    'Megan Vescio',
    `Lived here for the 2017-18 year (my senior year), mainly because of location and because I had lived in another PCH institution (Armory House) for my first three years and kinda wanted to stay within that circuit.\n\nSure enough, it was a great decision! Staff is wonderful and friendly and they take great care of you. Rooms are large, everything is clean, food of course is fantastic. Location is great—quiet, safe, clean, and close to classes even if youre not an engineering major. (I had most of my classes on the Quad and it would take a max of 10min.) Also a hop skip and a jump from Krannert Center, which is a place you should definitely frequent during your college years for many reasons!\n\nI spent probably about 10% of my senior year in the gym, which they are continuing to upgrade—my only suggestion would be to add lighter dumbbells (5lb and 10lb) for some of the smaller-framed weight trainers I sometimes saw in there as well as for lighter workouts. (Ive been strength training for about 10yrs now...you dont always want to go super heavy, even if you CAN.) Its a cheap upgrade and will help greatly in the long run.\n\nIve seen a lot of reviews here taking issue with management and cleaning services.  I havent had problems with either...everyone is very kind and understanding, as a matter of face.  I DO wish there were a booklet with rules and regulations, something we could all clearly references aside from whats on our contract, because I suspect thats where a majority of these misunderstandings are coming from.  Management could be a bit clearer about what is and isnt allowed, when facilities are open, when payments are due, etc.  However, in my experience theyve always been flexible and kind.  Housekeeping staff is respectful and Ive never once felt snooped on.  Im sure it would suck if I were on an earlier portion of their route (they usually came to my room ~1-2pm, rather than 8am) but hey, theyre just doing their job.  I dont think theyre very interested in what Im doing so long as Im not blatantly breaking any rules.\n\nOverall, I highly recommend it for freshmen and upperclassmen alike, especially if you want a quieter neighborhood. Thanks for a great final year, HH!`,
    1,
    183,
    16
  ),
  generateComment(
    'gm-real-hendrick-7',
    'hendrick',
    'S Kota',
    `You wont find a dorm with better food at the University of Illinois. The dorms are decently sized (east side), and surprisingly cost me less than it would have at public dorms. I met a lot of nice people, but many are shy to the point of being anti-social. Honestly, if you want a quiet place to crash and study near the Engineering campus, Hendrick House isnt a bad way to go. Just dont expect the typical public dorm experience.`,
    1,
    265,
    15
  ),
  generateComment(
    'gm-real-hendrick-8',
    'hendrick',
    'John Qian',
    `Im sure that the staff has good intentions. But due to a predatory housekeeper who regularly waltzes into private rooms at 8:50 am without knocking, not to clean but to spy on residents until they slightly break cryptic unwritten rules like "all guests must be escorted by residents everywhere they go", along with staff members that believe the housekeepers fabricated stories without listening to the perspectives of innocent residents, my experience at Hendrick has been the equivalent of middle school bullying. I cant imagine how they would treat residents that actually, say, cause problems. Cant recommend to anyone who enjoys having fun or socializing. Great chefs though.`,
    -1,
    297,
    14
  ),
  generateComment(
    'gm-real-hendrick-9',
    'hendrick',
    'Ruisong Li',
    `I do not understand why some people said this is a great place. There is a simple way to avoid all the terrible experience you are going to have here - You just simply go to live another place. There are lots of clever choices for freshman, if you want to live in a pch, you can choose Europa instead of here. THIS PLACE IS NOT WORTH THE PRICE. you are charged one of the highest price on campus and you will get the smallest room, no kitchen, shared bathroom (with 2 or 4, 2 if you pay 20K a year) and free morning calls. What i mean by free morning call is their house keepers. During the year, they will randomly walk into your room without knocking your door. (not for all staff, but the majority, I only know 1 or 2 male stuffs who will actually knock your door and wait for your response when they try to get into your room). And although you pay around 15k for your living here, they will always trying to get another dollar from you. There are something called early arrival fee, late departure fee, spring break stay fee. And they are always more than you expected. oh, I nearly forget the ‘GREAT FOOD’ here. it is totally a joke, it is great when your first try it, however, you are going to eat mostly the same thing for a whole year. this is especially true for international student. There are lots of great Korean, Chinese, Japaneses, Thai  restaurant on green street, you do not want to spend thousands of dollars on Hendricks cheese pizza. Although this place is such terrible, you can still find some good aspects. First, you will study more often in this place. Because you can not take any friends who did not live here to your room so the only thing you can do is study. second, some staff are nice and kind, like chris and chris.\n\nAt last, as this is the longest review here, I expect you to trust me, who lived here for the first year and who will never come back to this place. I want you to trust me not for my benefit but yours.`,
    -1,
    115,
    9
  ),
  generateComment(
    'gm-real-hendrick-10',
    'hendrick',
    'Chris Ho',
    `Decent living, but food is not very good. Hendrick house has extremely hyped up food, but it is really only good about twice every week. Otherwise, it is the same as normal dining hall food, but with much less variety.`,
    -1,
    94,
    4
  ),
  generateComment(
    'gm-real-hendrick-11',
    'hendrick',
    'J ay',
    `Its ok. Bland crispy chicken. The waffles ( in my dish) were good. Wish they sold that separately. I ate it but wouldnt again. ...a review on the food truck at Lincoln square`,
    1,
    214,
    2
  ),
  generateComment(
    'gm-real-hendrick-12',
    'hendrick',
    'Ella Potthoff',
    `If you’re near Clare, you have to try pie here! The strawberry rhubarb is 👌🏼 sorry about the photo, couldn’t wait. …`,
    1,
    207,
    15
  ),
  generateComment(
    'gm-real-hendrick-13',
    'hendrick',
    'Andrew McCormick',
    `Best dorm food on campus.  Plus a comfortable  place for working and relaxing. Great staff.  Great experience.`,
    1,
    151,
    12
  ),
  generateComment(
    'gm-real-hendrick-14',
    'hendrick',
    'Andy Sun',
    `Just don’t live here I guess. People talking in hallway past mid night and nerds shouting while playing video game at 2 or 3. Soundproof is bad as hell, and I guess you just have to “deal with it.”`,
    -1,
    197,
    8
  ),
  generateComment(
    'gm-real-hendrick-15',
    'hendrick',
    'Bob Vilsoet',
    `Good dorm for U of I students.  Located relatively close to physics and engineering classes.`,
    1,
    16,
    18
  ),
  generateComment(
    'gm-real-hendrick-16',
    'hendrick',
    'Michelle Brower',
    `Easiest move in!!! Students were very helpful and personable, and all instructions were very clear!!`,
    1,
    118,
    7
  ),
  generateComment(
    'gm-real-hendrick-17',
    'hendrick',
    'N Varghese',
    `Great food. Friends bring me in sometimes with their meal swipes, and I go home happy for the day.`,
    1,
    45,
    15
  ),
  generateComment(
    'gm-real-hendrick-18',
    'hendrick',
    'DragonZaid6',
    `Best dorm food on campus. Very strict with noise levels, though.`,
    1,
    5,
    14
  ),
  generateComment(
    'gm-real-hendrick-19',
    'hendrick',
    '阿氢HYDROGEN',
    `Best private certified dorm for its quietness, great food and nice and clean furniture`,
    1,
    33,
    13
  ),
  generateComment(
    'gm-real-hendrick-20',
    'hendrick',
    'Гузель Мусина',
    `I liked this place. Personnel is really polite. Especially in cafeteria.`,
    1,
    133,
    13
  ),
  generateComment(
    'gm-real-hendrick-21',
    'hendrick',
    '1 2',
    `It was a good place to live back in the day.  Not crazy at all.`,
    1,
    17,
    19
  ),
  generateComment(
    'gm-real-hendrick-22',
    'hendrick',
    'Beth Sullivan',
    `Very helpful staff, comfortable facilities`,
    1,
    49,
    18
  ),
  generateComment(
    'gm-real-hendrick-23',
    'hendrick',
    'Nader Emamjomeh',
    `Dont visit off school times...Bare-bone service lol`,
    1,
    275,
    4
  ),
  generateComment(
    'gm-real-hendrick-24',
    'hendrick',
    'Cara Knox Gutzmer',
    `Great lunch. Healthy and flavorful.`,
    1,
    23,
    5
  ),
  generateComment(
    'gm-real-hendrick-25',
    'hendrick',
    'Joey Fryfogle',
    `Exceptionally well done`,
    1,
    104,
    14
  ),
  generateComment(
    'gm-real-hendrick-26',
    'hendrick',
    'nick shapland',
    `notice me becky-chan`,
    1,
    154,
    6
  ),
  generateComment(
    'gm-real-hendrick-27',
    'hendrick',
    'Vicki Brown',
    `Not a good place to eat`,
    -1,
    231,
    8
  ),
  generateComment(
    'gm-real-hendrick-28',
    'hendrick',
    'Paul Kim',
    `Good place to stay!`,
    1,
    233,
    7
  ),
  generateComment(
    'gm-real-hendrick-29',
    'hendrick',
    'austin vonperbandt',
    `Their cooking is amazing`,
    1,
    101,
    5
  ),
  generateComment(
    'gm-real-hendrick-30',
    'hendrick',
    'Ghanshyam Patel',
    `Nice friendly place`,
    1,
    194,
    10
  ),
]
