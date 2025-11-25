import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Product {
  id: string;
  title: string;
  image: string;
  brand: string;
  categories: string[];
  price: number;
  currency: string;
  popularity: number;
  stock: number;
}

interface ProductState {
  products: Product[];
  totalProducts: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  products: [],
  totalProducts: 0,
  isLoading: false,
  error: null,
};

export const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setProducts: (state, action: PayloadAction<{ products: Product[], totalProducts: number }>) => {
      state.products = action.payload.products;
      state.totalProducts = action.payload.totalProducts;
      state.isLoading = false;
      state.error = null;
    },
    addProducts: (state, action: PayloadAction<{ products: Product[], totalProducts: number }>) => {
        state.products = [...state.products, ...action.payload.products];
        state.totalProducts = action.payload.totalProducts;
        state.isLoading = false;
        state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { setProducts, addProducts, setLoading, setError } = productSlice.actions;

export default productSlice.reducer;
