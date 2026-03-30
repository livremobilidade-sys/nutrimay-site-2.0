export interface CheckoutItem {
  id: string | number;
  name: string;
  quantity: number;
  price: number;
}

export interface CheckoutCustomer {
  name: string;
  email: string;
  cpf: string;
  phone?: string;
}

/**
 * Remove caracteres não numéricos do CPF.
 */
export const cleanCpf = (cpf: string): string => cpf.replace(/\D/g, "");

/**
 * Formata telefone para o padrão esperado pelo PagBank.
 * Retorna undefined se o número for inválido.
 */
export const formatPhone = (phone?: string) => {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return undefined;
  return {
    country: "55",
    area: digits.substring(0, 2),
    number: digits.substring(2),
  };
};

/**
 * Validação básica do payload de checkout.
 * Lança Error com mensagem amigável caso algo esteja errado.
 */
export const validateCheckoutPayload = (
  items: CheckoutItem[],
  customer?: CheckoutCustomer
) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("É necessário informar ao menos um item no carrinho.");
  }

  items.forEach((i) => {
    if (!i.id) throw new Error("Item sem 'id' encontrado.");
    if (!i.name) throw new Error("Item sem 'name' encontrado.");
    if (i.quantity <= 0) throw new Error(`Quantidade inválida para o item ${i.name}.`);
    if (i.price <= 0) throw new Error(`Preço inválido para o item ${i.name}.`);
  });

  if (customer) {
    if (!customer.email) throw new Error("E‑mail do cliente é obrigatório.");
    if (!customer.cpf) throw new Error("CPF do cliente é obrigatório.");
  }
};
