import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  benefits: string[];
  color?: string;
  tag?: string;
  title?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Customer {
  name: string;
  email: string;
  cpf: string;
  phone: string;
}

interface CartStore {
  items: CartItem[];
  pickupPoint: string | null;
  thermalBagOption: "new" | "exchange" | null;
  customer: Customer | null;
  addItem: (item: Product) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setPickupPoint: (point: string) => void;
  setThermalBagOption: (option: "new" | "exchange") => void;
  setCustomer: (customer: Customer) => void;
  clearCart: () => void;
  restoreFromOrder: (items: any[], pickupPoint?: string, thermalBagOption?: "new" | "exchange") => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}


export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      pickupPoint: null,
      thermalBagOption: null,
      customer: null,
      isCartOpen: false,
      addItem: (product) =>
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
              isCartOpen: true, // open cart when adding item
            };
          }
          return { items: [...state.items, { ...product, quantity: 1 }], isCartOpen: true };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        })),
      setPickupPoint: (point) => set({ pickupPoint: point }),
      setThermalBagOption: (option) => set({ thermalBagOption: option }),
      setCustomer: (customer) => set({ customer: customer }),
      clearCart: () => set({ items: [], pickupPoint: null, thermalBagOption: null, customer: null }),
      restoreFromOrder: (items, pickupPoint, thermalBagOption) => set({ 
        items: items.map((item: any) => ({
          id: item.id || item.name?.toLowerCase().replace(/\s+/g, '-'),
          name: item.name,
          description: '',
          price: (item.unitAmount || 0) / 100,
          image: '',
          benefits: [],
          quantity: item.quantity,
        })),
        pickupPoint: pickupPoint || null,
        thermalBagOption: thermalBagOption || null,
      }),
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

    }),
    {
      name: "nutrimay-cart",
    }
  )
);

// Business Logic Helper
export const checkIsCartClosed = () => {
  // Now returning false because the user wants the shop to be always open.
  // The 'Next Batch' message will be handled by the UI based on the cutoff.
  return false; 
};

export const getBatchStatus = () => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  // Cutoff is Tuesday (2) at 20:00
  const isPastCutoff = (day === 2 && hour >= 20) || day === 3 || day > 3 || day === 0 || day === 1;
  // Actually, if it's Monday or Tuesday before 20h, it's 'Current Batch' (Delivery this Wed).
  // If it's Tuesday after 20h or Wednesday, it's 'Next Batch' (Delivery next Wed).

  // Simpler: Is it between Wednesday 00:00 and Tuesday 19:59? 
  // Wait, if it's Monday, you get it this Wed.
  // If it's Tuesday 10am, you get it this Wed.
  // If it's Tuesday 9pm, you get it NEXT Wed.
  // If it's Wednesday, you get it NEXT Wed.
  
  const isCurrentBatch = (day === 4 || day === 5 || day === 6 || day === 0 || day === 1 || (day === 2 && hour < 20));
  // Wait, if delivery is Wednesday, then:
  // - Orders from Thursday to Tuesday 20h -> Deliver this/coming Wednesday.
  // - Orders from Tuesday 20h to Wednesday 23:59 -> Deliver NEXT Wednesday.

  return {
    isNextBatch: !isCurrentBatch,
    deliveryDate: isCurrentBatch ? "esta Quarta" : "próxima Quarta"
  };
};
