export interface Bundle {
    _id?: string;
    bundleName?: string;
    description?: string;
    imgUrl?: string;
    giftsList?: {
        giftId?: string;
    }
}
// Define the Gift type based on your JSON
export interface Gift {
  _id: {
    $oid: string; // MongoDB ObjectId
  };
  sku: string;
  name: string;
  descShort: string;
  category: string;
  images: {
    primaryImgUrl: string;
    secondaryImgUrl: string;
  };
  price: string; // If price is always numeric, change to `number`
  rationale: string;
  confidence_score: string; // Same here, change to `number` if numeric
}

// Define the API response structure
export interface ApiResponseData {
  recommendations: Gift[]; // Array of Gift items
}

// Example Recipient type
export interface Recipient {
  mailId: string;
  linkedinUrl?: string;
}

// Recipient with an assigned gift
export interface RecipientWithGift extends Recipient {
  assignedGift: {
    id: string; // MongoDB ObjectId in string format
    price: string | number;
    name: string;
    images: {
      primaryImgUrl: string;
    };
  } | null;
}
