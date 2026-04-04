/**
 * @file ./src/components/housing/constants/dormOfficialOverridesUrhNorth.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { DormOverride, clean, plan, urhPage, urls } from './dormOfficialOverrideUtils';

const twinXl = (value: Parameters<typeof plan>[0]) => plan({ bedSize: 'Twin XL', ...value });

export const URH_OFFICIAL_OVERRIDES_NORTH: Record<string, DormOverride> = {
    isr: {
        website: urhPage('isr'),
        address: '918 W. Illinois St.; 1012 W. Illinois St.',
        imageUrl: clean('https://www.housing.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2023-01/ISR-exterior-2-7.jpg?h=8a2dd558&itok=HJ-QraVs'),
        galleryImages: urls(
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2025-10/UH-251002-JK-003.JPG.jpg?itok=16Eq2F0w',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/JED00989.jpg?itok=mazoC5dN',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/ISR%20Townsend%20Triple%20Top.jpg?itok=tcGbE3v3',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/ISR%20Double%20Top.jpg?itok=UvYDb4tJ'
        ),
        dining: 'inside',
        diningNearbyDetail: 'ISR Dining Center is inside the Townsend/Wardall complex.',
        categorizedTags: {
            livingConditions: ['newlyRenovated'],
            facilities: ['studyLounge', 'laundry', 'computerLab'],
            lifestyle: ['llc', 'genderInclusive'],
            llcNames: ['Honors LLC', 'Innovation LLC', 'Sustainability LLC'],
        },
        structuredTags: {
            llc: ['Honors LLC', 'Innovation LLC', 'Sustainability LLC'],
            studyRooms: true,
        },
        description: 'ISR (Townsend and Wardall) sits beside the engineering-side campus and combines recently renovated traditional rooms, individual-use bathrooms, a large dining center, and program spaces.',
        pros: ['Walkable to engineering and north-campus classrooms', 'Recently renovated commons, dining, and individual-use bathroom layouts', 'Hosts Honors, Innovation, and Sustainability LLCs'],
        cons: ['Rates are higher than older traditional halls', 'Official inventory is concentrated in double and triple layouts', 'South-campus recreation facilities take longer to reach'],
        price: 14558,
        bathroomType: 'individual-use',
        floorPlans: [
            twinXl({
                bedCount: 2,
                bathroomCount: 1,
                bathroomScope: 'individual-use',
                sqft: 190,
                price: 14558,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/wardall-double.pdf'),
                photoUrls: urls('https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/ISR%20Double%20Top.jpg?itok=UvYDb4tJ'),
                description: 'Wardall/Townsend double room with individual-use bathroom access.',
            }),
            twinXl({
                bedCount: 3,
                bathroomCount: 1,
                bathroomScope: 'individual-use',
                sqft: 250,
                price: 13774,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/townsend-triple.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/ISR%20Townsend%20Triple%20Top.jpg?itok=tcGbE3v3',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/ISR%20Townsend%20Triple%20Iso.jpg?itok=LJlEDlqP'
                ),
                description: 'Townsend triple room with individual-use bathroom access.',
            }),
            twinXl({
                bedCount: 3,
                bathroomCount: 1,
                bathroomScope: 'individual-use',
                sqft: 310,
                price: 13774,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/townsend-large-triple.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/ISR%20Townsend%20Triple%202%20top.jpg?itok=R2W5H2P-',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/ISR%20Townsend%20Triple%202%20Iso.jpg?itok=kpi7z6Oo'
                ),
                description: 'Large or corner triple layout in Townsend with individual-use bathroom access.',
            }),
        ],
    },
    nugent: {
        website: urhPage('nugent'),
        address: '207 E. Gregory Dr.',
        imageUrl: clean('https://www.housing.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2023-01/Nugent-Exterior-1_0.jpg?h=2d298297&itok=JPOULHQe'),
        galleryImages: urls(
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Nugent-Double-top.jpg?itok=SHcvP56Q',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Nugent-single-top.jpg?itok=HmBb5Ndm',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Nugent-Double-Iso.jpg?itok=UkMw7qoS',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Nugent-single-iso.jpg?itok=NO8E0wzq'
        ),
        dining: 'nearby',
        diningNearbyDetail: 'Connected to SDRP dining by an interior walkway.',
        categorizedTags: {
            livingConditions: ['newlyRenovated'],
            facilities: ['laundry', 'studyLounge', 'computerLab'],
            lifestyle: ['quiet', 'llc', 'genderInclusive'],
            llcNames: ['Business LLC', 'Beckwith Residential Community'],
        },
        structuredTags: {
            llc: ['Business LLC', 'Beckwith Residential Community'],
            studyRooms: true,
            quietFloors: true,
        },
        description: 'Nugent is a modern upper-division hall in Ikenberry Commons with large-window rooms, quick indoor access to SDRP dining, and the Business and Beckwith communities.',
        pros: ['Modern finishes and lounges', 'Interior connection to SDRP dining', 'Business LLC and Beckwith Residential Community on site'],
        cons: ['Premium pricing within University Housing', 'Engineering-side classes require a longer walk', 'Some bathroom configurations vary by room type'],
        price: 15042,
        bathroomType: 'mixed',
        floorPlans: [
            twinXl({
                bedCount: 2,
                bathroomCount: 0,
                bathroomScope: 'communal',
                sqft: 185,
                price: 15042,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/NUGT-RoomLayouts.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Nugent-Double-top.jpg?itok=SHcvP56Q',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Nugent-Double-Iso.jpg?itok=UkMw7qoS'
                ),
                description: 'Traditional double layout; shared bath configuration varies by section.',
            }),
            twinXl({
                bedCount: 1,
                bathroomCount: 1,
                bathroomScope: 'individual-use',
                sqft: 135,
                price: 17832,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/NUGT-RoomLayouts.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Nugent-single-top.jpg?itok=HmBb5Ndm',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Nugent-single-iso.jpg?itok=NO8E0wzq'
                ),
                description: 'Single room with shared individual-use bathroom.',
            }),
            twinXl({
                bedCount: 1,
                bathroomCount: 1,
                bathroomScope: 'private',
                sqft: 145,
                price: 18612,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/NUGT-RoomLayouts.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Nugent-single-top.jpg?itok=HmBb5Ndm',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Nugent-single-iso.jpg?itok=NO8E0wzq'
                ),
                description: 'Single room with private bathroom.',
            }),
        ],
    },
    wassaja: {
        website: urhPage('wassaja'),
        address: '1202 S. First St.',
        imageUrl: clean('https://www.housing.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2023-01/Wassaja-Hall-Exterior-2-web.jpg?h=2d298297&itok=Quwq9YNH'),
        galleryImages: urls(
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-11/UH-231108-JK-web-001.JPG.jpg?itok=Io4pqx0O',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-11/UH-231108-JK-web-002.JPG.jpg?itok=jnODKmW-',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-11/UH-231108-JK-web-005.JPG.jpg?itok=TkS4z-Ck',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-11/UH-231108-JK-web-009.JPG.jpg?itok=YadmYZU0',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/wassaja_single1c.jpeg.jpg?itok=sBiKcROD',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/wassaja_single1a_top.jpeg.jpg?itok=H6bRg-WR'
        ),
        dining: 'nearby',
        diningNearbyDetail: 'SDRP dining and social spaces are a short walk away.',
        categorizedTags: {
            livingConditions: ['newlyRenovated'],
            facilities: ['laundry', 'studyLounge', 'computerLab', 'library'],
            lifestyle: ['quiet', 'genderInclusive'],
        },
        structuredTags: {
            studyRooms: true,
            quietFloors: true,
        },
        description: 'Wassaja is a quiet upper-division hall in Ikenberry Commons with clustered room layouts, updated finishes, and nearby SDRP dining.',
        pros: ['Modern finishes and lounges', 'Mostly single and double layouts with individual-use bathrooms', 'Convenient to SDRP and south-campus recreation'],
        cons: ['Higher annual rate than traditional halls', 'Limited room-layout variety', 'North-campus classes take longer to reach'],
        price: 15440,
        bathroomType: 'mixed',
        floorPlans: [
            twinXl({
                bedCount: 2,
                bathroomCount: 1,
                bathroomScope: 'individual-use',
                sqft: 180,
                price: 15440,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/wassaja-doubles.pdf'),
                description: 'Double room with a shared individual-use bathroom.',
            }),
            twinXl({
                bedCount: 1,
                bathroomCount: 1,
                bathroomScope: 'individual-use',
                sqft: 125,
                price: 17488,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/wassaja-singles.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/wassaja_single1a_top.jpeg.jpg?itok=H6bRg-WR',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/wassaja_single1c.jpeg.jpg?itok=sBiKcROD'
                ),
                description: 'Single room with a shared individual-use bathroom.',
            }),
            twinXl({
                bedCount: 1,
                bathroomCount: 1,
                bathroomScope: 'private',
                sqft: 135,
                price: 18612,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/wassaja-singles.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/wassaja_single1a_top.jpeg.jpg?itok=H6bRg-WR',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/wassaja_single1c.jpeg.jpg?itok=sBiKcROD'
                ),
                description: 'Single room with private bathroom.',
            }),
        ],
    },
    bousefield: {
        name: 'Bousfield Hall',
        website: urhPage('bousfield'),
        address: '1214 S. First St.',
        imageUrl: clean('https://www.housing.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2023-01/Bousfield-Exterior-2.jpg?h=8d969fe4&itok=sgos47bu'),
        galleryImages: urls(
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/DSC05394.jpg?itok=6QszkZ0f',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/DSC05409.jpg?itok=B7MqPkT9',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Bousfield%20Hall%20Single%20Top.jpg?itok=qI5tUR7P',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Bousfield%20Hall%20Double%20Top.jpg?itok=5uiGXoRN'
        ),
        dining: 'nearby',
        diningNearbyDetail: 'SDRP dining is a short walk from Bousfield.',
        categorizedTags: {
            livingConditions: ['newlyRenovated'],
            facilities: ['gym', 'laundry', 'studyLounge', 'kitchen', 'computerLab', 'library'],
            lifestyle: ['llc', 'genderInclusive'],
            llcNames: ['Transfer Community'],
        },
        structuredTags: {
            llc: ['Transfer Community'],
            studyRooms: true,
            kitchen: true,
            gymNearby: true,
        },
        description: 'Bousfield is a suite-style upper-division hall across from ARC and Memorial Stadium, with modern finishes and the Transfer Community.',
        pros: ['Suite-style layouts for sophomores through seniors', 'Across the street from ARC and Memorial Stadium', 'Transfer Community and apartment-like common spaces'],
        cons: ['Not open to first-year students', 'No dining room in the building', 'Higher annual rate than traditional halls'],
        price: 15754,
        bathroomType: 'semi-private',
        floorPlans: [
            twinXl({
                bedCount: 2,
                bathroomCount: 1,
                bathroomScope: 'semi-private',
                sqft: 320,
                price: 15754,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/bousfield-firstfloor.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Bousfield%20Hall%20Double%20Top.jpg?itok=5uiGXoRN',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Bousfield%20Hall%20Double%20Iso.jpg?itok=pYiGppJK'
                ),
                description: 'Double suite with shared bath.',
            }),
            twinXl({
                bedCount: 1,
                bathroomCount: 1,
                bathroomScope: 'semi-private',
                sqft: 160,
                price: 17832,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/bousfield-firstfloor.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Bousfield%20Hall%20Single%20Top.jpg?itok=qI5tUR7P',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Bousfield%20Hall%20Single%20Iso.jpg?itok=G4XkuiUb'
                ),
                description: 'Single suite with shared bath.',
            }),
            twinXl({
                bedCount: 1,
                bathroomCount: 1,
                bathroomScope: 'private',
                sqft: 180,
                price: 18612,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/bousfield-firstfloor.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Bousfield%20Hall%20Single%20Top.jpg?itok=qI5tUR7P',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Bousfield%20Hall%20Single%20Iso.jpg?itok=G4XkuiUb'
                ),
                description: 'Single room with private bath.',
            }),
        ],
    },
    par: {
        website: urhPage('par'),
        address: '901 W. Pennsylvania Ave.; 1001 W. Pennsylvania Ave.',
        imageUrl: clean('https://www.housing.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2023-01/FAR-PAR.jpg?h=2d298297&itok=UTgD3kO9'),
        galleryImages: urls(
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/interior-par-02.jpg',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/dining-par-02.jpg',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Snacks-PAR.jpg',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05232.jpg',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Pennsylvania%20Avenue%20top.jpg',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Pennsylvania%20Avenue%20Iso.jpg'
        ),
        dining: 'inside',
        categorizedTags: {
            livingConditions: [],
            facilities: ['laundry', 'busStop', 'computerLab'],
            lifestyle: ['llc', 'genderInclusive'],
            llcNames: ['Global Crossroads LLC', 'Intersections LLC'],
        },
        structuredTags: {
            llc: ['Global Crossroads LLC', 'Intersections LLC'],
            nearBusiness: false,
        },
        description: 'PAR (Babcock, Carr, Blaisdell, and Saunders) combines in-hall dining, individual-use bathrooms, and two LLC communities in the south-campus residential area.',
        pros: ['Dining center inside the PAR complex', 'Global Crossroads and Intersections LLCs', 'Individual-use bathroom layouts in the residence complex'],
        cons: ['South-campus location is far from north engineering', 'Official room inventory is concentrated in singles and doubles', 'Outdoor walk to the Quad takes longer than ISR or Allen'],
        price: 14558,
        bathroomType: 'individual-use',
        floorPlans: [
            twinXl({
                bedCount: 2,
                bathroomCount: 1,
                bathroomScope: 'individual-use',
                sqft: 175,
                price: 14558,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/par_double.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Pennsylvania%20Avenue%20top.jpg?itok=Sh1AVs_X',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Pennsylvania%20Avenue%20Iso.jpg?itok=hweJcVw9'
                ),
                description: 'PAR double room with individual-use bathroom access.',
            }),
            twinXl({
                bedCount: 1,
                bathroomCount: 1,
                bathroomScope: 'individual-use',
                sqft: 125,
                price: 16564,
                description: 'PAR single room with individual-use bathroom access.',
            }),
        ],
    },
    far: {
        website: urhPage('far'),
        address: '901 College Ct.; 1005 College Ct.',
        imageUrl: clean('https://www.housing.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2023-01/far-exterior-2.jpg?h=183bf12a&itok=mpclweEP'),
        galleryImages: urls(
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Lounge-FAR.jpg',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05237.jpg',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05249.jpg',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05245.jpg',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Oglesby-Trelease-Double-Top.jpg',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Oglesby-Trelease-Single-Top.jpg'
        ),
        dining: 'inside',
        categorizedTags: {
            livingConditions: [],
            facilities: ['laundry', 'busStop', 'computerLab'],
            lifestyle: ['llc', 'genderInclusive'],
            llcNames: ['WIMSE LLC'],
        },
        structuredTags: {
            llc: ['WIMSE LLC'],
            gymNearby: false,
        },
        description: 'FAR (Oglesby and Trelease) is a south-campus complex with in-hall dining, strong bus access, and the Women in Math, Science, and Engineering LLC.',
        pros: ['Dining is inside the FAR complex', 'Frequent bus service at the halls', 'WIMSE LLC and easy access to south-campus outdoor recreation'],
        cons: ['Farther from the north side of campus', 'Standard layouts rely on community bathrooms', 'Fewer room types than newer upper-division halls'],
        price: 14558,
        bathroomType: 'communal',
        floorPlans: [
            twinXl({
                bedCount: 2,
                bathroomCount: 0,
                bathroomScope: 'communal',
                sqft: 170,
                price: 14558,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/far_double.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Oglesby-Trelease-Double-Top.jpg?itok=G-r6Ksc6',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Oglesby-Double-Iso.jpg?itok=FmFf9_WU'
                ),
                description: 'Oglesby/Trelease double room with community bath access.',
            }),
            twinXl({
                bedCount: 1,
                bathroomCount: 0,
                bathroomScope: 'communal',
                sqft: 110,
                price: 16564,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/far_double.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Oglesby-Trelease-Single-Top.jpg?itok=lF3an8Kn',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Oglesby%20Single%20Iso.jpg?itok=b5TG2MqD'
                ),
                description: 'Single room in the FAR complex.',
            }),
        ],
    },
    allen: {
        website: urhPage('allen'),
        address: '1005 W. Gregory Dr.',
        ac: true,
        imageUrl: clean('https://www.housing.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2023-01/DSC04299%20copy.jpg?h=dabba2d4&itok=fpb8kwuF'),
        galleryImages: urls(
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Allen-500.jpg?itok=-V0Dxo4Y',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Allen-Dining-1.jpg?itok=2OBuAbPl',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Allen%20Double%20Top.jpg?itok=OX76tOFV',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Allen%20Triple%20Top.jpg?itok=IXKIJv_f'
        ),
        categorizedTags: {
            livingConditions: [],
            facilities: ['musicRooms', 'laundry', 'studyLounge', 'computerLab'],
            lifestyle: ['artsyCreative', 'llc', 'genderInclusive'],
            llcNames: ['Unit One LLC'],
        },
        structuredTags: {
            llc: ['Unit One LLC'],
            studyRooms: true,
            quietFloors: false,
        },
        description: 'Allen Hall houses the Unit One arts community and offers on-site creative spaces such as a music recording studio, darkroom, ceramics lab, and free music lessons.',
        pros: ['Unit One arts community with dedicated creative spaces', 'In-hall dining plus an arts-focused program calendar', 'Allen rooms are air-conditioned'],
        cons: ['Communal bathrooms in standard layouts', 'Older room layouts than ISR or Wassaja', 'South-campus recreation is farther away'],
        price: 13202,
        bathroomType: 'communal',
        floorPlans: [
            twinXl({
                bedCount: 2,
                bathroomCount: 0,
                bathroomScope: 'communal',
                sqft: 160,
                price: 14558,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/allen-double.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Allen%20Double%20Top.jpg?itok=OX76tOFV',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Allen-Double-Iso.jpg?itok=ChdwGH2-'
                ),
                description: 'Allen double room with communal bathroom access.',
            }),
            twinXl({
                bedCount: 3,
                bathroomCount: 0,
                bathroomScope: 'communal',
                sqft: 230,
                price: 13774,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/allen-triple.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Allen%20Triple%20Top.jpg?itok=IXKIJv_f',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Allen%20Triple%20Iso.JPG.jpg?itok=5YT6ifNz'
                ),
                description: 'Allen triple room with communal bathroom access.',
            }),
            twinXl({
                bedCount: 4,
                bathroomCount: 0,
                bathroomScope: 'communal',
                sqft: 280,
                price: 13202,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/allen-quad.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Allen%20Quad%20Top.jpg?itok=W93guSAb',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Allen%20Quad%20Iso.JPG.jpg?itok=-4BDFEPV'
                ),
                description: 'Allen quad room with communal bathroom access.',
            }),
        ],
    },
    'busey-evans': {
        website: urhPage('busey-evans'),
        address: '1111 W. Nevada St.; 1115 W. Nevada St.',
        ac: true,
        imageUrl: clean('https://www.housing.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2023-01/Busey-Evans-Exterior-2.jpg?h=2d298297&itok=XQVf3wtg'),
        galleryImages: urls(
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Busey-Evans-Lounge-2.jpg?itok=EU7GyUee',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Busey-Evans-Single-Top.jpg?itok=DVTEd68p',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Busey-Evans-Standard-Double-Top.jpg?itok=GTL1x48L',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Busey-Evans-Triple-Top.jpg?itok=v6URnPea'
        ),
        dining: 'nearby',
        diningNearbyDetail: 'Residents use nearby University Housing dining locations rather than a hall dining room.',
        categorizedTags: {
            livingConditions: ['olderBuilding'],
            facilities: ['laundry', 'studyLounge', 'computerLab'],
            lifestyle: ['quiet'],
        },
        structuredTags: {
            quietFloors: true,
            studyRooms: true,
        },
        description: 'Busey-Evans is a quieter, centrally located hall near the Music Building and Krannert Center, with lounge spaces and classical-revival architecture.',
        pros: ['Very close to the Music Building, Krannert, and the Quad', 'Singles, doubles, and triples are available', 'Quiet residential feel with patio and lounges'],
        cons: ['No dining room inside the hall', 'Older building systems than newly renovated halls', 'Standard layouts use communal bathrooms'],
        price: 13774,
        bathroomType: 'communal',
        floorPlans: [
            twinXl({
                bedCount: 1,
                bathroomCount: 0,
                bathroomScope: 'communal',
                sqft: 130,
                price: 16564,
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Busey-Evans-Single-Top.jpg?itok=DVTEd68p',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/BuseyEvans_Single_Iso.jpg?itok=Flt0aT6n'
                ),
                description: 'Busey-Evans single room.',
            }),
            twinXl({
                bedCount: 2,
                bathroomCount: 0,
                bathroomScope: 'communal',
                sqft: 180,
                price: 14558,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/busey-evans_double.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Busey-Evans-Standard-Double-Top.jpg?itok=GTL1x48L',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/BuseyEvans_Standard_Double_Iso.jpg?itok=TRgGl84G'
                ),
                description: 'Standard double room.',
            }),
            twinXl({
                bedCount: 3,
                bathroomCount: 0,
                bathroomScope: 'communal',
                sqft: 220,
                price: 13774,
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Busey-Evans-Triple-Top.jpg?itok=v6URnPea',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/BuseyEvans_Triple_Iso.jpg?itok=crygWqOp'
                ),
                description: 'Triple room.',
            }),
        ],
    },
};
