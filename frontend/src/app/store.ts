import { configureStore } from '@reduxjs/toolkit';
import productReducer from '../features/products/productSlice'; // Importar el reducer de productos
import cartReducer from '../features/cart/cartSlice'; // Importar el reducer del carrito
import authReducer from '../features/auth/authSlice';   // Importar el reducer de autenticación

export const store = configureStore({
  reducer: {
    product: productReducer, // Añadir el reducer de productos
    cart: cartReducer, // Añadir el reducer del carrito
    auth: authReducer,   // Añadir el reducer de autenticación
    // Add other reducers here as needed
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;