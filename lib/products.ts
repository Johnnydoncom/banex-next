// Asset paths — pointing to /public/assets/ (no module import needed in Next.js)
const phone1 = "/assets/phone-1.jpg"
const phone2 = "/assets/phone-2.jpg"
const phone3 = "/assets/phone-3.jpg"
const phone4 = "/assets/phone-4.jpg"
const phone5 = "/assets/phone-5.jpg"
const phone6 = "/assets/phone-6.jpg"
const catCar = "/assets/cat-car.jpg"
const catApt = "/assets/cat-apartment.jpg"
const catLaptop = "/assets/cat-laptop.jpg"
const catSofa = "/assets/cat-sofa.jpg"
const catSneakers = "/assets/cat-sneakers.jpg"
const catPerfume = "/assets/cat-perfume.jpg"
const catBike = "/assets/cat-bike.jpg"
const catWatch = "/assets/cat-watch.jpg"
const catFridge = "/assets/cat-fridge.jpg"
const catPuppy = "/assets/cat-puppy.jpg"
const catStroller = "/assets/cat-stroller.jpg"
const catVeg = "/assets/cat-veg.jpg"

export type Seller = {
  id: string
  name: string
  price: number
  delivery: string
  rating: number
  reviews: number
  verified: boolean
  location: string
}

export type Product = {
  id: string
  slug: string
  name: string
  brand: string
  /** Top-level category slug from lib/categories.ts */
  categorySlug: string
  /** Subcategory slug */
  subcategorySlug: string
  image: string
  basePrice: number
  rating: number
  reviews: number
  /** Free-form key/value specs (e.g. Storage, Bedrooms, Mileage) */
  specs: Record<string, string>
  description: string
  condition?: "New" | "Used" | "Refurbished"
  sellers: Seller[]
}

const lagos = "Lagos"
const abuja = "Abuja"
const ph = "Port Harcourt"

const trustedSellers = {
  goldline: { id: "s-goldline", name: "Goldline Mobile", rating: 4.9, reviews: 1280, verified: true, location: lagos },
  apex: { id: "s-apex", name: "Apex Devices", rating: 4.7, reviews: 842, verified: true, location: abuja },
  techhaven: { id: "s-techhaven", name: "TechHaven NG", rating: 4.6, reviews: 510, verified: false, location: ph },
  crown: { id: "s-crown", name: "Crown Gadgets", rating: 4.8, reviews: 990, verified: true, location: lagos },
  motorking: { id: "s-motor", name: "MotorKing Autos", rating: 4.7, reviews: 412, verified: true, location: lagos },
  primeestate: { id: "s-prime", name: "Prime Estate Realty", rating: 4.8, reviews: 220, verified: true, location: abuja },
  vogue: { id: "s-vogue", name: "Vogue Boutique", rating: 4.6, reviews: 780, verified: true, location: lagos },
  greenfarm: { id: "s-farm", name: "Green Farm NG", rating: 4.9, reviews: 156, verified: true, location: "Ibadan" },
  homestyle: { id: "s-home", name: "HomeStyle Living", rating: 4.7, reviews: 640, verified: true, location: lagos },
  petsworld: { id: "s-pets", name: "Pets World", rating: 4.8, reviews: 310, verified: true, location: lagos },
  babyhub: { id: "s-baby", name: "Baby Hub NG", rating: 4.7, reviews: 198, verified: true, location: abuja },
  glowco: { id: "s-glow", name: "Glow Cosmetics", rating: 4.8, reviews: 1120, verified: true, location: lagos },
  fitnesspro: { id: "s-fit", name: "FitnessPro NG", rating: 4.6, reviews: 290, verified: true, location: lagos },
}

function S(base: typeof trustedSellers.goldline, price: number, delivery: string): Seller {
  return { ...base, price, delivery }
}

export const products: Product[] = [
  // Phones
  {
    id: "p1", slug: "noir-titan-pro", name: "Noir Titan Pro", brand: "Banex Labs",
    categorySlug: "phones-tablets", subcategorySlug: "smartphones", image: phone1, basePrice: 1250000,
    rating: 4.9, reviews: 2410, condition: "New",
    specs: { Storage: "512GB", RAM: "12GB", Display: '6.7" OLED 120Hz', Battery: "5000 mAh" },
    description: "An obsidian flagship engineered for those who demand more.",
    sellers: [
      S(trustedSellers.goldline, 1250000, "1–2 days"),
      S(trustedSellers.apex, 1289000, "Same day"),
      S(trustedSellers.techhaven, 1235000, "3–4 days"),
      S(trustedSellers.crown, 1305000, "1 day"),
    ],
  },
  {
    id: "p2", slug: "aurum-fold-x", name: "Aurum Fold X", brand: "Banex Labs",
    categorySlug: "phones-tablets", subcategorySlug: "smartphones", image: phone2, basePrice: 1850000,
    rating: 4.8, reviews: 1120, condition: "New",
    specs: { Storage: "1TB", RAM: "16GB", Display: '7.6" Foldable AMOLED', Battery: "4800 mAh" },
    description: "Two screens. One masterpiece. A foldable for the new generation.",
    sellers: [
      S(trustedSellers.goldline, 1850000, "1–2 days"),
      S(trustedSellers.crown, 1825000, "2 days"),
    ],
  },
  {
    id: "p3", slug: "midnight-edge-12", name: "Midnight Edge 12", brand: "Vexa",
    categorySlug: "phones-tablets", subcategorySlug: "smartphones", image: phone3, basePrice: 980000,
    rating: 4.7, reviews: 3210, condition: "New",
    specs: { Storage: "256GB", RAM: "12GB", Display: '6.5" Dynamic AMOLED', Battery: "5200 mAh" },
    description: "Midnight blue with titanium edges. Built for travelers and creators.",
    sellers: [
      S(trustedSellers.apex, 980000, "Same day"),
      S(trustedSellers.techhaven, 965000, "3 days"),
      S(trustedSellers.goldline, 999000, "1–2 days"),
    ],
  },
  {
    id: "p4", slug: "silvercast-mini", name: "Silvercast Mini", brand: "Vexa",
    categorySlug: "phones-tablets", subcategorySlug: "smartphones", image: phone4, basePrice: 540000,
    rating: 4.6, reviews: 1890, condition: "New",
    specs: { Storage: "128GB", RAM: "8GB", Display: '5.8" Super Retina', Battery: "3800 mAh" },
    description: "Pocket precision with full-flagship performance.",
    sellers: [
      S(trustedSellers.techhaven, 540000, "3 days"),
      S(trustedSellers.apex, 555000, "Same day"),
    ],
  },
  {
    id: "p5", slug: "obsidian-strike-g7", name: "Obsidian Strike G7", brand: "Volt",
    categorySlug: "phones-tablets", subcategorySlug: "smartphones", image: phone5, basePrice: 720000,
    rating: 4.8, reviews: 1540, condition: "New",
    specs: { Storage: "256GB", RAM: "16GB", Display: '6.8" 165Hz AMOLED', Battery: "6000 mAh" },
    description: "Engineered for victory. Vapor-chamber cooling and 165Hz response.",
    sellers: [
      S(trustedSellers.crown, 720000, "1 day"),
      S(trustedSellers.apex, 715000, "Same day"),
    ],
  },
  {
    id: "p6", slug: "rosa-aurum-lite", name: "Rosa Aurum Lite", brand: "Banex Labs",
    categorySlug: "phones-tablets", subcategorySlug: "smartphones", image: phone6, basePrice: 320000,
    rating: 4.5, reviews: 4210, condition: "New",
    specs: { Storage: "128GB", RAM: "6GB", Display: '6.3" OLED', Battery: "5000 mAh" },
    description: "Rose gold elegance at a fair price.",
    sellers: [
      S(trustedSellers.techhaven, 320000, "3 days"),
      S(trustedSellers.goldline, 335000, "1–2 days"),
    ],
  },

  // Vehicles
  {
    id: "v1", slug: "executive-sedan-2024", name: "Executive Sedan 2024", brand: "Toyota",
    categorySlug: "vehicles", subcategorySlug: "cars", image: catCar, basePrice: 18500000,
    rating: 4.8, reviews: 42, condition: "New",
    specs: { Mileage: "0 km", Transmission: "Automatic", Fuel: "Petrol", Year: "2024" },
    description: "Brand-new luxury sedan with full leather interior and panoramic sunroof.",
    sellers: [S(trustedSellers.motorking, 18500000, "5–7 days")],
  },
  {
    id: "v2", slug: "city-cruiser-bike", name: "City Cruiser Bike", brand: "Trek",
    categorySlug: "vehicles", subcategorySlug: "bicycles", image: catBike, basePrice: 285000,
    rating: 4.7, reviews: 128, condition: "New",
    specs: { Frame: "Aluminium", Gears: "21-speed", Wheel: '28"', Use: "Urban" },
    description: "Lightweight commuter bike with disc brakes.",
    sellers: [
      S(trustedSellers.fitnesspro, 285000, "2–3 days"),
      S(trustedSellers.crown, 299000, "1–2 days"),
    ],
  },

  // Property
  {
    id: "r1", slug: "luxury-2bed-apartment-lekki", name: "Luxury 2-Bedroom Apartment in Lekki", brand: "Prime Estate",
    categorySlug: "property", subcategorySlug: "for-rent", image: catApt, basePrice: 4500000,
    rating: 4.9, reviews: 18,
    specs: { Bedrooms: "2", Bathrooms: "3", Area: "120 m²", Furnishing: "Furnished" },
    description: "Modern serviced apartment in Lekki Phase 1, with 24/7 power and pool access.",
    sellers: [S(trustedSellers.primeestate, 4500000, "Move-in 7 days")],
  },

  // Electronics
  {
    id: "e1", slug: "ultra-pro-laptop-15", name: "UltraPro Laptop 15", brand: "Lenova",
    categorySlug: "electronics", subcategorySlug: "laptops", image: catLaptop, basePrice: 1150000,
    rating: 4.7, reviews: 312, condition: "New",
    specs: { CPU: "Intel i7", RAM: "16GB", Storage: "512GB SSD", Display: '15.6" FHD' },
    description: "Slim productivity laptop with all-day battery life.",
    sellers: [
      S(trustedSellers.crown, 1150000, "2 days"),
      S(trustedSellers.apex, 1175000, "Same day"),
    ],
  },

  // Home & Garden
  {
    id: "h1", slug: "scandi-3-seater-sofa", name: "Scandi 3-Seater Sofa", brand: "HomeStyle",
    categorySlug: "home-garden", subcategorySlug: "furniture", image: catSofa, basePrice: 420000,
    rating: 4.8, reviews: 96, condition: "New",
    specs: { Material: "Boucle fabric", Seats: "3", Color: "Light grey", Frame: "Solid wood" },
    description: "Minimalist Scandinavian sofa for modern living rooms.",
    sellers: [S(trustedSellers.homestyle, 420000, "3–5 days")],
  },
  {
    id: "h2", slug: "frostmax-french-door-fridge", name: "FrostMax French-Door Fridge", brand: "Eshu",
    categorySlug: "home-garden", subcategorySlug: "appliances", image: catFridge, basePrice: 980000,
    rating: 4.6, reviews: 64, condition: "New",
    specs: { Capacity: "540 L", Doors: "French", Energy: "A++", Color: "Inox" },
    description: "Spacious double-door fridge with water dispenser and inverter compressor.",
    sellers: [
      S(trustedSellers.homestyle, 980000, "3–5 days"),
      S(trustedSellers.crown, 999000, "2 days"),
    ],
  },

  // Fashion
  {
    id: "f1", slug: "classic-white-sneakers", name: "Classic White Leather Sneakers", brand: "Vogue",
    categorySlug: "fashion", subcategorySlug: "shoes", image: catSneakers, basePrice: 38000,
    rating: 4.7, reviews: 540, condition: "New",
    specs: { Material: "Genuine leather", Sizes: "39 – 45", Color: "White", Sole: "Rubber" },
    description: "Timeless minimalist sneakers that pair with everything.",
    sellers: [
      S(trustedSellers.vogue, 38000, "1–2 days"),
      S(trustedSellers.apex, 41000, "Same day"),
    ],
  },
  {
    id: "f2", slug: "rose-gold-classic-watch", name: "Rose Gold Classic Watch", brand: "Sterling",
    categorySlug: "fashion", subcategorySlug: "watches", image: catWatch, basePrice: 78000,
    rating: 4.6, reviews: 220, condition: "New",
    specs: { Movement: "Quartz", Case: "Stainless steel", Strap: "Leather", Water: "5 ATM" },
    description: "Elegant rose-gold dress watch with sapphire crystal.",
    sellers: [S(trustedSellers.vogue, 78000, "1–2 days")],
  },

  // Beauty
  {
    id: "b1", slug: "amber-rose-eau-de-parfum", name: "Amber Rose Eau de Parfum", brand: "Glow",
    categorySlug: "beauty", subcategorySlug: "fragrance", image: catPerfume, basePrice: 22000,
    rating: 4.8, reviews: 1310, condition: "New",
    specs: { Volume: "100 ml", Notes: "Amber, Rose, Vanilla", Type: "Eau de Parfum", Gender: "Unisex" },
    description: "A warm, sensual fragrance with notes of rose and amber.",
    sellers: [S(trustedSellers.glowco, 22000, "Same day")],
  },

  // Babies & Kids
  {
    id: "k1", slug: "comfort-plus-baby-stroller", name: "Comfort Plus Baby Stroller", brand: "BabyHub",
    categorySlug: "babies-kids", subcategorySlug: "strollers", image: catStroller, basePrice: 95000,
    rating: 4.7, reviews: 188, condition: "New",
    specs: { Age: "0 – 3 yrs", Weight: "9 kg", Recline: "Multi-position", Foldable: "Yes" },
    description: "Lightweight, foldable stroller with reversible seat and large canopy.",
    sellers: [S(trustedSellers.babyhub, 95000, "2 days")],
  },

  // Pets
  {
    id: "pet1", slug: "golden-retriever-puppy", name: "Golden Retriever Puppy", brand: "Pets World",
    categorySlug: "pets", subcategorySlug: "dogs", image: catPuppy, basePrice: 180000,
    rating: 4.9, reviews: 24,
    specs: { Age: "8 weeks", Vaccinated: "Yes", Gender: "Male", Pedigree: "Yes" },
    description: "Healthy, vaccinated golden retriever puppy from a reputable breeder.",
    sellers: [S(trustedSellers.petsworld, 180000, "Pickup or 1 day")],
  },

  // Food
  {
    id: "fd1", slug: "fresh-vegetable-basket", name: "Fresh Vegetable Basket (5kg)", brand: "Green Farm",
    categorySlug: "food", subcategorySlug: "fresh-produce", image: catVeg, basePrice: 8500,
    rating: 4.9, reviews: 412, condition: "New",
    specs: { Weight: "5 kg", Contents: "Tomato, carrot, herbs", Origin: "Ibadan", Organic: "Yes" },
    description: "Farm-fresh organic vegetable basket delivered weekly.",
    sellers: [S(trustedSellers.greenfarm, 8500, "Next day")],
  },
]

export function formatNaira(value: number) {
  return "₦" + value.toLocaleString("en-NG")
}

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug)
}

export function getProductsByCategory(slug: string) {
  return products.filter((p) => p.categorySlug === slug)
}
