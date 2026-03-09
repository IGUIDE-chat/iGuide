import React, { Component, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dorm } from '../../types/housing';
import { useHousingMapUi } from '../../contexts/HousingContext';
import { CAMPUS_LANDMARKS, CAMPUS_ZONES, Landmark } from '../../constants/housing/mapData';
import { Language } from '../../types';
import Map, { Layer, MapRef, NavigationControl, Popup, Source } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { buildDormFeatureCollection, buildLandmarkFeatureCollection } from './dorm-map/mapFeatureBuilders';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from './dorm-map/mapConstants';
import { registerMapAssets } from './dorm-map/mapAssets';
import { getHousingTypeMeta } from '../../constants/housing/metadata';
import {
    buildLandmarksLayer,
    buildZonesFillLayer,
    buildZonesLabelLayer,
    CLUSTERS_LAYER,
    CLUSTER_COUNT_LAYER,
    UNCLUSTERED_LAYER
} from './dorm-map/layers';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface MapErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

interface MapErrorBoundaryProps {
    children: ReactNode;
    language?: Language;
}

class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
    constructor(props: MapErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[DormMap] Map Error:', error, errorInfo);
    }

    render() {
        const { hasError, error } = this.state;
        const { children } = this.props;

        if (hasError) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Map failed to load</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            {error?.message || 'The map component encountered an error.'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            type="button"
                            className="bg-illini-blue text-white font-semibold py-2 px-6 rounded-xl hover:bg-illini-blue/90 transition-colors"
                        >
                            Reload page
                        </button>
                    </div>
                </div>
            );
        }

        return children;
    }
}

interface DormMapProps {
    dorms: Dorm[];
    onSelectDorm: (dorm: Dorm) => void;
    language?: Language;
    isVisible?: boolean;
    highlightedDormId?: string | null;
    onVisibleDormsChange?: (dorms: Dorm[]) => void;
    disableScrollZoom?: boolean;
}

const DormMap: React.FC<DormMapProps> = ({
    dorms,
    onSelectDorm,
    language = 'en',
    isVisible = true,
    highlightedDormId,
    onVisibleDormsChange,
    disableScrollZoom = false
}) => {
    const { showZones, setShowZones, showZoneLabels, showLandmarks, setShowLandmarks } =
        useHousingMapUi();

    const [hoveredDorm, setHoveredDorm] = useState<Dorm | null>(null);
    const [hoveredCoords, setHoveredCoords] = useState<[number, number] | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [areMapImagesReady, setAreMapImagesReady] = useState(false);
    const [visibleDorms, setVisibleDorms] = useState<Dorm[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapRef>(null);
    const fitBoundsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const safeDorms = useMemo(
        () => dorms.filter((dorm) => Number.isFinite(dorm.lat) && Number.isFinite(dorm.lng)),
        [dorms]
    );
    const safeLandmarks = useMemo(
        () =>
            CAMPUS_LANDMARKS.filter(
                (landmark) => Number.isFinite(landmark.lat) && Number.isFinite(landmark.lng)
            ),
        []
    );

    const visibleLandmarks = useMemo(() => {
        if (!showLandmarks) return [];
        return safeLandmarks;
    }, [showLandmarks, safeLandmarks]);

    const handleViewportChange = useCallback(() => {
        if (!mapRef.current) return;
        if (safeDorms.length === 0) {
            setVisibleDorms([]);
            return;
        }

        const bounds = mapRef.current.getBounds();
        const visible = safeDorms.filter((dorm) => {
            const point = new mapboxgl.LngLat(dorm.lng, dorm.lat);
            return bounds.contains(point);
        });

        setVisibleDorms(visible);
    }, [safeDorms]);

    useEffect(() => {
        onVisibleDormsChange?.(visibleDorms);
    }, [visibleDorms, onVisibleDormsChange]);

    useEffect(() => {
        if (!isMapReady || !isVisible) return;
        handleViewportChange();
    }, [safeDorms, isMapReady, isVisible, handleViewportChange]);

    useEffect(() => {
        if (!isVisible || !isMapReady || !mapRef.current) return;

        if (fitBoundsTimerRef.current) {
            clearTimeout(fitBoundsTimerRef.current);
        }

        fitBoundsTimerRef.current = setTimeout(() => {
            const map = mapRef.current;
            if (!map) return;
            if (safeDorms.length === 0) return;

            try {
                const coordinates = safeDorms.map((dorm) => [dorm.lng, dorm.lat] as [number, number]);
                const bounds = coordinates.reduce(
                    (accBounds, coord) => accBounds.extend(coord),
                    new mapboxgl.LngLatBounds()
                );

                if (!bounds.isEmpty()) {
                    map.fitBounds(bounds, { padding: 90, maxZoom: 16, duration: 0 });
                    // fitBounds does not synchronously update getBounds(), so we
                    // directly set all dorms as visible — fitBounds was called with
                    // exactly these dorms, so they are all within the new viewport.
                    setVisibleDorms(safeDorms);
                }
            } catch (error) {
                console.error('[DormMap] Failed to fit bounds safely:', error);
            }
        }, 140);

        return () => {
            if (fitBoundsTimerRef.current) {
                clearTimeout(fitBoundsTimerRef.current);
                fitBoundsTimerRef.current = null;
            }
        };
    }, [safeDorms, isVisible, isMapReady]);

    useEffect(() => {
        if (!isVisible || !isMapReady || !mapRef.current || !containerRef.current) return;

        const map = mapRef.current;
        const container = containerRef.current;
        const transitionTarget = container.parentElement;
        let rafOne = 0;
        let rafTwo = 0;
        let retryTimer: number | null = null;
        const timeouts: number[] = [];

        const resizeIfSized = () => {
            if (!map || !container.isConnected) return false;
            if (container.clientWidth === 0 || container.clientHeight === 0) return false;
            map.resize();
            return true;
        };

        const runStabilizedResize = () => {
            if (!resizeIfSized()) return false;

            rafOne = window.requestAnimationFrame(() => {
                resizeIfSized();
                rafTwo = window.requestAnimationFrame(() => {
                    resizeIfSized();
                });
            });

            timeouts.push(window.setTimeout(() => resizeIfSized(), 120));
            timeouts.push(window.setTimeout(() => resizeIfSized(), 320));
            return true;
        };

        const queueRetry = () => {
            if (retryTimer) return;
            retryTimer = window.setTimeout(() => {
                retryTimer = null;
                runStabilizedResize();
            }, 80);
        };

        if (!runStabilizedResize()) {
            queueRetry();
        }

        const observer = new ResizeObserver(() => {
            if (!runStabilizedResize()) {
                queueRetry();
            }
        });
        observer.observe(container);

        const handleTransitionEnd = () => {
            runStabilizedResize();
        };
        transitionTarget?.addEventListener('transitionend', handleTransitionEnd);
        window.addEventListener('resize', handleTransitionEnd);

        return () => {
            window.cancelAnimationFrame(rafOne);
            window.cancelAnimationFrame(rafTwo);
            if (retryTimer) {
                window.clearTimeout(retryTimer);
            }
            timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
            observer.disconnect();
            transitionTarget?.removeEventListener('transitionend', handleTransitionEnd);
            window.removeEventListener('resize', handleTransitionEnd);
        };
    }, [isVisible, isMapReady, safeDorms.length]);

    useEffect(() => {
        if (hoveredDorm && !safeDorms.some((dorm) => dorm.id === hoveredDorm.id)) {
            setHoveredDorm(null);
        }
    }, [safeDorms, hoveredDorm]);

    useEffect(() => {
        if (!isMapReady || !mapRef.current) return;
        const map = mapRef.current.getMap();
        if (disableScrollZoom) {
            map.scrollZoom.disable();
            return;
        }
        map.scrollZoom.enable();
    }, [disableScrollZoom, isMapReady]);

    useEffect(() => {
        return () => {
            if (fitBoundsTimerRef.current) {
                clearTimeout(fitBoundsTimerRef.current);
            }
            if (mapRef.current) {
                mapRef.current.getMap().scrollZoom.enable();
            }
        };
    }, []);

    const onMapLoad = useCallback((event: mapboxgl.MapboxEvent) => {
        setIsMapReady(true);
        const map = event.target as mapboxgl.Map;
        setAreMapImagesReady(registerMapAssets(map));
    }, []);

    useEffect(() => {
        if (!isMapReady || !mapRef.current) return;

        const map = mapRef.current.getMap();
        const ensureAssets = () => setAreMapImagesReady(registerMapAssets(map));
        const handleStyleImageMissing = (event: { id: string }) => {
            if (
                event.id === 'pill' ||
                event.id === 'pill-active' ||
                event.id.startsWith('landmark-')
            ) {
                setAreMapImagesReady(registerMapAssets(map));
            }
        };

        map.on('styleimagemissing', handleStyleImageMissing);
        map.on('styledata', ensureAssets);
        ensureAssets();

        return () => {
            map.off('styleimagemissing', handleStyleImageMissing);
            map.off('styledata', ensureAssets);
        };
    }, [isMapReady]);

    const onMapClick = useCallback(
        (event: mapboxgl.MapLayerMouseEvent) => {
            const feature = event.features?.[0];
            if (!feature) return;

            const clusterId = feature.properties?.cluster_id;
            const map = mapRef.current?.getMap();

            if (clusterId && map) {
                (map.getSource('dorms') as any).getClusterExpansionZoom(
                    clusterId,
                    (error: unknown, zoom: number) => {
                        if (error) return;
                        map.easeTo({
                            center: (feature.geometry as any).coordinates,
                            zoom,
                            duration: 500
                        });
                    }
                );
                return;
            }

            if (feature.properties?.id) {
                const dormId = feature.properties.id;
                const dorm = dorms.find((item) => item.id === dormId);
                if (dorm) {
                    setHoveredDorm(null);
                    onSelectDorm(dorm);
                }
            }
        },
        [dorms, onSelectDorm]
    );

    const onMouseEnter = useCallback(
        (event: mapboxgl.MapLayerMouseEvent) => {
            if (mapRef.current) {
                mapRef.current.getCanvas().style.cursor = 'pointer';
            }
            const feature = event.features?.[0];
            if (!feature || feature.properties?.cluster_id) return;
            const dormId = feature.properties?.id;
            if (!dormId) return;

            const dorm = dorms.find((item) => item.id === dormId);
            if (dorm) {
                const coords = (feature.geometry as any).coordinates.slice() as [number, number];
                setHoveredDorm(dorm);
                setHoveredCoords(coords);
            }
        },
        [dorms]
    );

    const onMouseLeave = useCallback(() => {
        if (mapRef.current) {
            mapRef.current.getCanvas().style.cursor = '';
        }
        setHoveredDorm(null);
        setHoveredCoords(null);
    }, []);

    const popupT =
        language === 'zh'
            ? { perSem: '/学期', viewDetails: '查看详情', ac: '空调', dining: '餐厅' }
            : { perSem: '/sem', viewDetails: 'Details →', ac: 'AC', dining: 'Dining' };
    const isChinese = language === 'zh';
    const formatPopupPrice = (price: number) => `$${(price / 1000).toFixed(1)}k`;

    if (!MAPBOX_TOKEN) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {language === 'zh' ? '地图不可用' : 'Map unavailable'}
                    </h3>
                    <p className="text-sm text-gray-600">
                        {language === 'zh'
                            ? '缺少 VITE_MAPBOX_TOKEN 环境变量，请在部署平台配置后重试。'
                            : 'Missing VITE_MAPBOX_TOKEN environment variable. Configure it and redeploy.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full h-full relative bg-gray-50">
            <Map
                ref={mapRef}
                onLoad={onMapLoad}
                onMoveEnd={handleViewportChange}
                onClick={onMapClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                interactiveLayerIds={['clusters', 'unclustered-point']}
                initialViewState={{
                    longitude: DEFAULT_CENTER[1],
                    latitude: DEFAULT_CENTER[0],
                    zoom: DEFAULT_ZOOM,
                    pitch: 0,
                    bearing: 0
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/light-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
                attributionControl={false}
                pitchWithRotate={true}
                dragRotate={true}
                touchPitch={true}
            >
                <style>{`
                    .mapboxgl-popup-content {
                        border-radius: 12px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                        padding: 0;
                        overflow: hidden;
                        font-family: 'Plus Jakarta Sans', sans-serif;
                    }
                    .mapboxgl-popup-tip {
                        box-shadow: 0 3px 14px rgba(0,0,0,0.2);
                    }
                `}</style>

                <NavigationControl position="bottom-right" showCompass={false} />

                <Source id="zones" type="geojson" data={CAMPUS_ZONES as any}>
                    <Layer {...(buildZonesFillLayer(showZones) as any)} />
                    <Layer {...(buildZonesLabelLayer(showZones, showZoneLabels, isChinese) as any)} />
                </Source>

                <Source
                    id="landmarks"
                    type="geojson"
                    data={buildLandmarkFeatureCollection(visibleLandmarks as Landmark[])}
                >
                    {areMapImagesReady && (
                        <Layer {...(buildLandmarksLayer(showLandmarks, isChinese) as any)} />
                    )}
                </Source>

                <Source
                    id="dorms"
                    type="geojson"
                    data={buildDormFeatureCollection(safeDorms, hoveredDorm?.id, highlightedDormId)}
                    cluster={true}
                    clusterMaxZoom={16}
                    clusterRadius={50}
                >
                    <Layer {...(CLUSTERS_LAYER as any)} />
                    <Layer {...(CLUSTER_COUNT_LAYER as any)} />

                    {areMapImagesReady && (
                        <Layer {...(UNCLUSTERED_LAYER as any)} />
                    )}
                </Source>

                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-slate-200/50 z-10 flex flex-col gap-2 min-w-[140px]">
                    <div className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                        {language === 'zh' ? '地图图层' : 'Map Layers'}
                    </div>

                    <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm text-slate-700 font-medium group-hover:text-illini-blue transition-colors">
                            {language === 'zh' ? '区域' : 'Zones'}
                        </span>
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={showZones}
                                onChange={(e) => setShowZones(e.target.checked)}
                            />
                            <div className="w-7 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-illini-orange" />
                        </div>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm text-slate-700 font-medium group-hover:text-illini-blue transition-colors">
                            {language === 'zh' ? '地标' : 'Landmarks'}
                        </span>
                        <div className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={showLandmarks}
                                onChange={(e) => setShowLandmarks(e.target.checked)}
                            />
                            <div className="w-7 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-illini-orange" />
                        </div>
                    </label>
                </div>

                {hoveredDorm && hoveredCoords && (
                    <Popup
                        longitude={hoveredCoords[0]}
                        latitude={hoveredCoords[1]}
                        anchor="bottom"
                        offset={[0, -14] as any}
                        closeButton={false}
                        closeOnClick={false}
                        className="dorm-hover-popup"
                    >
                        <div
                            className="w-56 cursor-pointer"
                            onClick={() => {
                                setHoveredDorm(null);
                                onSelectDorm(hoveredDorm);
                            }}
                        >
                            <div className="h-28 overflow-hidden">
                                <img
                                    src={hoveredDorm.imageUrl}
                                    alt={hoveredDorm.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src =
                                            'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400';
                                    }}
                                />
                            </div>
                            <div className="p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-gray-900 text-sm truncate flex-1">
                                        {isChinese && hoveredDorm.name_zh ? hoveredDorm.name_zh : hoveredDorm.name}
                                    </h4>
                                    {(() => {
                                        const housingTypeMeta = getHousingTypeMeta(hoveredDorm.housingType);
                                        return (
                                            <span
                                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 ${housingTypeMeta.badgeClassName}`}
                                            >
                                                {housingTypeMeta.shortLabel}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-2">
                                    {hoveredDorm.ac && <span>{popupT.ac}</span>}
                                    {hoveredDorm.dining === 'inside' && <span>{popupT.dining}</span>}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-base font-bold text-gray-900">
                                        {formatPopupPrice(hoveredDorm.price)}
                                        <span className="text-[10px] text-gray-400 font-normal ml-0.5">
                                            {popupT.perSem}
                                        </span>
                                    </span>
                                    <span className="text-[11px] text-blue-600 font-semibold">
                                        {popupT.viewDetails}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
};

const DormMapWithErrorBoundary: React.FC<DormMapProps> = (props) => (
    <MapErrorBoundary language={props.language}>
        <DormMap {...props} />
    </MapErrorBoundary>
);

export default DormMapWithErrorBoundary;

