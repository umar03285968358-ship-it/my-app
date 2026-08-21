export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  subcategory: string;
  rating: number;
  reviews: number;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  emoji: string;
}

export const categories: Category[] = [
  { id: "cakes", name: "Cakes", emoji: "🎂" },
  { id: "cupcakes", name: "Cupcakes", emoji: "🧁" },
  { id: "bread", name: "Bread", emoji: "🍞" },
  { id: "cookies", name: "Cookies", emoji: "🍪" },
  { id: "pastries", name: "Pastries", emoji: "🥐" },
];

export const subcategories: Subcategory[] = [
  // Cakes
  {
    id: "cakes-chocolate",
    name: "Chocolate Cakes",
    categoryId: "cakes",
    emoji: "🍫",
  },
  { id: "cakes-fruit", name: "Fruit Cakes", categoryId: "cakes", emoji: "🍓" },
  {
    id: "cakes-classic",
    name: "Classic Cakes",
    categoryId: "cakes",
    emoji: "🎂",
  },

  // Cupcakes
  {
    id: "cupcakes-chocolate",
    name: "Chocolate Cupcakes",
    categoryId: "cupcakes",
    emoji: "🍫",
  },
  {
    id: "cupcakes-fruit",
    name: "Fruit Cupcakes",
    categoryId: "cupcakes",
    emoji: "🫐",
  },
  {
    id: "cupcakes-classic",
    name: "Classic Cupcakes",
    categoryId: "cupcakes",
    emoji: "🧁",
  },

  // Bread
  {
    id: "bread-savory",
    name: "Savory Bread",
    categoryId: "bread",
    emoji: "🧄",
  },
  {
    id: "bread-artisan",
    name: "Artisan Bread",
    categoryId: "bread",
    emoji: "🍞",
  },
  {
    id: "bread-wholegrain",
    name: "Whole Grain",
    categoryId: "bread",
    emoji: "🌾",
  },

  // Cookies
  {
    id: "cookies-chocolate",
    name: "Chocolate Cookies",
    categoryId: "cookies",
    emoji: "🍪",
  },
  {
    id: "cookies-classic",
    name: "Classic Cookies",
    categoryId: "cookies",
    emoji: "🥛",
  },

  // Pastries
  {
    id: "pastries-croissant",
    name: "Croissants",
    categoryId: "pastries",
    emoji: "🥐",
  },
  {
    id: "pastries-danish",
    name: "Danish",
    categoryId: "pastries",
    emoji: "🍥",
  },
];

export const products: Product[] = [
  // Cakes
  {
    id: "p1",
    name: "Chocolate Truffle Cake",
    price: 25.99,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500",
    category: "cakes",
    subcategory: "cakes-chocolate",
    rating: 4.8,
    reviews: 124,
    description:
      "Rich chocolate sponge with layers of chocolate cream and dark chocolate ganache.",
  },
  {
    id: "p2",
    name: "Red Velvet Cake",
    price: 24.99,
    image: "https://images.unsplash.com/photo-1586985289906-406988974504?w=500",
    category: "cakes",
    subcategory: "cakes-classic",
    rating: 4.7,
    reviews: 98,
    description: "Classic red velvet with smooth cream cheese frosting.",
  },
  {
    id: "p3",
    name: "Black Forest Cake",
    price: 26.99,
    image:
      "https://i.pinimg.com/1200x/7c/e5/c0/7ce5c0cf8df035e6126d57b4e271dbac.jpg",
    category: "cakes",
    subcategory: "cakes-chocolate",
    rating: 4.6,
    reviews: 87,
    description: "Chocolate sponge, cherries, and whipped cream.",
  },
  {
    id: "p4",
    name: "Butterscotch Cake",
    price: 25.99,
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500",
    category: "cakes",
    subcategory: "cakes-classic",
    rating: 4.5,
    reviews: 76,
    description: "Caramelized butterscotch flavor with crunchy praline.",
  },
  {
    id: "p5",
    name: "Blueberry Cake",
    price: 23.99,
    image: "https://images.unsplash.com/photo-1587248720327-8eb72564be1e?w=500",
    category: "cakes",
    subcategory: "cakes-fruit",
    rating: 4.6,
    reviews: 65,
    description: "Light sponge cake loaded with fresh blueberries.",
  },
  {
    id: "p6",
    name: "Mango Cake",
    price: 24.99,
    image: "https://images.unsplash.com/photo-1519869325930-281384150729?w=500",
    category: "cakes",
    subcategory: "cakes-fruit",
    rating: 4.7,
    reviews: 71,
    description: "Fresh mango puree layered with vanilla sponge.",
  },
  {
    id: "p10",
    name: "Vanilla Bean Cake",
    price: 22.99,
    image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500",
    category: "cakes",
    subcategory: "cakes-classic",
    rating: 4.4,
    reviews: 52,
    description: "Classic vanilla sponge with silky buttercream.",
  },
  {
    id: "p11",
    name: "Strawberry Shortcake",
    price: 23.49,
    image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500",
    category: "cakes",
    subcategory: "cakes-fruit",
    rating: 4.6,
    reviews: 60,
    description: "Layers of sponge, cream, and fresh strawberries.",
  },

  // Cupcakes
  {
    id: "p7",
    name: "Blueberry Cupcake",
    price: 3.99,
    image: "https://images.unsplash.com/photo-1587668178277-295251f900ce?w=500",
    category: "cupcakes",
    subcategory: "cupcakes-fruit",
    rating: 4.5,
    reviews: 40,
    description: "Soft cupcake topped with blueberry buttercream.",
  },
  {
    id: "p8",
    name: "Chocolate Cupcake",
    price: 3.49,
    image: "https://images.unsplash.com/photo-1519869325930-281384150729?w=500",
    category: "cupcakes",
    subcategory: "cupcakes-chocolate",
    rating: 4.6,
    reviews: 55,
    description: "Rich chocolate cupcake with fudge frosting.",
  },
  {
    id: "p12",
    name: "Vanilla Cupcake",
    price: 3.29,
    image: "https://images.unsplash.com/photo-1587668178277-295251f900ce?w=500",
    category: "cupcakes",
    subcategory: "cupcakes-classic",
    rating: 4.4,
    reviews: 38,
    description: "Classic vanilla cupcake with sprinkles.",
  },
  {
    id: "p13",
    name: "Red Velvet Cupcake",
    price: 3.79,
    image: "https://images.unsplash.com/photo-1586985289906-406988974504?w=500",
    category: "cupcakes",
    subcategory: "cupcakes-classic",
    rating: 4.7,
    reviews: 47,
    description: "Mini red velvet with cream cheese swirl.",
  },

  // Bread
  {
    id: "p9",
    name: "Garlic Bread",
    price: 4.49,
    image: "https://images.unsplash.com/photo-1573140401552-3fab0b24427f?w=500",
    category: "bread",
    subcategory: "bread-savory",
    rating: 4.4,
    reviews: 30,
    description: "Freshly baked bread with garlic herb butter.",
  },
  {
    id: "p14",
    name: "Sourdough Loaf",
    price: 5.99,
    image: "https://images.unsplash.com/photo-1585478259715-4d3a5e0d0e6b?w=500",
    category: "bread",
    subcategory: "bread-artisan",
    rating: 4.6,
    reviews: 44,
    description: "Naturally leavened sourdough, crusty outside, soft inside.",
  },
  {
    id: "p15",
    name: "Whole Wheat Bread",
    price: 4.29,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500",
    category: "bread",
    subcategory: "bread-wholegrain",
    rating: 4.3,
    reviews: 22,
    description: "Healthy whole wheat loaf, freshly baked daily.",
  },

  // Cookies
  {
    id: "p16",
    name: "Chocolate Chip Cookies",
    price: 5.49,
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500",
    category: "cookies",
    subcategory: "cookies-chocolate",
    rating: 4.8,
    reviews: 90,
    description: "Classic chewy cookies loaded with chocolate chips.",
  },
  {
    id: "p17",
    name: "Oatmeal Raisin Cookies",
    price: 5.29,
    image: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=500",
    category: "cookies",
    subcategory: "cookies-classic",
    rating: 4.4,
    reviews: 41,
    description: "Soft oatmeal cookies with raisins and cinnamon.",
  },
  {
    id: "p18",
    name: "Double Chocolate Cookies",
    price: 5.99,
    image: "https://images.unsplash.com/photo-1584707824287-2f4a05ba0e33?w=500",
    category: "cookies",
    subcategory: "cookies-chocolate",
    rating: 4.7,
    reviews: 58,
    description: "Rich cocoa cookies with dark chocolate chunks.",
  },

  // Pastries
  {
    id: "p19",
    name: "Butter Croissant",
    price: 3.99,
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500",
    category: "pastries",
    subcategory: "pastries-croissant",
    rating: 4.6,
    reviews: 63,
    description: "Flaky, buttery croissant baked fresh every morning.",
  },
  {
    id: "p20",
    name: "Danish Pastry",
    price: 4.29,
    image: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=500",
    category: "pastries",
    subcategory: "pastries-danish",
    rating: 4.5,
    reviews: 34,
    description: "Sweet Danish pastry with fruit filling.",
  },
];

export const getProductById = (id: string) => products.find((p) => p.id === id);

export const getProductsByCategory = (categoryId: string) =>
  products.filter((p) => p.category === categoryId);

export const getCategoryProductCount = (categoryId: string) =>
  getProductsByCategory(categoryId).length;

export const getSubcategoriesByCategory = (categoryId: string) =>
  subcategories.filter((s) => s.categoryId === categoryId);

export const getSubcategoryById = (id: string) =>
  subcategories.find((s) => s.id === id);

export const getProductsBySubcategory = (subcategoryId: string) =>
  products.filter((p) => p.subcategory === subcategoryId);

export const getSubcategoryProductCount = (subcategoryId: string) =>
  getProductsBySubcategory(subcategoryId).length;

// First product's image is used as a representative thumbnail for a subcategory card
export const getSubcategoryThumbnail = (subcategoryId: string) => {
  const list = getProductsBySubcategory(subcategoryId);
  return list[0]?.image ?? "";
};
