// Asset paths pointing to /public/assets/
const catCar = "/assets/cat-car.jpg"
const catApt = "/assets/cat-apartment.jpg"
const catLaptop = "/assets/cat-laptop.jpg"
const catSofa = "/assets/cat-sofa.jpg"
const catSneakers = "/assets/cat-sneakers.jpg"
const catPerfume = "/assets/cat-perfume.jpg"
const catWatch = "/assets/cat-watch.jpg"
const catFridge = "/assets/cat-fridge.jpg"
const catVeg = "/assets/cat-veg.jpg"
const catStroller = "/assets/cat-stroller.jpg"
const catPuppy = "/assets/cat-puppy.jpg"
const phone1 = "/assets/phone-1.jpg"

export type Vendor = {
  id: string
  slug: string
  name: string
  tagline: string
  banner: string
  avatar: string
  /** floor like "Ground", "1st", "2nd", "3rd" */
  floor: string
  /** stall number e.g. "G-12" */
  stall: string
  /** opening hours summary */
  hours: string
  /** is open right now (mocked) */
  openNow: boolean
  rating: number
  reviews: number
  /** typical rider delivery window in minutes */
  deliveryMins: number
  /** flat rider fee within Abuja */
  riderFee: number
  minOrder: number
  /** category slugs the vendor sells in */
  categories: string[]
  /** product slugs sold by this vendor */
  productSlugs: string[]
  /** featured / "tenant prominence" tier */
  tier: "Anchor" | "Premium" | "Standard"
  verified: boolean
  /** floor-map percentage coords (x,y from 0–100) */
  map: { x: number; y: number }
}

export const vendors: Vendor[] = [
  {
    id: "v-goldline", slug: "goldline-mobile", name: "Goldline Mobile",
    tagline: "Flagship phones, accessories & repair bar",
    banner: phone1, avatar: phone1,
    floor: "Ground", stall: "G-12",
    hours: "Mon–Sun · 9:00 – 21:00", openNow: true,
    rating: 4.9, reviews: 1280, deliveryMins: 35, riderFee: 1500, minOrder: 5000,
    categories: ["phones-tablets", "electronics"],
    productSlugs: ["noir-titan-pro", "aurum-fold-x", "midnight-edge-12", "rosa-aurum-lite"],
    tier: "Anchor", verified: true, map: { x: 22, y: 35 },
  },
  {
    id: "v-apex", slug: "apex-devices", name: "Apex Devices",
    tagline: "Same-day phone & laptop hub",
    banner: catLaptop, avatar: catLaptop,
    floor: "Ground", stall: "G-21",
    hours: "Mon–Sat · 9:00 – 20:00", openNow: true,
    rating: 4.7, reviews: 842, deliveryMins: 40, riderFee: 1500, minOrder: 5000,
    categories: ["phones-tablets", "electronics"],
    productSlugs: ["midnight-edge-12", "silvercast-mini", "obsidian-strike-g7", "ultra-pro-laptop-15"],
    tier: "Premium", verified: true, map: { x: 45, y: 30 },
  },
  {
    id: "v-crown", slug: "crown-gadgets", name: "Crown Gadgets",
    tagline: "Smart home & gaming gear",
    banner: catFridge, avatar: catFridge,
    floor: "1st", stall: "F1-08",
    hours: "Mon–Sun · 10:00 – 21:00", openNow: true,
    rating: 4.8, reviews: 990, deliveryMins: 45, riderFee: 1800, minOrder: 5000,
    categories: ["electronics", "home-garden", "phones-tablets"],
    productSlugs: ["aurum-fold-x", "obsidian-strike-g7", "ultra-pro-laptop-15", "frostmax-french-door-fridge", "city-cruiser-bike"],
    tier: "Premium", verified: true, map: { x: 65, y: 22 },
  },
  {
    id: "v-vogue", slug: "vogue-boutique", name: "Vogue Boutique",
    tagline: "Curated fashion for everyday icons",
    banner: catSneakers, avatar: catSneakers,
    floor: "1st", stall: "F1-22",
    hours: "Mon–Sat · 10:00 – 21:00", openNow: true,
    rating: 4.6, reviews: 780, deliveryMins: 30, riderFee: 1500, minOrder: 5000,
    categories: ["fashion"],
    productSlugs: ["classic-white-sneakers", "rose-gold-classic-watch"],
    tier: "Anchor", verified: true, map: { x: 30, y: 60 },
  },
  {
    id: "v-glow", slug: "glow-cosmetics", name: "Glow Cosmetics",
    tagline: "Beauty bar · skincare · fragrance",
    banner: catPerfume, avatar: catPerfume,
    floor: "Ground", stall: "G-30",
    hours: "Mon–Sun · 9:00 – 22:00", openNow: true,
    rating: 4.8, reviews: 1120, deliveryMins: 25, riderFee: 1200, minOrder: 3000,
    categories: ["beauty"],
    productSlugs: ["amber-rose-eau-de-parfum"],
    tier: "Premium", verified: true, map: { x: 55, y: 55 },
  },
  {
    id: "v-homestyle", slug: "homestyle-living", name: "HomeStyle Living",
    tagline: "Furniture & home essentials showroom",
    banner: catSofa, avatar: catSofa,
    floor: "2nd", stall: "F2-05",
    hours: "Mon–Sat · 10:00 – 19:00", openNow: false,
    rating: 4.7, reviews: 640, deliveryMins: 90, riderFee: 4500, minOrder: 20000,
    categories: ["home-garden"],
    productSlugs: ["scandi-3-seater-sofa", "frostmax-french-door-fridge"],
    tier: "Standard", verified: true, map: { x: 75, y: 65 },
  },
  {
    id: "v-greenfarm", slug: "green-farm", name: "Green Farm",
    tagline: "Fresh produce, daily harvest",
    banner: catVeg, avatar: catVeg,
    floor: "Ground", stall: "G-04",
    hours: "Mon–Sun · 7:00 – 20:00", openNow: true,
    rating: 4.9, reviews: 156, deliveryMins: 30, riderFee: 1200, minOrder: 2500,
    categories: ["food"],
    productSlugs: ["fresh-vegetable-basket"],
    tier: "Standard", verified: true, map: { x: 12, y: 70 },
  },
  {
    id: "v-babyhub", slug: "baby-hub", name: "Baby Hub",
    tagline: "Everything for little ones",
    banner: catStroller, avatar: catStroller,
    floor: "1st", stall: "F1-15",
    hours: "Mon–Sun · 10:00 – 21:00", openNow: true,
    rating: 4.7, reviews: 198, deliveryMins: 40, riderFee: 1800, minOrder: 5000,
    categories: ["babies-kids"],
    productSlugs: ["comfort-plus-baby-stroller"],
    tier: "Standard", verified: true, map: { x: 48, y: 78 },
  },
  {
    id: "v-petsworld", slug: "pets-world", name: "Pets World",
    tagline: "Pet shop & vet on the 2nd floor",
    banner: catPuppy, avatar: catPuppy,
    floor: "2nd", stall: "F2-18",
    hours: "Mon–Sat · 10:00 – 19:00", openNow: true,
    rating: 4.8, reviews: 310, deliveryMins: 60, riderFee: 2500, minOrder: 5000,
    categories: ["pets"],
    productSlugs: ["golden-retriever-puppy"],
    tier: "Standard", verified: true, map: { x: 80, y: 40 },
  },
  {
    id: "v-motorking", slug: "motorking-autos", name: "MotorKing Autos",
    tagline: "Auto showroom · test-drive in the basement",
    banner: catCar, avatar: catCar,
    floor: "Basement", stall: "B-01",
    hours: "Mon–Sat · 9:00 – 18:00", openNow: true,
    rating: 4.7, reviews: 412, deliveryMins: 240, riderFee: 0, minOrder: 0,
    categories: ["vehicles"],
    productSlugs: ["executive-sedan-2024"],
    tier: "Anchor", verified: true, map: { x: 90, y: 85 },
  },
  {
    id: "v-prime", slug: "prime-estate", name: "Prime Estate Realty",
    tagline: "Property concierge · in-mall office",
    banner: catApt, avatar: catApt,
    floor: "3rd", stall: "F3-02",
    hours: "Mon–Fri · 9:00 – 17:00", openNow: false,
    rating: 4.8, reviews: 220, deliveryMins: 0, riderFee: 0, minOrder: 0,
    categories: ["property"],
    productSlugs: ["luxury-2bed-apartment-lekki"],
    tier: "Premium", verified: true, map: { x: 18, y: 18 },
  },
  {
    id: "v-fitness", slug: "fitnesspro", name: "FitnessPro",
    tagline: "Bikes, treadmills, sportswear",
    banner: catWatch, avatar: catWatch,
    floor: "1st", stall: "F1-30",
    hours: "Mon–Sun · 10:00 – 21:00", openNow: true,
    rating: 4.6, reviews: 290, deliveryMins: 50, riderFee: 2000, minOrder: 5000,
    categories: ["sports", "fashion"],
    productSlugs: ["city-cruiser-bike", "rose-gold-classic-watch"],
    tier: "Standard", verified: true, map: { x: 60, y: 80 },
  },
]

export const FLOORS = ["Basement", "Ground", "1st", "2nd", "3rd"] as const

export function getVendor(slug: string) {
  return vendors.find((v) => v.slug === slug)
}

export function vendorsForCategory(slug?: string) {
  if (!slug || slug === "all") return vendors
  return vendors.filter((v) => v.categories.includes(slug))
}

export function tierRank(t: Vendor["tier"]) {
  return t === "Anchor" ? 0 : t === "Premium" ? 1 : 2
}

export const sortedByProminence = [...vendors].sort(
  (a, b) => tierRank(a.tier) - tierRank(b.tier) || b.rating - a.rating,
)
