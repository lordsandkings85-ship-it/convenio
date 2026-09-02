import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import SEO from '../components/SEO';
import 'leaflet/dist/leaflet.css';
import './Stores.css';

// Fix for default marker icon by using a reliable SVG string
const svgIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#e01a22" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`,
  className: "custom-leaflet-icon",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

const stores = [
  {
    id: 1,
    name: "ConvenioMart - CASAGRAND ROYALE",
    address: "BEHIND A1 BLOCK",
    city: "SHOLINGANALLUR, CHENNAI-600119",
    timing: "Open - Closes 10:00 PM",
    lat: 12.8973,
    lng: 80.2272
  },
  {
    id: 2,
    name: "ConvenioMart - CASAGRAND SAVOYE",
    address: "KUPPUSWAMY STREET",
    city: "THORAIPAKKAM, CHENNAI-600097",
    timing: "Open - Closes 10:00 PM",
    lat: 12.9377,
    lng: 80.2374
  },
  {
    id: 3,
    name: "ConvenioMart - CASAGRAND WOODSIDE",
    address: "DHARMARAJAPURAM",
    city: "MANAPAKKAM, CHENNAI-600125",
    timing: "Open - Closes 10:00 PM",
    lat: 13.0182,
    lng: 80.1783
  },
  {
    id: 4,
    name: "ConvenioMart - CASAGRAND CASTLE",
    address: "C1 BLOCK, DHARMARAJAPURAM",
    city: "MANAPAKKAM, CHENNAI-600125",
    timing: "Open - Closes 10:00 PM",
    lat: 13.0152,
    lng: 80.1773
  },
  {
    id: 5,
    name: "ConvenioMart - ADVAITA BLOSSOM",
    address: "2/421, THAYUR MARKET ROAD",
    city: "KELAMBAKKAM, CHENNAI-603103",
    timing: "Open - Closes 10:00 PM",
    lat: 12.7937,
    lng: 80.2227
  },
  {
    id: 6,
    name: "ConvenioMart - CASAGRAND TUDOR",
    address: "CHANAKYAN MAIN ROAD",
    city: "MOGAPPAIR, CHENNAI-600095",
    timing: "Open - Closes 10:00 PM",
    lat: 13.0837,
    lng: 80.1748
  },
  {
    id: 7,
    name: "ConvenioMart - CASAGRAND SERENO",
    address: "KARANAI MAIN RD",
    city: "OTTIAMBAKKAM, CHENNAI-600130",
    timing: "Open - Closes 10:00 PM",
    lat: 12.8510,
    lng: 80.2010
  }
];

// MapUpdater component handles dynamic camera movements
const MapUpdater = ({ stores, activeStore, showAllStores }) => {
  const map = useMap();
  
  useEffect(() => {
    if (activeStore) {
      map.flyTo([activeStore.lat, activeStore.lng], 16, { animate: true, duration: 1.5 });
    } else if (stores.length === 1) {
      map.flyTo([stores[0].lat, stores[0].lng], 16, { animate: true, duration: 1.5 });
    } else if (stores.length > 0) {
      const bounds = L.latLngBounds(stores.map(s => [s.lat, s.lng]));
      map.fitBounds(bounds, { padding: [50, 50], animate: true, maxZoom: 14 });
    }
  }, [map, stores, activeStore]);

  useEffect(() => {
    // When the list expands/collapses, the map container height changes.
    // We must tell Leaflet to recalculate its size so it doesn't break visually.
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timeout);
  }, [map, showAllStores]);

  return null;
};

// StoreMarker handles automatically opening popups for active stores
const StoreMarker = ({ store, isActive }) => {
  const markerRef = React.useRef(null);
  
  useEffect(() => {
    if (isActive && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isActive]);

  return (
    <Marker position={[store.lat, store.lng]} icon={svgIcon} ref={markerRef}>
      <Popup>
        <strong>{store.name}</strong><br/>
        {store.address}
      </Popup>
    </Marker>
  );
};

const Stores = () => {
  const [showAllStores, setShowAllStores] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [activeStoreId, setActiveStoreId] = useState(null);
  
  const mapCenter = [12.95, 80.20];

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            store.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            store.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCity = selectedCity ? store.city.toLowerCase().includes(selectedCity.toLowerCase()) : true;
      return matchesSearch && matchesCity;
    });
  }, [searchTerm, selectedCity]);

  const activeStore = useMemo(() => {
    return filteredStores.find(s => s.id === activeStoreId) || null;
  }, [filteredStores, activeStoreId]);

  const handleSearchClick = () => {
    if (filteredStores.length > 0) {
      setActiveStoreId(filteredStores[0].id);
    }
  };

  return (
    <div className="stores-page">
      <SEO 
        title="Our Stores" 
        description="Find a Convenio Mart store near you. Explore our outlet locations across Chennai and get directions to your nearest neighborhood store." 
        keywords="convenio mart locations, grocery stores near me, convenio mart chennai"
      />
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Our Stores</h1>
        </div>

        <div className="store-search-bar">
          <div className="search-input-group">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Search by city, area or store name.." 
              aria-label="Search stores by city, area or name"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setActiveStoreId(null);
                setShowAllStores(true); // Auto expand when searching
              }}
            />
          </div>
          
          <div className="city-select-group">
            <select 
              value={selectedCity} 
              aria-label="Filter stores by city"
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setActiveStoreId(null);
                setShowAllStores(true); // Auto expand when filtering
              }}
            >
              <option value="">All Cities</option>
              <option value="chennai">Chennai</option>
              <option value="bangalore">Bangalore</option>
              <option value="hyderabad">Hyderabad</option>
            </select>
          </div>
          
          <button className="btn-search" onClick={handleSearchClick}>Search</button>
        </div>

        <div className="stores-content">
          <div className="stores-map-container">
            <div className="real-map">
              <MapContainer 
                center={mapCenter} 
                zoom={10} 
                style={{ width: '100%', height: '100%', borderRadius: '16px' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater stores={filteredStores} activeStore={activeStore} showAllStores={showAllStores} />
                {filteredStores.map(store => {
                  const isActive = activeStoreId === store.id || filteredStores.length === 1;
                  return <StoreMarker key={store.id} store={store} isActive={isActive} />;
                })}
              </MapContainer>
            </div>
          </div>

          <div className="stores-list">
            {filteredStores.length === 0 ? (
              <div className="no-stores-found">
                <MapPin size={48} color="#cbd5e1" />
                <h3>No stores found</h3>
                <p>Try adjusting your search or filters to find a store near you.</p>
              </div>
            ) : (
              filteredStores.slice(0, showAllStores ? filteredStores.length : 3).map(store => (
                <div 
                  key={store.id} 
                  className={`store-card ${activeStoreId === store.id ? 'active' : ''}`}
                  onClick={() => setActiveStoreId(store.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="store-card-img" style={{ backgroundImage: "url('/hero-store.webp')" }}></div>
                  <div className="store-card-info">
                    <h3 className="store-name">{store.name}</h3>
                    <p className="store-address">{store.address}</p>
                    <p className="store-city">{store.city}</p>
                    <p className="store-timing">{store.timing}</p>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="store-directions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Get Directions
                    </a>
                  </div>
                </div>
              ))
            )}
            
            {filteredStores.length > 3 && (
              <button 
                className={`btn-view-more ${showAllStores ? 'btn-view-less' : ''}`} 
                onClick={() => setShowAllStores(!showAllStores)}
              >
                {showAllStores ? 'View Less' : 'View More Locations'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stores;
