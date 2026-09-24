/**
 * Wristora Mock Database (Phase 3 UI shell feed)
 * 
 * Central mock database used to design layouts before database binding.
 * Keeping this in a dedicated utility file allows us to easily delete or swap 
 * this out for Firebase collections in Phase 6 without touching component code.
 */

export const mockCategories = [
  { id: 'cat-1', name: 'Luxury', description: 'Premium luxury gold and platinum watches', image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=400' },
  { id: 'cat-2', name: 'Classic', description: 'Timeless elegant leather strap models', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=400' },
  { id: 'cat-3', name: 'Sports', description: 'Sports chronographs and deep-water divers', image: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?auto=format&fit=crop&q=80&w=400' },
  { id: 'cat-4', name: 'Limited', description: 'Extremely rare configurations', image: 'https://images.unsplash.com/photo-1619134778706-7015533a6150?auto=format&fit=crop&q=80&w=400' }
];

export const mockProducts = [
  {
    id: 'prod-1',
    name: 'Rolex Datejust 41',
    brand: 'Rolex',
    category: 'Luxury',
    price: 745000,
    discountPrice: 699000,
    stock: 15,
    rating: 4.8,
    numReviews: 120,
    image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=800&zoom=1',
      'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=800&zoom=2'
    ],
    description: 'The Rolex Datejust 41 is a timeless icon, combining elegance and precision. Featuring a solid stainless steel build, gold fluted bezel, and the signatures cyclops lens, it stands as a testament of prestige.',
    specifications: {
      movement: 'Automatic (Calibre 3235)',
      caseSize: '41mm',
      caseMaterial: 'Oystersteel & Gold',
      strapMaterial: 'Jubilee Oystersteel',
      waterResistance: '100m (330ft)',
      warranty: '2 Years Global'
    },
    isFeatured: true,
    isNewArrival: true,
    status: 'active'
  },
  {
    id: 'prod-2',
    name: 'Omega Speedmaster Professional',
    brand: 'Omega',
    category: 'Chronograph',
    price: 620000,
    stock: 10,
    rating: 4.9,
    numReviews: 95,
    image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=800&zoom=1',
      'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=800&zoom=2'
    ],
    description: 'The Omega Speedmaster Professional is famously known as the Moonwatch. Tested by NASA, this chronograph features a manual-winding movement and a black tachymeter bezel.',
    specifications: {
      movement: 'Manual-wind (Calibre 3861)',
      caseSize: '42mm',
      caseMaterial: 'Stainless Steel',
      strapMaterial: 'Steel Bracelet',
      waterResistance: '50m (167ft)',
      warranty: '2 Years Global'
    },
    isFeatured: true,
    isNewArrival: false,
    status: 'active'
  },
  {
    id: 'prod-3',
    name: 'Hublot Big Bang Unico Carbon',
    brand: 'Hublot',
    category: 'Sports',
    price: 1845000,
    stock: 8,
    rating: 4.7,
    numReviews: 45,
    image: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1622434641406-a158123450f9?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1622434641406-a158123450f9?auto=format&fit=crop&q=80&w=800&zoom=1',
      'https://images.unsplash.com/photo-1622434641406-a158123450f9?auto=format&fit=crop&q=80&w=800&zoom=2'
    ],
    description: 'The Hublot Big Bang Unico Carbon is a masterclass in materials fusion. Featuring a lightweight carbon fiber case, a skeletonized dial displaying the in-house Flyback Chronograph movement, and a structured black rubber strap.',
    specifications: {
      movement: 'Automatic Flyback Chronograph (HUB1280)',
      caseSize: '44mm',
      caseMaterial: 'Carbon Fiber',
      strapMaterial: 'Black Structured Rubber',
      waterResistance: '100m (330ft)',
      warranty: '2 Years Global'
    },
    isFeatured: true,
    isNewArrival: true,
    status: 'active'
  },
  {
    id: 'prod-4',
    name: 'Seiko Presage Cocktail Time',
    brand: 'Seiko',
    category: 'Classic',
    price: 112000,
    stock: 22,
    rating: 4.6,
    numReviews: 156,
    image: 'https://images.unsplash.com/photo-1619134778706-7015533a6150?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1619134778706-7015533a6150?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1619134778706-7015533a6150?auto=format&fit=crop&q=80&w=800&zoom=1',
      'https://images.unsplash.com/photo-1619134778706-7015533a6150?auto=format&fit=crop&q=80&w=800&zoom=2'
    ],
    description: 'Seiko Presage Cocktail Time features a gorgeous sunburst dial inspired by Tokyo sky bars. Clean dress aesthetics with an exhibition caseback.',
    specifications: {
      movement: 'Automatic (Calibre 4R35)',
      caseSize: '40.5mm',
      caseMaterial: 'Stainless Steel',
      strapMaterial: 'Brown Leather',
      waterResistance: '50m (167ft)',
      warranty: '2 Years Global'
    },
    isFeatured: true,
    isNewArrival: true,
    status: 'active'
  },
  {
    id: 'prod-5',
    name: 'Tag Heuer Aquaracer Professional',
    brand: 'Tag Heuer',
    category: 'Sports',
    price: 310000,
    stock: 12,
    rating: 4.5,
    numReviews: 78,
    image: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=800&zoom=1',
      'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=800&zoom=2'
    ],
    description: 'The Tag Heuer Aquaracer Professional is a rugged, luxury dive watch. Waterproof up to 300 meters, it features a steel case, a unidirectional ceramic bezel, and a blue dial.',
    specifications: {
      movement: 'Automatic (Calibre 5)',
      caseSize: '43mm',
      caseMaterial: 'Stainless Steel',
      strapMaterial: 'Steel Bracelet',
      waterResistance: '300m (1000ft)',
      warranty: '2 Years Global'
    },
    isFeatured: true,
    isNewArrival: true,
    status: 'active'
  },
  {
    id: 'prod-6',
    name: 'Tissot Le Locle Powermatic 80',
    brand: 'Tissot',
    category: 'Classic',
    price: 68000,
    stock: 18,
    rating: 4.6,
    numReviews: 54,
    image: 'https://images.unsplash.com/photo-1539874754764-5a96559165b0?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1539874754764-5a96559165b0?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1539874754764-5a96559165b0?auto=format&fit=crop&q=80&w=800&zoom=1',
      'https://images.unsplash.com/photo-1539874754764-5a96559165b0?auto=format&fit=crop&q=80&w=800&zoom=2'
    ],
    description: 'The Tissot Le Locle Powermatic 80 represents Swiss watchmaking heritage. With an elegant dial, Roman numerals, and a sapphire crystal caseback, it offers an 80-hour power reserve.',
    specifications: {
      movement: 'Automatic (Powermatic 80)',
      caseSize: '39.3mm',
      caseMaterial: 'Stainless Steel',
      strapMaterial: 'Black Leather Strap',
      waterResistance: '30m (100ft)',
      warranty: '2 Years Global'
    },
    isFeatured: true,
    isNewArrival: false,
    status: 'active'
  },
  {
    id: 'prod-7',
    name: 'Apple i-Watch Ultra Titanium Edition',
    brand: 'i-Watch',
    category: 'Sports',
    price: 89900,
    discountPrice: 84900,
    stock: 14,
    rating: 4.9,
    numReviews: 88,
    image: 'https://images.unsplash.com/photo-1510017803434-a899398421b3?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1510017803434-a899398421b3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'The Apple i-Watch Ultra Titanium Edition features aerospace-grade titanium, precision dual-frequency GPS, customizable Action button, and 100m water resistance.',
    specifications: {
      movement: 'S9 SiP Dual-Core 64-bit Architecture',
      caseSize: '49mm',
      caseMaterial: 'Aerospace-Grade Titanium',
      strapMaterial: 'Orange Alpine Loop High-Strength Textile',
      waterResistance: '100m (330ft)',
      warranty: '2 Years Global AppleCare+'
    },
    isFeatured: true,
    isNewArrival: true,
    status: 'active'
  },
  {
    id: 'prod-8',
    name: 'Patek Philippe Nautilus 5711/1R',
    brand: 'Patek Philippe',
    category: 'Luxury',
    price: 7500000,
    discountPrice: 7200000,
    stock: 3,
    rating: 5.0,
    numReviews: 42,
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'The Patek Philippe Nautilus 5711/1R in 18K rose gold with warm brown sunburst dial is the quintessential luxury sports watch, featuring the self-winding calibre 26-330 S C with Geneva seal certification.',
    specifications: {
      movement: 'Automatic (Calibre 26-330 S C)',
      caseSize: '40mm',
      caseMaterial: '18K Rose Gold',
      strapMaterial: '18K Rose Gold Bracelet',
      waterResistance: '120m (400ft)',
      warranty: '5 Years Patek Philippe International'
    },
    isFeatured: true,
    isNewArrival: true,
    status: 'active'
  }
];

export const mockOrders = [
  {
    id: 'ORD-9021',
    date: '28/08/2026',
    customer: {
      name: 'Julian Vance',
      email: 'julian.vance@horology.com',
      phone: '+91 98201 44552',
      address: 'Villa 14, Palm Avenue, Juhu',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400049'
    },
    items: [
      { name: 'Rolex Datejust 41', quantity: 1, price: 745000, image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=400' }
    ],
    amount: 745000,
    paymentMethod: 'Prepaid (HDFC Platinum Card)',
    trackingNumber: 'BLUEDART-SEC-8821903',
    status: 'Delivered'
  },
  {
    id: 'ORD-9022',
    date: '30/08/2026',
    customer: {
      name: 'Aarav Singhania',
      email: 'aarav.singhania@heritage.in',
      phone: '+91 98110 33921',
      address: 'Penthouse 8, Embassy Golf Links',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560071'
    },
    items: [
      { name: 'Omega Speedmaster Professional', quantity: 1, price: 620000, image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=400' },
      { name: 'Seiko Prospex Diver', quantity: 1, price: 95000, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400' }
    ],
    amount: 715000,
    paymentMethod: 'UPI Verified (ICICI Bank)',
    trackingNumber: 'DELHIVERY-VAL-901284',
    status: 'Shipped'
  },
  {
    id: 'ORD-9023',
    date: '01/09/2026',
    customer: {
      name: 'Devika Mehra',
      email: 'devika.mehra@curator.org',
      phone: '+91 98402 11988',
      address: '42 Boat Club Road, Alwarpet',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600028'
    },
    items: [
      { name: 'Hublot Big Bang Unico', quantity: 1, price: 1450000, image: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?auto=format&fit=crop&q=80&w=400' }
    ],
    amount: 1450000,
    paymentMethod: 'Bank Wire (Standard Chartered)',
    trackingNumber: 'Awaiting Dispatch',
    status: 'Processing'
  }
];

export const mockBrands = [
  { id: 'brand-1', name: 'Rolex', country: 'Switzerland', founded: '1905' },
  { id: 'brand-2', name: 'Omega', country: 'Switzerland', founded: '1848' },
  { id: 'brand-3', name: 'Hublot', country: 'Switzerland', founded: '1980' },
  { id: 'brand-4', name: 'Seiko', country: 'Japan', founded: '1881' },
  { id: 'brand-5', name: 'Tag Heuer', country: 'Switzerland', founded: '1860' },
  { id: 'brand-6', name: 'Tissot', country: 'Switzerland', founded: '1853' },
  { id: 'brand-7', name: 'Patek Philippe', country: 'Geneva, Switzerland', founded: '1839' },
  { id: 'brand-8', name: 'Audemars Piguet', country: 'Le Brassus, Switzerland', founded: '1875' },
  { id: 'brand-9', name: 'i-Watch', country: 'California, USA', founded: '2015' }
];

