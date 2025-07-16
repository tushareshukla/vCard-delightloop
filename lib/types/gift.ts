export interface Gift {
  _id?: string;
  name: string;
  descShort?: string;
  images?: {
    primaryImgUrl: string;
    // Add other image properties if needed
  };
  
  price?: number;
  // Add other gift properties as needed
}
