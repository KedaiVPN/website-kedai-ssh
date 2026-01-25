import React, { useEffect, useRef, useState } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';

const ThreeGlobe = () => {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  // Type for GeoJSON Features
  const [countries, setCountries] = useState({ features: [] });

  // Responsive dimensions
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerWidth : 800
  });

  useEffect(() => {
    const handleResize = () => {
        const size = window.innerWidth > 800 ? 800 : window.innerWidth;
        setDimensions({
            width: size,
            height: size
        });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Init

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Load GeoJSON for landmasses
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => {
        setCountries(data);

        // Transform polygon data into points for hexbin
        // Ideally hexPolygonGeoJsonInput is used directly by the library, but let's see which prop works best.
        // Actually react-globe.gl has `hexPolygonPointsData` which is what we want!
        // No manual conversion needed if we use `hexPolygonsData={countries.features}`
      });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
        const scrollY = window.scrollY;
        // Rotation: map scroll to longitude.
        // Initial pos is usually around 0. Let's make it rotate naturally.
        const rotationSpeed = 0.05;
        const lng = (scrollY * rotationSpeed) % 360;

        if (globeEl.current) {
            // Smoothly move camera
            globeEl.current.pointOfView({
                lng: -lng, // Rotate "earth" (camera moves opposite)
                lat: 20,
                altitude: 2.0 // Keep a consistent distance
            });
        }
    };

    // Initial position
    if (globeEl.current) {
        globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.0 });
        // Disable interactive controls to behave like a background
        const controls = globeEl.current.controls();
        if (controls) {
            controls.enableZoom = false;
            // controls.enableRotate = false; // We want to control it manually via scroll
        }
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Generate Red Arcs
  const ARC_COUNT = 12;
  const arcsData = [...Array(ARC_COUNT).keys()].map(() => ({
    startLat: (Math.random() - 0.5) * 160,
    startLng: (Math.random() - 0.5) * 360,
    endLat: (Math.random() - 0.5) * 160,
    endLng: (Math.random() - 0.5) * 360,
    color: ['#ff3232', 'rgba(255, 50, 50, 0)'] // Gradient from red to transparent
  }));

  return (
    <div className="w-full h-full flex items-center justify-center opacity-50 dark:opacity-40 filter brightness-75 contrast-125">
      <Globe
        ref={globeEl}
        backgroundColor="rgba(0,0,0,0)"

        // Base Globe Appearance (Dark/Invisible to let Hexagons shine)
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg" // Dark base

        // Hexagon Layer (The "Tech" Look)
        hexPolygonsData={countries.features}
        hexPolygonResolution={3} // Higher = smaller hexagons (dots)
        hexPolygonMargin={0.3} // Gap between hexagons
        hexPolygonColor={() => '#00f3ff'} // Neon Blue
        hexPolygonAltitude={0.01} // Slight extrusion

        // Arcs (Red Trails)
        arcsData={arcsData}
        arcColor={'color'}
        arcDashLength={0.9} // Long trail
        arcDashGap={1} // Only one dash per cycle effectively
        arcDashAnimateTime={2000} // Speed
        arcStroke={1}

        // Atmosphere
        atmosphereColor="#00f3ff"
        atmosphereAltitude={0.1}

        // Configuration
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
};

export default ThreeGlobe;
