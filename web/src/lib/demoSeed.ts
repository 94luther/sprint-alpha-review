// Client-side mirror of api/src/data-store/seed.ts, trimmed to exactly what
// the web app's Merchant/CatalogItem types need (see lib/types.ts). Kept in
// its own file so demoApi.ts stays focused on behaviour, not data entry.
//
// Photo paths below match the /food/<name>.jpg convention the dev-server
// build fetches from web/public/food; demoApi.ts resolves each one against
// the bundled src/assets/food map before handing merchants to the app.
import type { Merchant } from './types'

export interface DemoMerchantSeed extends Merchant {
  // Internal-only pickup point, never part of the CatalogResponse contract
  // (mirrors MerchantRecord.lat/lng on the real api), used to give couriers
  // a sensible start position and route line on the demo map.
  pickup: { lat: number; lng: number }
}

export const DEMO_MERCHANTS: DemoMerchantSeed[] = [
  {
    id: 'm1',
    name: "Mama T's Kitchen",
    type: 'food',
    age_restricted: false,
    heroImage: '/food/stew.jpg',
    rating: 4.7,
    ratingCount: 320,
    etaMinLow: 25,
    etaMinHigh: 40,
    deliveryFee: 12,
    promo: '20% off, up to P30',
  status: 'open',
    pickup: { lat: -24.6559, lng: 25.9079 },
    items: [
      {
        id: 'm1-i1',
        name: 'Seswaa and Pap',
        price_bwp: 55,
        photo: '/food/stew.jpg',
        description: 'Slow-cooked shredded beef with a mound of soft pap.'
      },
      {
        id: 'm1-i2',
        name: 'Chicken and Rice',
        price_bwp: 45,
        photo: '/food/curryrice.jpg',
        description: 'Spiced chicken pieces over fragrant rice.'
      },
      {
        id: 'm1-i3',
        name: 'Beef Stew Plate',
        price_bwp: 50,
        photo: '/food/beans.jpg',
        description: 'Hearty beef stew plate with a side of beans.'
      },
      {
        id: 'm1-i4',
        name: 'Vegetable Relish Plate',
        price_bwp: 35,
        photo: '/food/veg.jpg',
        description: 'Fresh seasonal vegetable relish, lightly spiced.'
      },
      {
        id: 'm1-i5',
        name: 'Grilled Chicken Quarter',
        price_bwp: 40,
        photo: '/food/friedrice.jpg',
        description: 'Chargrilled quarter chicken with a side of rice.'
      },
      {
        id: 'm1-i6',
        name: 'Bogobe with Sour Milk',
        price_bwp: 30,
        photo: '/food/bread2.jpg',
        description: 'Traditional sorghum porridge with cultured sour milk.'
      }
    ]
  },
  {
    id: 'm2',
    name: 'QuickMart Broadhurst',
    type: 'grocery',
    age_restricted: false,
    heroImage: '/food/grocery.jpg',
    rating: 3.9,
    ratingCount: 41,
    etaMinLow: 30,
    etaMinHigh: 50,
    deliveryFee: 15,
    promo: null,
  status: 'busy',
    pickup: { lat: -24.6422, lng: 25.9432 },
    items: [
      {
        id: 'm2-i1',
        name: 'White Bread 700g',
        price_bwp: 14,
        photo: '/food/bread.jpg',
        description: 'Fresh sliced white bread loaf, 700g.'
      },
      {
        id: 'm2-i2',
        name: 'Fresh Milk 1L',
        price_bwp: 18,
        photo: '/food/milk.jpg',
        description: 'Full cream fresh milk, 1 litre.'
      },
      {
        id: 'm2-i3',
        name: 'Eggs Tray of 30',
        price_bwp: 55,
        photo: '/food/grocery.jpg',
        description: 'Tray of 30 farm fresh eggs.'
      },
      {
        id: 'm2-i4',
        name: 'White Sugar 2kg',
        price_bwp: 32,
        photo: '/food/market.jpg',
        description: 'Refined white sugar, 2kg bag.'
      },
      {
        id: 'm2-i5',
        name: 'Cooking Oil 750ml',
        price_bwp: 28,
        photo: '/food/veg.jpg',
        description: 'Pure sunflower cooking oil, 750ml.'
      },
      {
        id: 'm2-i6',
        name: 'Maize Meal 10kg',
        price_bwp: 95,
        photo: '/food/beans.jpg',
        description: 'Coarse maize meal, 10kg bag, a kitchen staple.'
      }
    ]
  },
  {
    id: 'm3',
    name: 'CloudNine Vapes',
    type: 'vape',
    age_restricted: true,
    heroImage: '/food/market.jpg',
    rating: 4.2,
    ratingCount: 96,
    etaMinLow: 25,
    etaMinHigh: 45,
    deliveryFee: 18,
    promo: null,
  status: 'closed',
    pickup: { lat: -24.6297, lng: 25.9256 },
    items: [
      {
        id: 'm3-i1',
        name: 'Disposable Vape 2500 Puffs',
        price_bwp: 180,
        photo: '/food/market.jpg',
        description: 'Disposable vape device, approximately 2500 puffs.'
      },
      {
        id: 'm3-i2',
        name: 'Disposable Vape 5000 Puffs',
        price_bwp: 250,
        photo: '/food/grocery.jpg',
        description: 'Disposable vape device, approximately 5000 puffs.'
      },
      {
        id: 'm3-i3',
        name: 'Vape Juice 30ml',
        price_bwp: 120,
        photo: '/food/veg.jpg',
        description: 'E-liquid refill bottle, 30ml.'
      },
      {
        id: 'm3-i4',
        name: 'Replacement Coils 5 Pack',
        price_bwp: 90,
        photo: '/food/bread2.jpg',
        description: 'Pack of 5 replacement coils.'
      },
      {
        id: 'm3-i5',
        name: 'Starter Kit',
        price_bwp: 350,
        photo: '/food/beans.jpg',
        description: 'Complete starter kit with device and charger.'
      }
    ]
  },
  {
    id: 'm4',
    name: 'Kgale Pharmacy',
    type: 'pharmacy',
    age_restricted: false,
    heroImage: '/food/pharmacy.jpg',
    rating: 4.8,
    ratingCount: 142,
    etaMinLow: 15,
    etaMinHigh: 30,
    deliveryFee: 10,
    promo: 'Free delivery on your first order',
  status: 'open',
    pickup: { lat: -24.6675, lng: 25.9092 },
    items: [
      {
        id: 'm4-i1',
        name: 'Paracetamol 500mg',
        price_bwp: 25,
        photo: '/food/pharmacy.jpg',
        description: 'Pack of 20 paracetamol tablets, 500mg.'
      },
      {
        id: 'm4-i2',
        name: 'Ibuprofen 200mg',
        price_bwp: 30,
        photo: '/food/pharmacy.jpg',
        description: 'Pack of 20 ibuprofen tablets, 200mg.'
      },
      {
        id: 'm4-i3',
        name: 'Multivitamin Tablets 30s',
        price_bwp: 65,
        photo: '/food/pharmacy.jpg',
        description: 'Daily multivitamin, 30 tablet pack.'
      },
      {
        id: 'm4-i4',
        name: 'Digital Thermometer',
        price_bwp: 85,
        photo: '/food/pharmacy.jpg',
        description: 'Fast-read digital body thermometer.'
      },
      {
        id: 'm4-i5',
        name: 'Hand Sanitizer 500ml',
        price_bwp: 35,
        photo: '/food/pharmacy.jpg',
        description: 'Alcohol-based hand sanitizer, 500ml pump bottle.'
      }
    ]
  }
]

// Same five names api/src/data-store/seed.ts hands out to demo couriers.
export const DEMO_COURIER_NAMES = ['Kabelo', 'Tumi', 'Ofentse', 'Naledi', 'Thato']

// Same 8 Gaborone waypoints as api/src/common/waypoints.ts, all inside the
// GaboroneMap bounding box (lat -24.60..-24.70, lng 25.85..25.95).
export const WAYPOINTS: { name: string; lat: number; lng: number }[] = [
  { name: 'CBD', lat: -24.6282, lng: 25.9231 },
  { name: 'Main Mall', lat: -24.6539, lng: 25.9089 },
  { name: 'Broadhurst', lat: -24.6392, lng: 25.9412 },
  { name: 'Game City', lat: -24.6685, lng: 25.9107 },
  { name: 'Riverwalk', lat: -24.6743, lng: 25.9298 },
  { name: 'Extension 9', lat: -24.6198, lng: 25.8912 },
  { name: 'University of Botswana', lat: -24.6841, lng: 25.9214 },
  { name: 'Airport Junction', lat: -24.6061, lng: 25.9183 }
]

// Matches the fixed customer pin Track.tsx renders on the map.
export const DEMO_CUSTOMER_PIN = { lat: -24.672, lng: 25.902 }
