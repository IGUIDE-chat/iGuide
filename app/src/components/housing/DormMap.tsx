/**
 * @file ./src/components/housing/DormMap.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, {
  Component,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dorm } from "./types/index";
import { useHousingMapUi } from "./store/HousingContext";
import { CAMPUS_LANDMARKS, CAMPUS_ZONES, Landmark } from "./constants/mapData";
import { Language } from "../../types";
import Map, {
  Layer,
  MapRef,
  NavigationControl,
  Popup,
  Source,
} from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  buildDormFeatureCollection,
  buildLandmarkFeatureCollection,
} from "./dorm-map/mapFeatureBuilders";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "./dorm-map/mapConstants";
import { registerMapAssets } from "./dorm-map/mapAssets";
import { getHousingTypeMeta } from "./constants/metadata";
import {
  buildLandmarksLayer,
  buildZonesFillLayer,
  buildZonesLabelLayer,
  CLUSTERS_LAYER,
  CLUSTER_COUNT_LAYER,
  UNCLUSTERED_LAYER,
} from "./dorm-map/layers";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "";

interface MapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface MapErrorBoundaryProps {
  children: ReactNode;
  language?: Language;
}

class MapErrorBoundary extends Component<
  MapErrorBoundaryProps,
  MapErrorBoundaryState
> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[DormMap] Map Error:", error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div
          className="
            flex size-full items-center justify-center bg-linear-to-br
            from-gray-50 to-gray-100
          "
        >
          <div
            className="
              mx-4 max-w-md rounded-2xl bg-white p-8 text-center shadow-xl
            "
          >
            <div
              className="
                mx-auto mb-4 flex size-16 items-center justify-center
                rounded-full bg-red-100
              "
            >
              <svg
                className="size-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3
              className="mb-2 text-lg font-bold text-gray-900"
              title="Map error"
            >
              Map failed to load
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              {error?.message || "The map component encountered an error."}
            </p>
            <button
              onClick={() => window.location.reload()}
              type="button"
              className="
                rounded-xl bg-illini-blue px-6 py-2 font-semibold text-white
                transition-colors
                hover:bg-illini-blue/90
              "
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
  language = "en",
  isVisible = true,
  highlightedDormId,
  onVisibleDormsChange,
  disableScrollZoom = false,
}) => {
  const {
    showZones,
    setShowZones,
    showZoneLabels,
    showLandmarks,
    setShowLandmarks,
  } = useHousingMapUi();

  const [hoveredDorm, setHoveredDorm] = useState<Dorm | null>(null);
  const [hoveredCoords, setHoveredCoords] = useState<[number, number] | null>(
    null
  );
  const [isMapReady, setIsMapReady] = useState(false);
  const [areMapImagesReady, setAreMapImagesReady] = useState(false);
  const [visibleDorms, setVisibleDorms] = useState<Dorm[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapRef>(null);
  const fitBoundsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safeDorms = useMemo(
    () =>
      dorms.filter(
        (dorm) => Number.isFinite(dorm.lat) && Number.isFinite(dorm.lng)
      ),
    [dorms]
  );
  const safeLandmarks = useMemo(
    () =>
      CAMPUS_LANDMARKS.filter(
        (landmark) =>
          Number.isFinite(landmark.lat) && Number.isFinite(landmark.lng)
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
    if (!bounds) {
      setVisibleDorms([]);
      return [];
    }
    const visible = safeDorms.filter((dorm) => {
      const point = new mapboxgl.LngLat(dorm.lng, dorm.lat);
      return bounds.contains(point);
    });

    return visible;
  }, [safeDorms]);

  useEffect(() => {
    onVisibleDormsChange?.(visibleDorms);
  }, [visibleDorms, onVisibleDormsChange]);

  useLayoutEffect(() => {
    if (!isMapReady || !isVisible) return;
    const visible = handleViewportChange();
    if (visible) {
      setVisibleDorms(visible);
    }
  }, [isMapReady, isVisible, handleViewportChange]);

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
        const coordinates = safeDorms.map(
          (dorm) => [dorm.lng, dorm.lat] as [number, number]
        );
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
        console.error("[DormMap] Failed to fit bounds safely:", error);
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
    if (!isVisible || !isMapReady || !mapRef.current || !containerRef.current)
      return;

    const map = mapRef.current;
    const container = containerRef.current;
    const transitionTarget = container.parentElement;
    let rafOne = 0;
    let rafTwo = 0;
    let retryTimer: number | null = null;
    const timeouts: number[] = [];

    const resizeIfSized = () => {
      if (!map || !container.isConnected) return false;
      if (container.clientWidth === 0 || container.clientHeight === 0)
        return false;
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
    transitionTarget?.addEventListener("transitionend", handleTransitionEnd);
    window.addEventListener("resize", handleTransitionEnd);

    return () => {
      window.cancelAnimationFrame(rafOne);
      window.cancelAnimationFrame(rafTwo);
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      observer.disconnect();
      transitionTarget?.removeEventListener(
        "transitionend",
        handleTransitionEnd
      );
      window.removeEventListener("resize", handleTransitionEnd);
    };
  }, [isVisible, isMapReady, safeDorms.length]);

  useLayoutEffect(() => {
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const map = mapRef.current;
      if (map) {
        map.getMap().scrollZoom.enable();
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
        event.id === "pill" ||
        event.id === "pill-active" ||
        event.id.startsWith("landmark-")
      ) {
        setAreMapImagesReady(registerMapAssets(map));
      }
    };

    map.on("styleimagemissing", handleStyleImageMissing);
    map.on("styledata", ensureAssets);
    ensureAssets();

    return () => {
      map.off("styleimagemissing", handleStyleImageMissing);
      map.off("styledata", ensureAssets);
    };
  }, [isMapReady]);

  const onMapClick = useCallback(
    (event: mapboxgl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature) return;

      const clusterId = feature.properties?.cluster_id;
      const map = mapRef.current?.getMap();

      if (clusterId && map) {
        (map.getSource("dorms") as any).getClusterExpansionZoom(
          clusterId,
          (error: unknown, zoom: number) => {
            if (error) return;
            map.easeTo({
              center: (feature.geometry as any).coordinates,
              zoom,
              duration: 500,
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
        mapRef.current.getCanvas().style.cursor = "pointer";
      }
      const feature = event.features?.[0];
      if (!feature || feature.properties?.cluster_id) return;
      const dormId = feature.properties?.id;
      if (!dormId) return;

      const dorm = dorms.find((item) => item.id === dormId);
      if (dorm) {
        const coords = (feature.geometry as any).coordinates.slice() as [
          number,
          number,
        ];
        setHoveredDorm(dorm);
        setHoveredCoords(coords);
      }
    },
    [dorms]
  );

  const onMouseLeave = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = "";
    }
    setHoveredDorm(null);
    setHoveredCoords(null);
  }, []);

  const popupT =
    language === "zh"
      ? { perSem: "/学期", viewDetails: "查看详情", ac: "空调", dining: "餐厅" }
      : {
          perSem: "/sem",
          viewDetails: "Details →",
          ac: "AC",
          dining: "Dining",
        };
  const isChinese = language === "zh";
  const formatPopupPrice = (price: number) => `$${(price / 1000).toFixed(1)}k`;

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className="
          flex size-full items-center justify-center bg-linear-to-br
          from-gray-50 to-gray-100
        "
      >
        <div
          className="
            mx-4 max-w-md rounded-2xl bg-white p-8 text-center shadow-xl
          "
        >
          <h3 className="mb-2 text-lg font-bold text-gray-900">
            {language === "zh" ? "地图不可用" : "Map unavailable"}
          </h3>
          <p className="text-sm text-gray-600">
            {language === "zh"
              ? "缺少 VITE_MAPBOX_TOKEN 环境变量，请在部署平台配置后重试。"
              : "Missing VITE_MAPBOX_TOKEN environment variable. Configure it and redeploy."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative size-full bg-gray-50">
      <Map
        ref={mapRef}
        onLoad={onMapLoad}
        onMoveEnd={handleViewportChange}
        onClick={onMapClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        interactiveLayerIds={["clusters", "unclustered-point"]}
        initialViewState={{
          longitude: DEFAULT_CENTER[1],
          latitude: DEFAULT_CENTER[0],
          zoom: DEFAULT_ZOOM,
          pitch: 0,
          bearing: 0,
        }}
        style={{ width: "100%", height: "100%" }}
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
          <Layer
            {...(buildZonesLabelLayer(
              showZones,
              showZoneLabels,
              isChinese
            ) as any)}
          />
        </Source>

        <Source
          id="landmarks"
          type="geojson"
          data={buildLandmarkFeatureCollection(visibleLandmarks as Landmark[])}
        >
          {areMapImagesReady && (
            <Layer
              {...(buildLandmarksLayer(showLandmarks, isChinese) as any)}
            />
          )}
        </Source>

        <Source
          id="dorms"
          type="geojson"
          data={buildDormFeatureCollection(
            safeDorms,
            hoveredDorm?.id,
            highlightedDormId
          )}
          cluster={true}
          clusterMaxZoom={16}
          clusterRadius={50}
        >
          <Layer {...(CLUSTERS_LAYER as any)} />
          <Layer {...(CLUSTER_COUNT_LAYER as any)} />

          {areMapImagesReady && <Layer {...(UNCLUSTERED_LAYER as any)} />}
        </Source>

        <div
          className="
            absolute top-4 left-4 z-10 flex min-w-[140px] flex-col gap-2
            rounded-lg border border-slate-200/50 bg-white/90 p-3 shadow-lg
            backdrop-blur-sm
          "
        >
          <div
            className="
              mb-1 text-xs font-semibold tracking-wider text-slate-500 uppercase
            "
          >
            {language === "zh" ? "地图图层" : "Map Layers"}
          </div>

          <label className="group flex cursor-pointer items-center justify-between">
            <span
              className="
                text-sm font-medium text-slate-700 transition-colors
                group-hover:text-illini-blue
              "
            >
              {language === "zh" ? "区域" : "Zones"}
            </span>
            <div className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={showZones}
                onChange={(e) => setShowZones(e.target.checked)}
              />
              <div
                className="
                  peer h-4 w-7 rounded-full bg-slate-300
                  peer-checked:bg-illini-orange
                  peer-focus:outline-none
                  after:absolute after:top-[2px] after:left-[2px] after:size-3
                  after:rounded-full after:border after:border-gray-300
                  after:bg-white after:transition-all after:content-['']
                  peer-checked:after:translate-x-full
                  peer-checked:after:border-white
                "
              />
            </div>
          </label>

          <label className="group flex cursor-pointer items-center justify-between">
            <span
              className="
                text-sm font-medium text-slate-700 transition-colors
                group-hover:text-illini-blue
              "
            >
              {language === "zh" ? "地标" : "Landmarks"}
            </span>
            <div className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={showLandmarks}
                onChange={(e) => setShowLandmarks(e.target.checked)}
              />
              <div
                className="
                  peer h-4 w-7 rounded-full bg-slate-300
                  peer-checked:bg-illini-orange
                  peer-focus:outline-none
                  after:absolute after:top-[2px] after:left-[2px] after:size-3
                  after:rounded-full after:border after:border-gray-300
                  after:bg-white after:transition-all after:content-['']
                  peer-checked:after:translate-x-full
                  peer-checked:after:border-white
                "
              />
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
            <PopupDormPreview
              dorm={hoveredDorm}
              popupT={popupT}
              isChinese={isChinese}
              formatPopupPrice={formatPopupPrice}
              onOpenDetails={() => {
                setHoveredDorm(null);
                onSelectDorm(hoveredDorm);
              }}
            />
          </Popup>
        )}
      </Map>
    </div>
  );
};

/** Pointer-friendly preview (tap opens details; works when `click` is not synthesized on touch). */
const POPUP_TAP_PX = 14;

const PopupDormPreview: React.FC<{
  dorm: Dorm;
  popupT: { perSem: string; viewDetails: string; ac: string; dining: string };
  isChinese: boolean;
  formatPopupPrice: (price: number) => string;
  onOpenDetails: () => void;
}> = ({ dorm, popupT, isChinese, formatPopupPrice, onOpenDetails }) => {
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const tryOpen = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    pointerStartRef.current = null;
    if (Math.hypot(dx, dy) > POPUP_TAP_PX) return;
    onOpenDetails();
  };

  return (
    <div
      className="w-56 cursor-pointer touch-manipulation"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetails();
        }
      }}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        pointerStartRef.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        tryOpen(e);
      }}
      onPointerCancel={() => {
        pointerStartRef.current = null;
      }}
    >
      <div className="h-28 overflow-hidden">
        <img
          src={dorm.imageUrl}
          alt={dorm.name}
          className="size-full object-cover"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400";
          }}
        />
      </div>
      <div className="p-3">
        <div className="mb-1 flex items-center justify-between">
          <h4 className="flex-1 truncate text-sm font-bold text-gray-900">
            {isChinese && dorm.name_zh ? dorm.name_zh : dorm.name}
          </h4>
          {(() => {
            const housingTypeMeta = getHousingTypeMeta(dorm.housingType);
            return (
              <span
                className={`
                  ml-2 shrink-0 rounded-full px-1.5 py-0.5 text-[10px]
                  font-semibold
                  ${housingTypeMeta.badgeClassName}
                `}
              >
                {housingTypeMeta.shortLabel}
              </span>
            );
          })()}
        </div>
        <div className="mb-2 flex items-center gap-2 text-[11px] text-gray-500">
          {dorm.ac && <span>{popupT.ac}</span>}
          {dorm.dining === "inside" && <span>{popupT.dining}</span>}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-gray-900">
            {formatPopupPrice(dorm.price)}
            <span className="ml-0.5 text-[10px] font-normal text-gray-400">
              {popupT.perSem}
            </span>
          </span>
          <span className="text-[11px] font-semibold text-blue-600">
            {popupT.viewDetails}
          </span>
        </div>
      </div>
    </div>
  );
};

const DormMapWithErrorBoundary: React.FC<DormMapProps> = (props) => (
  <MapErrorBoundary language={props.language}>
    <DormMap {...props} />
  </MapErrorBoundary>
);

export default DormMapWithErrorBoundary;
