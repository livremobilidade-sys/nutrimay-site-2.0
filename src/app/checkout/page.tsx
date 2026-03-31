"use client";

import { useCartStore } from "@/store/useCartStore";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, CreditCard, QrCode, ClipboardCheck, CheckCircle2, AlertCircle, ShieldCheck, Lock as LockIcon, ArrowRight, Check, Edit2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

declare global {
  interface Window {
    PagSeguro: {
      encryptCard: (params: {
        publicKey: string;
        holder: string;
        number: string;
        expMonth: string;
        expYear: string;
        securityCode: string;
      }) => {
        encryptedCard: string;
        hasErrors: boolean;
        errors: Array<{ code: string; message: string }>;
      };
    };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "pix" | "boleto">("credit_card");
  const [pixData, setPixData] = useState<{ qrcode: string, text: string } | null>(null);
  const [successData, setSuccessData] = useState<{ orderId: string, message: string } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [installments, setInstallments] = useState<{ quantity: number; amount: number }[]>([]);
  const [selectedInstallment, setSelectedInstallment] = useState(1);
  const scriptLoaded = useRef(false);

  const {
    items,
    pickupPoint,
    thermalBagOption,
    customer,
    setCustomer,
    clearCart,
  } = useCartStore();

  const [formData, setFormData] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    cpf: customer?.cpf || "",
    phone: customer?.phone || "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    city: "",
    state: "",
    cardNumber: "",
    cardExpiry: "",
    cardCVV: ""
  });

  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [editPersonal, setEditPersonal] = useState(true);
  const [cardHolderName, setCardHolderName] = useState("");

  useEffect(() => {
    console.log('MORANGO - CPF correto: 33813392813');
    setMounted(true);

    const loadPagBankScript = async () => {
      if (scriptLoaded.current) return;
      
      const envValue = process.env.NEXT_PUBLIC_PAGBANK_ENV || 'sandbox';
      const isProduction = envValue === 'production';
      
      const scriptSrc = isProduction
        ? 'https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js'
        : 'https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js';

      const script = document.createElement('script');
      script.src = scriptSrc;
      script.async = true;
      script.onload = () => {
        scriptLoaded.current = true;
        console.log('SDK PagBank carregado');
      };
      script.onerror = () => {
        console.error('Falha ao carregar SDK PagBank');
      };
      document.body.appendChild(script);
    };

    loadPagBankScript();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setFormData(prev => {
              const newData = {
                ...prev,
                name: prev.name || user.displayName || data.name || "",
                email: prev.email || user.email || data.email || "",
                cpf: prev.cpf || data.cpf || "",
                phone: prev.phone || data.phone || "",
                cep: prev.cep || data.cep || "",
                street: prev.street || data.street || "",
                number: prev.number || data.number || "",
                city: prev.city || data.city || "",
                state: prev.state || data.state || ""
              };
              
              if (newData.name && newData.email && newData.cpf && newData.phone) {
                setEditPersonal(false);
              }
              
              return newData;
            });
          } else if (user.email) {
             setFormData(prev => ({
               ...prev,
               name: prev.name || user.displayName || "",
               email: prev.email || user.email || ""
             }));
          }
        } catch (e) {
             console.error("Error fetching user", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const finalTotal = thermalBagOption === "new" ? subtotal + 10 : subtotal;

  if (!mounted) return <div className="min-h-screen bg-black" />;

  // --- HELPERS & MASKS ---
  const maskCPF = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const maskPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length === 11) return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    if (v.length === 10) return v.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    return v;
  };

  const maskCEP = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 8) v = v.slice(0, 8);
    return v.replace(/(\d{5})(\d{3})/, "$1-$2");
  };

  const validateCPF = (cpf: string) => {
    cpf = cpf.replace(/\D/g, "");
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    let sum = 0, rest;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if ((rest === 10) || (rest === 11)) rest = 0;
    if (rest !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if ((rest === 10) || (rest === 11)) rest = 0;
    if (rest !== parseInt(cpf.substring(10, 11))) return false;
    return true;
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const maskCardNumber = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 16) v = v.slice(0, 16);
    return v.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, "$1 $2 $3 $4").trim();
  };

  const maskExpiry = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 4) v = v.slice(0, 4);
    return v.replace(/(\d{2})(\d{2})/, "$1/$2");
  };

  const getCardBrand = (num: string) => {
    const cleanNum = num.replace(/\D/g, "");
    if (/^4/.test(cleanNum)) return "visa";
    if (/^5[1-5]/.test(cleanNum) || /^2[2-7]/.test(cleanNum)) return "mastercard";
    if (/^3[47]/.test(cleanNum)) return "amex";
    if (/^(4011|4312|4389|4514|4573|4576|5041|5066|5067|509|627|633|637)/.test(cleanNum)) return "elo";
    if (/^6062/.test(cleanNum)) return "hipercard";
    return null;
  };

  // --- HANDLERS ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let maskedValue = value;

    if (name === "cpf") maskedValue = maskCPF(value);
    if (name === "phone") maskedValue = maskPhone(value);
    if (name === "cep") {
      maskedValue = maskCEP(value);
      if (value.replace(/\D/g, "").length === 8) {
        handleCEPChange(value.replace(/\D/g, ""));
      }
    }
    
    if (name === "cardNumber") {
      handleCardNumberChange(value);
    }
    if (name === "cardExpiry") maskedValue = maskExpiry(value);
    if (name === "cardCVV") {
      maskedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    setFormData(prev => ({ ...prev, [name]: maskedValue }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[name];
        return newErrs;
      });
    }
  };

  const handleCEPChange = async (cep: string) => {
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) throw new Error("CEP não encontrado");
      
      setFormData(prev => ({
        ...prev,
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf
      }));
    } catch (err) {
      console.error("CEP error:", err);
    }
  };

  const encryptCard = (cardNumber: string, cvv: string, expiry: string, holderName: string): string => {
    if (!window.PagSeguro) {
      throw new Error('SDK PagBank não carregado');
    }
    
    const [month, year] = expiry.split('/');
    const publicKey = process.env.NEXT_PUBLIC_PAGBANK_PUBLIC_KEY || '';
    
    const result = window.PagSeguro.encryptCard({
      publicKey,
      holder: holderName,
      number: cardNumber.replace(/\s/g, ''),
      expMonth: month,
      expYear: '20' + year,
      securityCode: cvv,
    });
    
    if (result.hasErrors) {
      const errorMessages = result.errors.map(e => e.message).join(', ');
      throw new Error(errorMessages || 'Erro ao criptografar cartão');
    }
    
    return result.encryptedCard;
  };

  const handleCardNumberChange = (value: string) => {
    const maskedValue = maskCardNumber(value);
    const newBrand = getCardBrand(maskedValue);
    if (newBrand !== cardBrand) {
      setCardBrand(newBrand);
      setLogoError(false);
    }
    setFormData(prev => ({ ...prev, cardNumber: maskedValue }));
    
    if (errors.cardNumber) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs.cardNumber;
        return newErrs;
      });
    }
  };

  const handleFinish = async () => {
    try {
      setApiError(null);
      const newErrors: Record<string, string> = {};

      if (!formData.name) newErrors.name = "Nome é obrigatório";
      if (!validateEmail(formData.email)) newErrors.email = "E-mail inválido";
      if (!validateCPF(formData.cpf)) newErrors.cpf = "CPF inválido";
      if (formData.phone.replace(/\D/g, "").length < 10) newErrors.phone = "Telefone incompleto";

      if (paymentMethod === 'credit_card') {
        if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 16) {
          newErrors.cardNumber = "Número do cartão inválido";
        }
        if (!formData.cardExpiry || formData.cardExpiry.length < 5) {
          newErrors.cardExpiry = "Data de validade inválida";
        }
        if (!formData.cardCVV || formData.cardCVV.length < 3) {
          newErrors.cardCVV = "CVV inválido";
        }
        if (!cardHolderName) newErrors.cardHolderName = "Nome do titular é obrigatório";
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        throw new Error("Por favor, corrija os erros no formulário.");
      }

      setIsProcessing(true);
      setIsLoadingPayment(true);

      setCustomer({
        name: formData.name,
        email: formData.email,
        cpf: formData.cpf,
        phone: formData.phone
      });

      let encryptedCard: string | undefined;
      let cardBrandFinal = cardBrand;

      if (paymentMethod === 'credit_card') {
        const brand = getCardBrand(formData.cardNumber);
        cardBrandFinal = brand;
        
        const [month, year] = formData.cardExpiry.split('/');
        
        const pkRes = await fetch('/api/pagbank/public-key');
        const pkData = await pkRes.json();
        const publicKey = pkData.publicKey;
        
        console.log('MORANGO - Public key exists:', !!publicKey);
        console.log('MORANGO - Public key length:', publicKey?.length);
        
        if (!publicKey) {
          throw new Error('Chave pública não configurada. Contate o administrador.');
        }
        
        console.log('MORANGO - Encrypting card with publicKey...');
        
        const result = window.PagSeguro.encryptCard({
          publicKey,
          holder: cardHolderName,
          number: formData.cardNumber.replace(/\s/g, ''),
          expMonth: month,
          expYear: '20' + year,
          securityCode: formData.cardCVV,
        });
        
        if (result.hasErrors) {
          const errorMessages = result.errors.map(e => e.message).join(', ');
          throw new Error(errorMessages || 'Erro ao criptografar cartão');
        }
        
        encryptedCard = result.encryptedCard;
      }

      const res = await fetch('/api/pagbank/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customer: formData,
          pickupPoint,
          thermalBagOption,
          paymentMethod,
          encryptedCard,
          cardBrand: cardBrandFinal,
          installments: selectedInstallment,
          cardHolderName,
        })
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      if (paymentMethod === 'pix' && data.pix) {
        setPixData({
          qrcode: data.pix.qrcode,
          text: data.pix.text,
        });
      } else if (paymentMethod === 'credit_card') {
        if (data.status === 'PAID' || data.status === 'AUTHORIZED') {
          setSuccessData({
            orderId: data.orderId,
            message: 'Pagamento aprovado! Obrigado pela compra.',
          });
          setTimeout(() => {
            clearCart();
            router.push('/pedido/sucesso');
          }, 2000);
        } else {
          throw new Error(`Pagamento em análise. Status: ${data.status}`);
        }
      }

    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setIsProcessing(false);
      setIsLoadingPayment(false);
    }
  };

  // If basket is empty, redirect back
  if (mounted && items.length === 0 && !successData && !pixData) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Sua meta está vazia</h1>
        <p className="text-neutral-400 mb-8">Parece que você ainda não escolheu seus produtos.</p>
        <Link href="/produtos" className="bg-[#22C55E] text-black px-8 py-4 rounded-2xl font-bold uppercase tracking-tight hover:scale-105 transition-transform">
          Ver Produtos
        </Link>
      </div>
    );
  }

  // --- RENDERING VIEWS ---

  if (successData) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-[#22C55E] rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-[#22C55E]/20">
          <CheckCircle2 className="w-12 h-12 text-black" />
        </div>
        <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">Pedido Aprovado!</h1>
        <p className="text-neutral-400 text-lg mb-8 font-medium">{successData.message}</p>
        <p className="text-neutral-500 text-sm">Redirecionando para a confirmação...</p>
      </div>
    );
  }

  if (pixData) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 lg:p-12 animate-in fade-in slide-in-from-bottom-5 duration-500">
        <div className="max-w-md w-full bg-[#1a1a1c] border border-white/5 rounded-3xl p-8 text-center shadow-2xl">
          <QrCode className="w-16 h-16 text-[#22C55E] mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Finalize seu PIX</h2>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            Escaneie o código abaixo com o app do seu banco ou utilize o "PIX Copia e Cola".
          </p>
          
          <div className="bg-white p-4 rounded-2xl mb-8 flex justify-center shadow-inner">
             <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixData.text)}`} alt="PIX QR" className="w-full max-w-[200px]" />
          </div>

          <button 
            onClick={() => {
              navigator.clipboard.writeText(pixData.text);
              alert("Código PIX copiado!");
            }}
            className="w-full py-4 rounded-xl bg-white/5 text-white font-bold border border-white/10 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
          >
            <ClipboardCheck className="w-5 h-5" />
            Copia e Cola
          </button>

          <button 
            onClick={() => {
              clearCart();
              router.push('/pedido/sucesso');
            }}
            className="w-full mt-4 py-4 rounded-xl bg-[#22C55E] text-black font-bold uppercase tracking-tight hover:scale-[1.02] transition-transform"
          >
            Já realizei o pagamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1c] text-white font-sans selection:bg-[#22C55E] selection:text-black">
      {/* HEADER */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50 py-6">
        <div className="container mx-auto px-6 max-w-6xl flex justify-between items-center">
          <Link href="/" className="flex items-center gap-4 group">
             <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-neutral-500" />
             <div className="flex items-baseline relative z-10 whitespace-nowrap">
               <span className="font-bold text-2xl tracking-tight text-white">May</span>
               <span className="font-light text-2xl tracking-tight text-white pr-1">Nutri</span>
               <div className="w-[6px] h-[6px] bg-[#22C55E]" />
             </div>
          </Link>
          <div className="text-neutral-500 font-bold text-xs uppercase">Checkout Seguro</div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT COLUMN: FORMS */}
          <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-10">
            
            {/* Step 1: Personal Data */}
            <section className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden">
               <div className="absolute top-0 right-0 p-20 bg-white/2 blur-[100px] pointer-events-none" />
               
               <div className="flex items-center justify-between mb-8">
                 <div className="flex flex-col gap-2">
                   <div className="inline-flex text-[9px] font-medium uppercase px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 w-max">
                     01. Identificação
                   </div>
                   <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
                     Meus Dados.
                   </h2>
                 </div>
                 {!editPersonal && (
                   <button onClick={() => setEditPersonal(true)} className="flex items-center gap-2 text-[#22C55E] text-[10px] font-bold uppercase hover:underline">
                     <Edit2 className="w-3 h-3" /> Editar
                   </button>
                 )}
               </div>

               {!editPersonal ? (
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-2">
                   <div className="flex items-center gap-3 text-white font-bold uppercase text-sm"><Check className="text-[#22C55E] w-4 h-4"/> {formData.name}</div>
                   <div className="text-xs text-neutral-400 font-medium uppercase">{formData.email} • CPF {formData.cpf}</div>
                   <div className="text-xs text-[#22C55E] font-medium uppercase mt-2">Pronto para a compra</div>
                 </div>
               ) : (
                 <div className="grid md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                     <label className="text-[10px] font-medium text-white/40 uppercase pl-1">Nome Completo</label>
                     <input 
                       type="text" name="name" value={formData.name} onChange={handleInputChange}
                       placeholder="JOÃO DA SILVA"
                       className={`w-full bg-white/[0.03] border rounded-2xl p-5 text-white placeholder:text-white/10 transition-all outline-none uppercase font-bold text-xs ${errors.name ? 'border-red-500/50' : 'border-white/5 focus:border-[#22C55E]/30'}`}
                     />
                     {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase pl-1">{errors.name}</p>}
                   </div>
                   <div className="space-y-3">
                     <label className="text-[10px] font-medium text-white/40 uppercase pl-1">E-mail de Contato</label>
                     <input 
                       type="email" name="email" value={formData.email} onChange={handleInputChange}
                       placeholder="EMAIL@EXEMPLO.COM"
                       className={`w-full bg-white/[0.03] border rounded-2xl p-5 text-white placeholder:text-white/10 transition-all outline-none uppercase font-bold text-xs ${errors.email ? 'border-red-500/50' : 'border-white/5 focus:border-[#22C55E]/30'}`}
                     />
                     {errors.email && <p className="text-[10px] text-red-500 font-bold uppercase pl-1">{errors.email}</p>}
                   </div>
                   <div className="space-y-3">
                     <label className="text-[10px] font-medium text-white/40 uppercase pl-1">Documento CPF</label>
                     <input 
                       type="text" name="cpf" value={formData.cpf} onChange={handleInputChange}
                       placeholder="000.000.000-00"
                       className={`w-full bg-white/[0.03] border rounded-2xl p-5 text-white placeholder:text-white/10 transition-all outline-none font-bold text-xs ${errors.cpf ? 'border-red-500/50' : 'border-white/5 focus:border-[#22C55E]/30'}`}
                     />
                     {errors.cpf && <p className="text-[10px] text-red-500 font-bold uppercase pl-1">{errors.cpf}</p>}
                   </div>
                   <div className="space-y-3">
                     <label className="text-[10px] font-medium text-white/40 uppercase pl-1">Telefone / WhatsApp</label>
                     <input 
                       type="text" name="phone" value={formData.phone} onChange={handleInputChange}
                       placeholder="(11) 99999-9999"
                       className={`w-full bg-white/[0.03] border rounded-2xl p-5 text-white placeholder:text-white/10 transition-all outline-none font-bold text-xs ${errors.phone ? 'border-red-500/50' : 'border-white/5 focus:border-[#22C55E]/30'}`}
                     />
                     {errors.phone && <p className="text-[10px] text-red-500 font-bold uppercase pl-1">{errors.phone}</p>}
                   </div>
                 </div>
               )}
            </section>

            {/* Step 2: Payment */}
            <section className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden">
               <div className="absolute top-0 right-0 p-20 bg-white/2 blur-[100px] pointer-events-none" />

               <div className="inline-flex text-[9px] font-medium uppercase px-4 py-1.5 rounded-full mb-8 bg-white/5 border border-white/10 text-white/40">
                 02. Pagamento
               </div>

               <h2 className="text-2xl font-black text-white tracking-tight mb-8 uppercase">
                 Checkout.
               </h2>

               <div className="grid md:grid-cols-3 gap-6 mb-10">
                 <button 
                   onClick={() => setPaymentMethod("credit_card")}
                   className={`p-8 rounded-3xl border flex flex-col items-center gap-4 transition-all ${paymentMethod === 'credit_card' ? 'border-[#22C55E] bg-[#22C55E]/5' : 'border-white/5 bg-black/40 hover:border-white/20'}`}
                 >
                   <CreditCard className={`w-10 h-10 ${paymentMethod === 'credit_card' ? 'text-[#22C55E]' : 'text-neutral-700'}`} />
                   <span className="text-xs font-black uppercase">Cartão</span>
                 </button>
                 <button 
                    onClick={() => setPaymentMethod("pix")}
                    className={`p-8 rounded-3xl border flex flex-col items-center gap-4 transition-all ${paymentMethod === 'pix' ? 'border-[#22C55E] bg-[#22C55E]/5' : 'border-white/5 bg-black/40 hover:border-white/20'}`}
                 >
                   <QrCode className={`w-10 h-10 ${paymentMethod === 'pix' ? 'text-[#22C55E]' : 'text-neutral-700'}`} />
                   <span className="text-xs font-black uppercase">PIX</span>
                 </button>
                 <div className="p-8 rounded-3xl border border-white/5 bg-black/20 opacity-40 flex flex-col items-center gap-4 cursor-not-allowed">
                   <AlertCircle className="w-10 h-10 text-neutral-800" />
                   <span className="text-xs font-black uppercase">Boleto</span>
                 </div>
               </div>

                {paymentMethod === 'credit_card' && (
                  <div className="grid grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="col-span-2 space-y-3">
                      <label className="text-[10px] font-medium text-white/40 uppercase pl-1">Número do Cartão</label>
                      <div className="relative">
                         <input
                           type="text"
                           name="cardNumber"
                           value={formData.cardNumber}
                           onChange={(e) => handleCardNumberChange(e.target.value)}
                           placeholder="0000 0000 0000 0000"
                           className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-white placeholder:text-neutral-800 outline-none focus:border-[#22C55E]/30 font-bold text-sm"
                         />
                         <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-3">
                            {cardBrand ? (
                              <div className="bg-white px-2.5 py-1.5 rounded-lg shadow-2xl animate-in fade-in zoom-in duration-500">
                                {!logoError ? (
                                  <img 
                                    src={`https://stc.pagseguro.uol.com.br/public/img/payment-methods-flags/68x30/${cardBrand}.png`} 
                                    alt={cardBrand}
                                    className="h-4 w-auto object-contain"
                                    onError={() => setLogoError(true)}
                                  />
                                ) : (
                                  <span className="text-[9px] font-black uppercase text-neutral-900 tracking-tight">
                                    {cardBrand}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10">
                                <CreditCard className="w-5 h-5 text-neutral-800" />
                              </div>
                            )}
                         </div>
                      </div>
                      {errors.cardNumber && <p className="text-[10px] text-red-500 font-bold uppercase pl-1">{errors.cardNumber}</p>}
                    </div>
                    <div className="col-span-2 space-y-3">
                      <label className="text-[10px] font-medium text-white/40 uppercase pl-1">Nome do Titular do Cartão</label>
                      <input
                        type="text"
                        name="cardHolderName"
                        value={cardHolderName}
                        onChange={(e) => {
                          setCardHolderName(e.target.value.toUpperCase());
                          if (errors.cardHolderName) {
                            setErrors(prev => {
                              const newErrs = { ...prev };
                              delete newErrs.cardHolderName;
                              return newErrs;
                            });
                          }
                        }}
                        placeholder="NOME COMO ESTÁ NO CARTÃO"
                        className={`w-full bg-black/40 border rounded-2xl p-5 text-white placeholder:text-neutral-800 outline-none focus:border-[#22C55E]/30 font-bold text-sm uppercase ${errors.cardHolderName ? 'border-red-500/50' : 'border-white/5'}`}
                      />
                      {errors.cardHolderName && <p className="text-[10px] text-red-500 font-bold uppercase pl-1">{errors.cardHolderName}</p>}
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-medium text-white/40 uppercase pl-1">Vencimento</label>
                      <input
                        type="text"
                        name="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                        placeholder="MM/AA"
                        className={`w-full bg-black/40 border rounded-2xl p-5 text-white placeholder:text-neutral-800 outline-none focus:border-[#22C55E]/30 font-bold text-sm ${errors.cardExpiry ? 'border-red-500/50' : 'border-white/5'}`}
                      />
                      {errors.cardExpiry && <p className="text-[10px] text-red-500 font-bold uppercase pl-1">{errors.cardExpiry}</p>}
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-medium text-white/40 uppercase pl-1">Código CVV</label>
                      <input
                        type="text"
                        name="cardCVV"
                        value={formData.cardCVV}
                        onChange={handleInputChange}
                        placeholder="123"
                        className={`w-full bg-black/40 border rounded-2xl p-5 text-white placeholder:text-neutral-800 outline-none focus:border-[#22C55E]/30 font-bold text-sm ${errors.cardCVV ? 'border-red-500/50' : 'border-white/5'}`}
                      />
                      {errors.cardCVV && <p className="text-[10px] text-red-500 font-bold uppercase pl-1">{errors.cardCVV}</p>}
                    </div>
                    {installments.length > 0 && (
                      <div className="col-span-2 space-y-3">
                        <label className="text-[10px] font-medium text-white/40 uppercase pl-1">Parcelas</label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {installments.map((inst) => (
                            <button
                              key={inst.quantity}
                              type="button"
                              onClick={() => setSelectedInstallment(inst.quantity)}
                              className={`p-3 rounded-xl border text-center transition-all ${
                                selectedInstallment === inst.quantity
                                  ? 'border-[#22C55E] bg-[#22C55E]/10'
                                  : 'border-white/10 bg-black/40 hover:border-white/30'
                              }`}
                            >
                              <div className="text-xs font-bold text-white">{inst.quantity}x</div>
                              <div className="text-[10px] font-medium text-neutral-400">
                                R$ {inst.amount.toFixed(2).replace('.', ',')}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'pix' && (
                  <div className="bg-black/40 p-8 rounded-3xl border border-white/5 animate-in fade-in duration-500">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center">
                        <QrCode className="w-6 h-6 text-[#22C55E]" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm uppercase">Pagamento Instantâneo</p>
                        <p className="text-neutral-500 text-xs">Aprovação em segundos</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-left">
                      <div className="flex items-center gap-3 text-neutral-400 text-xs">
                        <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold">1</div>
                        <span>Clique em Finalizar Compra</span>
                      </div>
                      <div className="flex items-center gap-3 text-neutral-400 text-xs">
                        <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold">2</div>
                        <span>Escaneie o QR Code com seu banco</span>
                      </div>
                      <div className="flex items-center gap-3 text-neutral-400 text-xs">
                        <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold">3</div>
                        <span>Pagamento aprovado na hora</span>
                      </div>
                    </div>
                  </div>
                )}
            </section>
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="lg:col-span-12 xl:col-span-4 lg:sticky lg:top-[120px]">
            <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-20 bg-[#22C55E]/5 blur-[100px] pointer-events-none" />
               
               <h2 className="text-2xl font-black text-white tracking-tight mb-10 uppercase ">
                 Pedido.
               </h2>
               
               <div className="space-y-8 mb-10">
                 {items.map(item => (
                   <div key={item.id} className="flex justify-between items-center">
                     <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-white uppercase leading-none">{item.name}</span>
                        <span className="text-white/30 text-[9px] font-medium uppercase">Qtd: {item.quantity}</span>
                     </div>
                     <span className="font-black text-white text-xl tracking-tight">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                   </div>
                 ))}
                 
                 <div className="h-[1px] bg-white/5" />

                 <div className="flex justify-between text-[11px] font-medium uppercase text-white/40">
                    <span>Subtotal</span>
                    <span className="font-black text-white/80 text-sm">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                 </div>

                 {thermalBagOption === 'new' && (
                    <div className="flex justify-between text-[11px] font-medium uppercase text-white/40">
                      <span>Bolsa Térmica</span>
                      <span className="font-black text-white/80 text-sm">R$ 10,00</span>
                    </div>
                 )}

                 <div className="flex justify-between text-[11px] font-black uppercase text-[#22C55E]">
                    <span>Frete / Retirada</span>
                    <span className="text-sm">Grátis</span>
                 </div>
               </div>

               <div className="flex justify-between items-end mb-12">
                 <span className="text-[11px] font-medium text-white/30 uppercase pb-2">Total Final</span>
                 <span className="text-5xl font-black tracking-tighter text-white">R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
               </div>

               {apiError && (
                 <div className="mb-8 p-5 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-4 text-red-500 text-xs font-bold uppercase tracking-tight">
                   <AlertCircle className="w-5 h-5 flex-shrink-0" />
                   {apiError}
                 </div>
               )}

                <button 
                   disabled={isProcessing}
                   onClick={handleFinish}
                   className={`group relative w-full py-1.5 rounded-full font-medium text-[10px] uppercase transition-all flex items-center justify-center gap-10 shadow-2xl overflow-hidden ${isProcessing ? 'bg-white/5 text-white/20' : 'bg-[#22C55E] text-black hover:scale-[1.01] active:scale-95 hover:shadow-[#22C55E]/20'}`}
                >
                  <span className="relative z-10 transition-colors flex items-center gap-3">
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {isLoadingPayment ? "Processando pagamento..." : "Aguarde..."}
                      </>
                    ) : (
                      "Finalizar Compra"
                    )}
                  </span>
                  
                  {!isProcessing && (
                    <div className="relative w-9 h-9 rounded-xl bg-black/10 flex items-center justify-center transition-all duration-500 group-hover:rotate-[45deg]">
                      <ArrowRight className="w-5 h-5 text-black group-hover:rotate-[-45deg] transition-all duration-500" />
                    </div>
                  )}
                </button>
               
               <p className="text-[9px] text-center text-white/20 mt-10 uppercase font-medium leading-relaxed">
                 MayNutri • Premium Experience • 2024
               </p>

               {/* TRUST SEALS - REFINED VERSION */}
               <div className="mt-12 pt-10 border-t border-white/5 flex flex-col items-center gap-10">
                 <div className="flex flex-col items-center gap-6 w-full px-4">
                   <p className="text-[9px] font-medium text-white/20 uppercase mb-2 text-center">Pagamento 100% Seguro & Criptografado</p>
                   
                   <div className="grid grid-cols-5 gap-3 items-center justify-center w-full opacity-30 px-2 lg:px-4 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                      <img src="/seals/visa.svg" alt="Visa" className="h-4 w-auto object-contain [filter:brightness(0)_invert(1)] mx-auto" />
                      <img src="/seals/mastercard.svg" alt="Mastercard" className="h-6 w-auto object-contain [filter:brightness(0)_invert(1)] mx-auto" />
                      <img src="/seals/elo.svg" alt="Elo" className="h-6 w-auto object-contain [filter:brightness(0)_invert(1)] mx-auto" />
                      <img src="/seals/pix.svg" alt="Pix" className="h-5 w-auto object-contain [filter:brightness(0)_invert(1)] mx-auto" />
                      <img src="/seals/amex.svg" alt="Amex" className="h-5 w-auto object-contain [filter:brightness(0)_invert(1)] mx-auto" />
                   </div>

                   <div className="mt-2 flex items-center gap-3 py-2.5 px-6 rounded-full bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
                      <span className="text-[8px] font-medium text-white/30 uppercase">Processado por</span>
                       <img src="/seals/pagseguro.svg" alt="PagSeguro" className="h-4 w-auto object-contain opacity-40 group-hover:opacity-100 transition-opacity" />
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-6 justify-center w-full pb-10">
                    <div className="flex items-center gap-3 group">
                       <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-white/30 group-hover:text-[#22C55E] group-hover:bg-[#22C55E]/5 transition-all">
                          <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[9px] sm:text-[10px] font-black text-white uppercase">Selo SSL</span>
                          <span className="text-[8px] font-medium text-white/20 uppercase">Criptografia</span>
                       </div>
                    </div>
                    <div className="w-[1px] h-10 bg-white/5" />
                    <div className="flex items-center gap-3 group">
                       <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-white/30">
                          <LockIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[9px] sm:text-[10px] font-black text-white uppercase">PCI DSS</span>
                          <span className="text-[8px] font-medium text-white/20 uppercase">Compliance</span>
                       </div>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
