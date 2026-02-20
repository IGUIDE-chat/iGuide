export const buildZonesFillLayer = (showZones: boolean) => ({
    id: 'zones-fill',
    type: 'fill' as const,
    paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 0.15
    },
    layout: {
        visibility: showZones ? 'visible' : 'none'
    }
});

export const buildZonesLabelLayer = (
    showZones: boolean,
    showZoneLabels: boolean,
    isChinese: boolean
) => ({
    id: 'zones-label',
    type: 'symbol' as const,
    layout: {
        'text-field': ['coalesce', ['get', isChinese ? 'name_zh' : 'name'], ['get', 'name']],
        'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
        'text-size': 13,
        'text-transform': 'uppercase',
        'text-letter-spacing': 0.15,
        'text-justify': 'center',
        'text-anchor': 'center',
        visibility: showZones && showZoneLabels ? 'visible' : 'none',
        'text-allow-overlap': false,
        'text-ignore-placement': false
    },
    paint: {
        'text-color': ['get', 'color'],
        'text-halo-color': '#ffffff',
        'text-halo-width': 3,
        'text-opacity': 0.9
    }
});

export const buildLandmarksLayer = (showLandmarks: boolean, isChinese: boolean) => ({
    id: 'landmarks-layer',
    type: 'symbol' as const,
    layout: {
        'text-field': ['coalesce', ['get', isChinese ? 'name_zh' : 'name'], ['get', 'name']],
        'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-offset': [0, 1.4],
        'text-anchor': 'top',
        'text-max-width': 12,
        'icon-image': [
            'match',
            ['get', 'type'],
            'library',
            'landmark-library',
            'gym',
            'landmark-gym',
            'dining',
            'landmark-dining',
            'store',
            'landmark-store',
            'union',
            'landmark-union',
            'medical',
            'landmark-medical',
            'service',
            'landmark-service',
            'transport',
            'landmark-transport',
            'landmark-school'
        ],
        'icon-size': 1.1,
        'icon-allow-overlap': false,
        'text-allow-overlap': false,
        'text-optional': false,
        visibility: showLandmarks ? 'visible' : 'none'
    },
    paint: {
        'text-color': '#374151',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2.5,
        'icon-opacity': 1,
        'text-opacity': 1
    }
});

export const CLUSTERS_LAYER = {
    id: 'clusters',
    type: 'circle' as const,
    filter: ['has', 'point_count'],
    paint: {
        'circle-color': '#ffffff',
        'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 30, 26],
        'circle-stroke-width': 1,
        'circle-stroke-color': '#dddddd',
        'circle-pitch-alignment': 'map'
    }
};

export const CLUSTER_COUNT_LAYER = {
    id: 'cluster-count',
    type: 'symbol' as const,
    filter: ['has', 'point_count'],
    layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12,
        'text-allow-overlap': true
    },
    paint: { 'text-color': '#222222' }
};

export const UNCLUSTERED_LAYER = {
    id: 'unclustered-point',
    type: 'symbol' as const,
    filter: ['!', ['has', 'point_count']],
    layout: {
        'text-field': ['get', 'formattedPrice'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 14,
        'text-offset': [0, 0],
        'text-anchor': 'center',
        'icon-image': ['case', ['get', 'isActive'], 'pill-active', 'pill'],
        'icon-text-fit': 'both',
        'icon-text-fit-padding': [6, 12, 6, 12],
        'icon-allow-overlap': false,
        'text-allow-overlap': false,
        'icon-ignore-placement': false,
        'text-ignore-placement': false,
        'symbol-sort-key': ['case', ['get', 'isActive'], 100, 1]
    },
    paint: {
        'text-color': ['case', ['get', 'isActive'], '#ffffff', '#222222'],
        'icon-opacity': 1
    }
};
