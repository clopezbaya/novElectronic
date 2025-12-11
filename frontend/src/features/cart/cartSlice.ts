import { createSlice, type PayloadAction, nanoid } from '@reduxjs/toolkit';

interface CartItem {
  id: string;
  productId: string; // Original product ID
  title: string;
  category: string;
  image: string;
  price: number;
  currency: string;
  quantity: number;
}

interface CartState {
  cartItems: CartItem[];
  numItemsInCart: number;
  cartTotal: number;
}

const initialState: CartState = {
  cartItems: [],
  numItemsInCart: 0,
  cartTotal: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<CartItem, 'id'>>) => {
      const { productId, quantity } = action.payload;
      const item = state.cartItems.find((i) => i.productId === productId);

      if (item) {
        item.quantity += quantity;
      } else {
        const newItem = { ...action.payload, id: nanoid() };
        state.cartItems.push(newItem);
      }
      cartSlice.caseReducers.calculateTotals(state);
    },
    removeItem: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      state.cartItems = state.cartItems.filter((item) => item.id !== productId);
      cartSlice.caseReducers.calculateTotals(state);
    },
    editItem: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const { id, quantity } = action.payload;
      const item = state.cartItems.find((i) => i.id === id);

      if (item) {
        item.quantity = quantity;
      }
      cartSlice.caseReducers.calculateTotals(state);
    },
    calculateTotals: (state) => {
      let numItemsInCart = 0;
      let cartTotal = 0;

      state.cartItems.forEach((item) => {
        numItemsInCart += item.quantity;
        cartTotal += item.price * item.quantity;
      });
      state.numItemsInCart = numItemsInCart;
      state.cartTotal = cartTotal;
    },
    clearCart: (state) => {
      state.cartItems = [];
      state.numItemsInCart = 0;
      state.cartTotal = 0;
    },
  },
});

export const { addItem, removeItem, editItem, clearCart } = cartSlice.actions;

export default cartSlice.reducer;
