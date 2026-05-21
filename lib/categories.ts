import {
  Smartphone,
  Car,
  Home as HomeIcon,
  Sofa,
  Shirt,
  Laptop,
  Sparkles,
  Dumbbell,
  Baby,
  PawPrint,
  Apple,
  Briefcase,
  type LucideIcon,
} from "lucide-react"

// Asset paths pointing to /public/assets/
const catCar = "/assets/cat-car.jpg"
const catApt = "/assets/cat-apartment.jpg"
const catLaptop = "/assets/cat-laptop.jpg"
const catSofa = "/assets/cat-sofa.jpg"
const catSneakers = "/assets/cat-sneakers.jpg"
const catPerfume = "/assets/cat-perfume.jpg"
const catBike = "/assets/cat-bike.jpg"
const catWatch = "/assets/cat-watch.jpg"
const catStroller = "/assets/cat-stroller.jpg"
const catPuppy = "/assets/cat-puppy.jpg"
const catVeg = "/assets/cat-veg.jpg"
const phone1 = "/assets/phone-1.jpg"

export type Subcategory = { slug: string; name: string }

export type Category = {
  slug: string
  name: string
  icon: LucideIcon
  image: string
  blurb: string
  subcategories: Subcategory[]
}

export const categories: Category[] = [
  {
    slug: "vehicles",
    name: "Vehicles",
    icon: Car,
    image: catCar,
    blurb: "Cars, motorbikes & parts",
    subcategories: [
      { slug: "cars", name: "Cars" },
      { slug: "motorbikes", name: "Motorbikes" },
      { slug: "buses", name: "Buses & Trucks" },
      { slug: "auto-parts", name: "Auto Parts" },
      { slug: "bicycles", name: "Bicycles" },
    ],
  },
  {
    slug: "property",
    name: "Property",
    icon: HomeIcon,
    image: catApt,
    blurb: "Houses, apartments & land",
    subcategories: [
      { slug: "for-rent", name: "For Rent" },
      { slug: "for-sale", name: "For Sale" },
      { slug: "shortlet", name: "Short Let" },
      { slug: "land", name: "Land & Plots" },
      { slug: "commercial", name: "Commercial" },
    ],
  },
  {
    slug: "phones-tablets",
    name: "Phones & Tablets",
    icon: Smartphone,
    image: phone1,
    blurb: "Smartphones, tablets & accessories",
    subcategories: [
      { slug: "smartphones", name: "Smartphones" },
      { slug: "tablets", name: "Tablets" },
      { slug: "accessories", name: "Accessories" },
      { slug: "smartwatches", name: "Smart Watches" },
    ],
  },
  {
    slug: "electronics",
    name: "Electronics",
    icon: Laptop,
    image: catLaptop,
    blurb: "Laptops, audio, TVs & gaming",
    subcategories: [
      { slug: "laptops", name: "Laptops & Computers" },
      { slug: "tv-audio", name: "TV & Audio" },
      { slug: "gaming", name: "Gaming" },
      { slug: "cameras", name: "Cameras" },
    ],
  },
  {
    slug: "home-garden",
    name: "Home & Garden",
    icon: Sofa,
    image: catSofa,
    blurb: "Furniture, appliances & decor",
    subcategories: [
      { slug: "furniture", name: "Furniture" },
      { slug: "appliances", name: "Appliances" },
      { slug: "kitchen", name: "Kitchen" },
      { slug: "decor", name: "Home Decor" },
    ],
  },
  {
    slug: "fashion",
    name: "Fashion",
    icon: Shirt,
    image: catSneakers,
    blurb: "Clothing, shoes & bags",
    subcategories: [
      { slug: "men", name: "Men" },
      { slug: "women", name: "Women" },
      { slug: "shoes", name: "Shoes" },
      { slug: "bags", name: "Bags" },
      { slug: "watches", name: "Watches" },
    ],
  },
  {
    slug: "beauty",
    name: "Health & Beauty",
    icon: Sparkles,
    image: catPerfume,
    blurb: "Skincare, makeup & wellness",
    subcategories: [
      { slug: "skincare", name: "Skincare" },
      { slug: "makeup", name: "Makeup" },
      { slug: "fragrance", name: "Fragrance" },
      { slug: "wellness", name: "Wellness" },
    ],
  },
  {
    slug: "sports",
    name: "Sports & Outdoors",
    icon: Dumbbell,
    image: catBike,
    blurb: "Fitness, bikes & gear",
    subcategories: [
      { slug: "fitness", name: "Fitness" },
      { slug: "cycling", name: "Cycling" },
      { slug: "outdoor", name: "Outdoor" },
      { slug: "team-sports", name: "Team Sports" },
    ],
  },
  {
    slug: "babies-kids",
    name: "Babies & Kids",
    icon: Baby,
    image: catStroller,
    blurb: "Baby gear, toys & clothes",
    subcategories: [
      { slug: "strollers", name: "Strollers & Car Seats" },
      { slug: "toys", name: "Toys" },
      { slug: "kids-clothing", name: "Kids Clothing" },
      { slug: "feeding", name: "Feeding" },
    ],
  },
  {
    slug: "pets",
    name: "Pets",
    icon: PawPrint,
    image: catPuppy,
    blurb: "Pets, food & accessories",
    subcategories: [
      { slug: "dogs", name: "Dogs" },
      { slug: "cats", name: "Cats" },
      { slug: "birds", name: "Birds" },
      { slug: "pet-food", name: "Pet Food" },
    ],
  },
  {
    slug: "food",
    name: "Food & Agriculture",
    icon: Apple,
    image: catVeg,
    blurb: "Fresh produce & farm goods",
    subcategories: [
      { slug: "fresh-produce", name: "Fresh Produce" },
      { slug: "groceries", name: "Groceries" },
      { slug: "farm-equipment", name: "Farm Equipment" },
      { slug: "livestock", name: "Livestock" },
    ],
  },
  {
    slug: "services",
    name: "Services & Jobs",
    icon: Briefcase,
    image: catWatch,
    blurb: "Hire pros & find work",
    subcategories: [
      { slug: "jobs", name: "Jobs" },
      { slug: "cleaning", name: "Cleaning" },
      { slug: "repairs", name: "Repairs" },
      { slug: "events", name: "Events" },
    ],
  },
]

export function getCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug)
}
