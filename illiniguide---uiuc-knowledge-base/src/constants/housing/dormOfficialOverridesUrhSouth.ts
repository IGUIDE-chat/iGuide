import { DormOverride, clean, plan, urhPage, urls } from './dormOfficialOverrideUtils';

export const URH_OFFICIAL_OVERRIDES_SOUTH: Record<string, DormOverride> = {
    snyder: {
        website: urhPage('snyder'),
        address: '206 E. Peabody Dr.',
        imageUrl: clean('https://www.housing.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2023-01/Snyder-Exterior-1.jpg?h=2d298297&itok=BDi6vIp8'),
        galleryImages: urls(
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05361_0.jpg?itok=sKHlXT9q',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05366.jpg?itok=zu0iMjl0',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/IkeStandard_top_classic_furniture.jpg?itok=yQtQt0DP',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Ikenberry-Commons-triple-Top.jpg?itok=kRvoGHei',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Ikenberry%20Corner%20Triple%20Top.jpg?itok=gWASHrrS'
        ),
        dining: 'nearby',
        diningNearbyDetail: 'SDRP dining is a short walk from Snyder Hall.',
        categorizedTags: {
            livingConditions: [],
            facilities: ['laundry', 'studyLounge'],
            lifestyle: ['quiet'],
        },
        structuredTags: {
            substanceFree: true,
            quietFloors: true,
            studyRooms: true,
        },
        description: 'Snyder is a substance-free hall in Ikenberry Commons with quick access to SDRP dining, ARC, Memorial Stadium, and the School of Art + Design.',
        pros: ['Substance-free community environment', 'Short walk to SDRP, ARC, and Memorial Stadium', 'Standard, large double, and triple layouts'],
        cons: ['No dining room inside the hall', 'Traditional bathrooms are communal', 'South-campus location is farther from north engineering'],
        price: 13774,
        bathroomType: 'communal',
        floorPlans: [
            plan({
                bedCount: 2,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 14558,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/snyder-double.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/IkeStandard_top_classic_furniture.jpg?itok=yQtQt0DP',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/IkenberryStandard_iso_classic_furniture.jpg?itok=uCLIuQEC'
                ),
                description: 'Standard double room.',
            }),
            plan({
                bedCount: 3,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 13774,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/snyder-triple.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Ikenberry-Commons-triple-Top.jpg?itok=kRvoGHei',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Ikenberry-Commons-triple-Iso.jpg?itok=l32nWyHk'
                ),
                description: 'Triple room.',
            }),
        ],
    },
    hopkins: {
        website: urhPage('hopkins'),
        address: '1208 S. First St.',
        imageUrl: clean('https://www.housing.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2023-01/HOPKINS-INT%20%281%29.jpg?h=086dfb23&itok=86Ir6OBA'),
        galleryImages: urls(
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Hopkins-Lounge-1.jpg?itok=h3dfrhet',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05357.jpg?itok=AHkO-gxv',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05361.jpg?itok=j-JTNRql',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Ikenberry-Standard-Iso.jpg?itok=AA2OHSY1',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Ike-Dining-2.jpg?itok=g58GHwDi'
        ),
        dining: 'nearby',
        diningNearbyDetail: 'SDRP dining, library, and programs are a short walk from Hopkins.',
        categorizedTags: {
            livingConditions: [],
            facilities: ['laundry', 'studyLounge'],
            lifestyle: ['socialParty'],
        },
        structuredTags: {
            studyRooms: true,
        },
        description: 'Hopkins is a first-year-focused Ikenberry hall near ARC, Memorial Stadium, and SDRP dining, with a classic large-hall residential setup.',
        pros: ['Strong first-year residential programming', 'Very close to ARC, Memorial Stadium, and SDRP', 'Large double and triple options are available'],
        cons: ['No dining room inside the hall', 'Traditional bathrooms are communal', 'South-campus location means longer walks to north-campus classes'],
        price: 13774,
        bathroomType: 'communal',
        floorPlans: [
            plan({
                bedCount: 2,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 14558,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/hopkins-double.pdf'),
                photoUrls: urls('https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Ikenberry-Standard-Iso.jpg?itok=GPuiHdpQ'),
                description: 'Standard double room.',
            }),
            plan({
                bedCount: 3,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 13774,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/hopkins-triple.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Ikenberry-Commons-triple-iso-new-furniture.jpg?itok=3H__i25e',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/IkeCornerTriple_top_new_furniture.jpg?itok=hOCv_BPL'
                ),
                description: 'Triple room or corner triple in Hopkins.',
            }),
        ],
    },
    weston: {
        website: urhPage('weston'),
        address: '204 E. Peabody Dr.',
        imageUrl: clean('https://www.housing.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2023-01/weston-hero.png.jpg?itok=uU0nQH5T'),
        galleryImages: urls(
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Weston-Exterior-1.jpg?itok=_V616uYK',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05489.jpg?itok=lvQs_K3r',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Ikenberry%20Standard%20Top_0.jpg?itok=3aAhcKdf',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Ikenberry-Commons-triple_top_new_furniture_0.jpg?itok=7Etlj5Bd',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/IkeCornerTriple_top_new_furniture_1.jpg?itok=szK0FGBf'
        ),
        dining: 'nearby',
        diningNearbyDetail: 'SDRP dining and library spaces are just around the corner.',
        categorizedTags: {
            livingConditions: [],
            facilities: ['laundry', 'studyLounge'],
            lifestyle: ['socialParty', 'llc'],
            llcNames: ['Exploration LLC', 'LEADS LLC'],
        },
        structuredTags: {
            llc: ['Exploration LLC', 'LEADS LLC'],
            studyRooms: true,
        },
        description: 'Weston is a social first-year hall in Ikenberry Commons and hosts both the Exploration and LEADS living-learning communities.',
        pros: ['Exploration and LEADS LLCs are based in Weston', 'Close to SDRP, ARC, and Memorial Stadium', 'Standard and triple layouts available'],
        cons: ['No dining room inside the hall', 'Communal bathrooms in standard layouts', 'Longer walk to north-campus classrooms'],
        price: 13774,
        bathroomType: 'communal',
        floorPlans: [
            plan({
                bedCount: 2,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 14558,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/Weston_Double.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Ikenberry%20Standard%20Top_0.jpg?itok=Fdg7FnMz',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Ikenberry%20Standard%20Iso_0.jpg?itok=He8ZHWkX'
                ),
                description: 'Standard double room.',
            }),
            plan({
                bedCount: 3,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 13774,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/Weston_Triple_Reg.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Ikenberry-Commons-triple_top_new_furniture_0.jpg?itok=prm_Tjca',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Ikenberry-Commons-triple_iso_new_furniture_0.jpg?itok=RUBf6yLh'
                ),
                description: 'Regular triple room.',
            }),
        ],
    },
    scott: {
        website: urhPage('scott'),
        address: '202 E. Peabody Dr.',
        imageUrl: clean('https://www.housing.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2023-01/Scott-3.jpg?h=c17ff48a&itok=jmGBLzoY'),
        galleryImages: urls(
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05368.jpg?itok=gVVZOBft',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05378.jpg?itok=ntofx6KB',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Ikenberry%20Standard%20Top.jpg?itok=I-fYgmLW',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Ikenberry-Commons-triple_top_new_furniture.jpg?itok=s8H-Yalv',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/IkeCornerTriple_top_new_furniture_0.jpg?itok=zkLKYpAw'
        ),
        dining: 'nearby',
        diningNearbyDetail: 'SDRP dining is a short walk; ARC is directly across the street.',
        categorizedTags: {
            livingConditions: [],
            facilities: ['gym', 'laundry', 'studyLounge'],
            lifestyle: ['quiet', 'llc'],
            llcNames: ['Transfer Community'],
        },
        structuredTags: {
            llc: ['Transfer Community'],
            studyRooms: true,
            gymNearby: true,
            quietFloors: true,
        },
        description: 'Scott Hall is home to the Transfer Community and balances a quieter residential atmosphere with immediate access to ARC and SDRP.',
        pros: ['Transfer Community on site', 'Across the street from ARC and pool facilities', 'SDRP dining and programs are close by'],
        cons: ['No dining room in the hall', 'Traditional bathrooms are communal', 'North-campus classrooms are farther away'],
        price: 13774,
        bathroomType: 'communal',
        floorPlans: [
            plan({
                bedCount: 2,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 14558,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/scott-double.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Ikenberry%20Standard%20Top.jpg?itok=2Aa6QQaR',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Ikenberry%20Standard%20Iso.jpg?itok=zKQUC3XV'
                ),
                description: 'Standard double room.',
            }),
            plan({
                bedCount: 3,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 13774,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/scott-triple-corner.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Ikenberry-Commons-triple_top_new_furniture.jpg?itok=9pBQoGA0',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Ikenberry-Commons-triple_iso_new_furniture.jpg?itok=z8G-CVoj'
                ),
                description: 'Corner triple room.',
            }),
        ],
    },
    taft: {
        website: urhPage('taft-van-doren'),
        address: '1213 S. Fourth St.',
        imageUrl: clean('https://www.housing.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2023-01/TVD_0.jpg?h=2d298297&itok=9jI4JtCi'),
        galleryImages: urls(
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/TVD-Exterior-3_0.jpg?itok=8OhzusXG',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05337_1.jpg?itok=h-YKqdMo',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05338_1.jpg?itok=nnP8NWRf',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/IkeStandard_top_classic_furniture_0.jpg?itok=A2ZyYHM4',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/IkenberryStandard_iso_classic_furniture_0.jpg?itok=AOyeoVXO'
        ),
        dining: 'nearby',
        diningNearbyDetail: 'Residents use nearby SDRP dining rather than an in-hall dining room.',
        categorizedTags: {
            livingConditions: ['noAc', 'olderBuilding'],
            facilities: ['laundry', 'studyLounge'],
            lifestyle: ['quiet'],
        },
        structuredTags: {
            quietFloors: true,
            studyRooms: true,
        },
        description: 'Taft Hall is part of the historic Taft-Van Doren pair and offers quieter traditional housing close to SDRP, ARC, and the School of Art + Design.',
        pros: ['Historically one of the lower-cost University Housing options', 'Quiet community feel near ARC and Siebel Center for Design', 'Classic single and double room layouts'],
        cons: ['No air conditioning', 'No dining room inside the building', 'Traditional bathrooms and older infrastructure'],
        price: 14116,
        ac: false,
        bathroomType: 'communal',
        floorPlans: [
            plan({
                bedCount: 2,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 14116,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/tvd_double_0.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/IkeStandard_top_classic_furniture_0.jpg?itok=qr_d9qqI',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/IkenberryStandard_iso_classic_furniture_0.jpg?itok=pgjywPxc'
                ),
                description: 'Taft double room.',
            }),
            plan({
                bedCount: 1,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 16416,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/tvd_double_0.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05270.jpg?itok=VS1yAG6d',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05272.jpg?itok=bQVSoeiu'
                ),
                description: 'Taft larger single room.',
            }),
        ],
    },
    'van-doren': {
        website: urhPage('taft-van-doren'),
        address: '1215 S. Fourth St.',
        imageUrl: clean('https://www.housing.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2023-01/TVD_0.jpg?h=2d298297&itok=9jI4JtCi'),
        galleryImages: urls(
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/TVD-Exterior-3_0.jpg?itok=8OhzusXG',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05333_1.jpg?itok=bmYQu4wV',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05330_1.jpg?itok=WCF3TAUi',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/IkeStandard_top_classic_furniture_0.jpg?itok=A2ZyYHM4',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/IkenberryStandard_iso_classic_furniture_0.jpg?itok=AOyeoVXO'
        ),
        dining: 'nearby',
        diningNearbyDetail: 'Residents use nearby SDRP dining rather than an in-hall dining room.',
        categorizedTags: {
            livingConditions: ['noAc', 'olderBuilding'],
            facilities: ['laundry', 'studyLounge'],
            lifestyle: ['quiet'],
        },
        structuredTags: {
            quietFloors: true,
            studyRooms: true,
        },
        description: 'Van Doren Hall shares the quiet, historic Taft-Van Doren setting and is close to SDRP, ARC, and the design/art side of south campus.',
        pros: ['Lower-cost traditional University Housing option', 'Quiet community feel', 'Classic single and double room layouts'],
        cons: ['No air conditioning', 'No dining room inside the building', 'Traditional bathrooms and older infrastructure'],
        price: 14116,
        ac: false,
        bathroomType: 'communal',
        floorPlans: [
            plan({
                bedCount: 2,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 14116,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/tvd_double_0.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/IkeStandard_top_classic_furniture_0.jpg?itok=qr_d9qqI',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/IkenberryStandard_iso_classic_furniture_0.jpg?itok=pgjywPxc'
                ),
                description: 'Van Doren double room.',
            }),
            plan({
                bedCount: 1,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 16416,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/tvd_double_0.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05270.jpg?itok=VS1yAG6d',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05272.jpg?itok=bQVSoeiu'
                ),
                description: 'Van Doren larger single room.',
            }),
        ],
    },
    daniels: {
        website: urhPage('daniels'),
        address: '1010 W. Green St.',
        ac: true,
        imageUrl: clean('https://www.housing.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2023-01/Daniels-Exterior-1.jpg?h=8d969fe4&itok=B--tR7_X'),
        galleryImages: urls(
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Daniels-Interior-1.jpg?itok=bd__9zLO',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Daniels-Interior-2.jpg?itok=hZtMVrWg',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Daniels-Multipurpose-Room.jpg?itok=PAwOUEKE',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/ground-floor08.jpg?itok=0LfwoOi0',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05305.jpg?itok=yUGDriCK'
        ),
        location: 'Campustown',
        dining: 'nearby',
        diningNearbyDetail: 'Daniels stays close to Green Street restaurants; University Housing publishes Daniels rates separately from meal plans.',
        categorizedTags: {
            livingConditions: [],
            facilities: ['laundry', 'studyLounge', 'kitchen'],
            lifestyle: ['quiet'],
        },
        structuredTags: {
            kitchen: true,
            studyRooms: true,
            quietFloors: true,
            nearGreenStreet: true,
            nearEngineering: true,
        },
        description: 'Daniels Hall is a Green Street graduate and upper-division hall that stays open during university breaks and offers both academic-year and 12-month contracts.',
        pros: ['Academic-year and 12-month housing options', 'Walkable to Green Street and the engineering side of campus', 'Single and double room types with some private-bath options'],
        cons: ['No dining room in the building', 'Room and meal pricing are published separately', 'Fewer room photos are published than for traditional halls'],
        price: 8340,
        bathroomType: 'communal',
        floorPlans: [
            plan({
                bedCount: 1,
                bathroomCount: 1,
                bathroomScope: 'private',
                price: 9522,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/daniels_single.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Daniels-Interior-1.jpg?itok=bd__9zLO',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/ground-floor08.jpg?itok=0LfwoOi0'
                ),
                description: 'Single room with private bathroom.',
            }),
            plan({
                bedCount: 1,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 9140,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/Daniels_single_shared.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Daniels-Interior-2.jpg?itok=hZtMVrWg',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05322.jpg?itok=kr4d1WpZ'
                ),
                description: 'Single room with shared bathroom.',
            }),
            plan({
                bedCount: 2,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 8340,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/daniels_double.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05305.jpg?itok=yUGDriCK',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05317.jpg?itok=-62tvtmt'
                ),
                description: 'Double room with shared bathroom.',
            }),
        ],
    },
    sherman: {
        website: urhPage('sherman'),
        address: '909 S. Fifth St.',
        imageUrl: clean('https://www.housing.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2023-01/DSC05302-2.jpg?h=041e7dc2&itok=EbnBKnn1'),
        galleryImages: urls(
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05275.jpg?itok=gCT5YG8l',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05279.jpg?itok=Z42UzE3h',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05283.jpg?itok=eZsF9cBq',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/sherman_single_top.png.jpg?itok=dwFia0p-',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/sherman_double_top.png.jpg?itok=-d4SAFkH'
        ),
        location: 'Campustown',
        dining: 'nearby',
        diningNearbyDetail: 'Sherman is walkable to campus restaurants and stays open over Fall, Winter, and Spring breaks.',
        categorizedTags: {
            livingConditions: [],
            facilities: ['laundry', 'studyLounge', 'kitchen'],
            lifestyle: ['quiet'],
        },
        structuredTags: {
            kitchen: true,
            studyRooms: true,
            quietFloors: true,
            nearGreenStreet: true,
        },
        description: 'Sherman Hall is a graduate and upper-division option close to the Main Quad and Campustown, and it remains open during Fall, Winter, and Spring breaks.',
        pros: ['Break housing is built into the hall calendar', 'Close to the Main Quad and Campustown', 'Single and double layouts are available'],
        cons: ['No dining room in the building', 'Room pricing is published separately from meal plans', 'Shared bathrooms in standard layouts'],
        price: 6906,
        bathroomType: 'communal',
        floorPlans: [
            plan({
                bedCount: 1,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 7212,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/sherman-single-shared.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/sherman_single_top.png.jpg?itok=dwFia0p-',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/sherman_single_iso.png.jpg?itok=HZCfDHlX'
                ),
                description: 'Single room with shared bathroom.',
            }),
            plan({
                bedCount: 2,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 6906,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/sherman-double-shared.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/sherman_double_top.png.jpg?itok=-d4SAFkH',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/sherman_hall_double_iso.png.jpg?itok=oSDwWgC2'
                ),
                description: 'Double room with shared bathroom.',
            }),
        ],
    },
    lar: {
        website: urhPage('lar'),
        address: '1003 S. Lincoln Ave.; 1005 S. Lincoln Ave.',
        imageUrl: clean('https://www.housing.illinois.edu/sites/default/files/styles/hero_image/public/paragraphs/hero/2023-01/LAR-EXT-1.jpg?h=2d298297&itok=V0TPMED5'),
        galleryImages: urls(
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05181.JPG.jpg?itok=4IBTjQr8',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/DSC05186.JPG.jpg?itok=AvsNbO9P',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/LAR-exterior-4.jpg?itok=2MP_150Z',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Lincoln%20Avenue%20Single%20Top.jpg?itok=-H-Eo_SJ',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Lincoln%20Avenue%20Double%20Top.jpg?itok=JLV98xi-',
            'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_full/public/2023-01/Lincoln%20Avenue%20Triple%20Top.jpg?itok=p25n43ZI'
        ),
        categorizedTags: {
            livingConditions: [],
            facilities: ['laundry', 'studyLounge'],
            lifestyle: ['quiet', 'llc'],
            llcNames: ['Scholars Community'],
        },
        structuredTags: {
            llc: ['Scholars Community'],
            studyRooms: true,
            quietFloors: true,
        },
        description: 'LAR (Leonard and Shelden) is a quieter hall community with in-hall dining, Scholars Community programming, and easy access to McKinley and CRCE.',
        pros: ['Dining is inside the LAR complex', 'Close to McKinley and CRCE', 'Scholars Community programming on site'],
        cons: ['Standard layouts use communal bathrooms', 'Older building infrastructure than ISR or Wassaja', 'North-campus academic buildings are farther away'],
        price: 13774,
        bathroomType: 'communal',
        floorPlans: [
            plan({
                bedCount: 1,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 16564,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/lar_single.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Lincoln%20Avenue%20Single%20Top.jpg?itok=dxJVEdos',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Lincoln%20Avenue%20Single%20iso.jpg?itok=MxKgGX84'
                ),
                description: 'Single room.',
            }),
            plan({
                bedCount: 2,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 14558,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/lar_double_reg.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Lincoln%20Avenue%20Double%20Top.jpg?itok=Q6mqvCFg',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Lincoln%20Avenue%20Double%20Iso.jpg?itok=YWnq3xCG'
                ),
                description: 'Regular double room.',
            }),
            plan({
                bedCount: 3,
                bathroomCount: 0,
                bathroomScope: 'communal',
                price: 13774,
                imageUrls: urls('https://www.housing.illinois.edu/sites/default/files/2023-01/lar_triple.pdf'),
                photoUrls: urls(
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Lincoln%20Avenue%20Triple%20Top.jpg?itok=i4YQbacj',
                    'https://www.housing.illinois.edu/sites/default/files/styles/image_gallery_mobile/public/2023-01/Lincoln%20Avenue%20Triple%20iso.jpg?itok=Hk39KvoW'
                ),
                description: 'Triple room.',
            }),
        ],
    },
};
