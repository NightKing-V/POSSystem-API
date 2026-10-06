export interface CategoryTemplateNode {
  name: string;
  children?: CategoryTemplateNode[];
}

export interface BusinessCategorySeedBlueprint {
  type: string;
  defaultCategories: CategoryTemplateNode[];
}

export const BUSINESS_CATEGORIES_SEED: BusinessCategorySeedBlueprint[] = [
  {
    type: 'RETAIL',
    defaultCategories: [
      {
        name: 'General Merchandise',
        children: [
          { name: 'Stationery & Office' },
          { name: 'Household Essentials' },
          { name: 'Personal Care' },
        ],
      },
      {
        name: 'Food & Beverages',
        children: [
          { name: 'Snacks & Confectionery' },
          { name: 'Beverages' },
        ],
      },
      {
        name: 'Accessories & Gifts',
      },
    ],
  },
  {
    type: 'RESTAURANT',
    defaultCategories: [
      {
        name: 'Starters & Appetizers',
        children: [{ name: 'Soups & Salads' }, { name: 'Finger Foods' }],
      },
      {
        name: 'Main Courses',
        children: [
          { name: 'Rice & Noodles' },
          { name: 'Grills & Entrees' },
          { name: 'Burgers & Sandwiches' },
        ],
      },
      {
        name: 'Beverages',
        children: [
          { name: 'Hot Beverages' },
          { name: 'Cold Drinks & Juices' },
        ],
      },
      {
        name: 'Desserts & Bakery',
      },
    ],
  },
  {
    type: 'SUPERMARKET',
    defaultCategories: [
      {
        name: 'Fresh Produce',
        children: [
          { name: 'Fruits' },
          { name: 'Vegetables' },
          { name: 'Herbs' },
        ],
      },
      {
        name: 'Dairy, Eggs & Chilled',
        children: [
          { name: 'Milk & Cream' },
          { name: 'Cheese & Butter' },
          { name: 'Eggs' },
        ],
      },
      {
        name: 'Pantry & Dry Goods',
        children: [
          { name: 'Rice, Pasta & Pulses' },
          { name: 'Canned & Jarred Food' },
          { name: 'Spices & Condiments' },
        ],
      },
      {
        name: 'Household & Cleaning',
        children: [{ name: 'Laundry' }, { name: 'Kitchen Cleaners' }],
      },
    ],
  },
  {
    type: 'PHARMACY',
    defaultCategories: [
      {
        name: 'Prescription Medicines',
        children: [
          { name: 'Antibiotics' },
          { name: 'Cardiovascular' },
          { name: 'Diabetes Care' },
        ],
      },
      {
        name: 'Over-the-Counter (OTC)',
        children: [
          { name: 'Pain Relief' },
          { name: 'Cold, Cough & Allergy' },
          { name: 'Digestive Health' },
        ],
      },
      {
        name: 'Vitamins & Supplements',
      },
      {
        name: 'First Aid & Medical Supplies',
      },
    ],
  },
  {
    type: 'ELECTRONICS',
    defaultCategories: [
      {
        name: 'Computers & Tablets',
        children: [
          { name: 'Laptops & Desktops' },
          { name: 'Peripherals & Accessories' },
          { name: 'Storage & Networking' },
        ],
      },
      {
        name: 'Mobile & Wearables',
        children: [
          { name: 'Smartphones' },
          { name: 'Cases, Chargers & Cables' },
          { name: 'Smartwatches & Audio' },
        ],
      },
      {
        name: 'Home Appliances',
      },
    ],
  },
  {
    type: 'APPAREL',
    defaultCategories: [
      {
        name: 'Menswear',
        children: [{ name: 'Shirts & Tops' }, { name: 'Trousers & Jeans' }],
      },
      {
        name: 'Womenswear',
        children: [{ name: 'Dresses & Tops' }, { name: 'Bottoms & Skirts' }],
      },
      {
        name: 'Footwear & Accessories',
        children: [{ name: 'Shoes & Sandals' }, { name: 'Bags & Belts' }],
      },
    ],
  },
  {
    type: 'SERVICES',
    defaultCategories: [
      {
        name: 'Consultations & Packages',
      },
      {
        name: 'Maintenance & Repairs',
      },
      {
        name: 'Service Add-ons & Consumables',
      },
    ],
  },
];
