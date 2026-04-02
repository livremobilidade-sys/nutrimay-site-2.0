"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Package, Plus, Search, Edit2, Trash2, 
  Eye, ToggleLeft as Toggle, Image as ImageIcon,
  CheckCircle2, AlertCircle, X, ArrowRight,
  TrendingUp, Tag as TagIcon, DollarSign, Box, Star, ShieldCheck,
  Type, Upload, RefreshCcw, Layers, ArrowUpDown, ChevronUp, ChevronDown,
  Hash, LayoutGrid, Loader2, Link as LinkIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Firebase Imports (Cloud Firestore Only)
import { db } from "@/lib/firebase";
import { 
  collection, onSnapshot, query, orderBy, 
  addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc 
} from "firebase/firestore";

export default function ProductsAdmin() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connError, setConnError] = useState<string | null>(null);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newGroupInput, setNewGroupInput] = useState("");
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<any>({
     id: "", name: "", tag: "", price: "", marketingCopy: "", 
     image: "", status: "ACTIVE", stock: 0, orderIndex: 0, groups: []
  });

  // Real-time synchronization for products
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("orderIndex", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("🔥 [CloudSync] Bases da Vitrine VIP Sincronizada.");
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      setProducts(data);
      setLoading(false);
      setConnError(null);
    }, (error) => {
      console.error("❌ [CloudSync] Falha na Sincronização:", error);
      setConnError("Ops! Falha de Permissão ou Banco de Dados (Firestore) ainda não ativado corretamente.");
      setLoading(false);
    });

    // Fetch master config (groups/categories)
    const fetchMasterConfig = async () => {
       try {
          const docRef = doc(db, "settings", "catalog");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
             const config = docSnap.data();
             setAvailableGroups(config.groups || []);
             setAvailableCategories(config.categories || []);
          }
       } catch (err) { console.log("Config mestra ainda não inicializada."); }
    };
    fetchMasterConfig();

    // EXPOR GLOBALMENTE PARA CASO DE TRAVAMENTO DE UI
    (window as any).importNutriMayBase = () => {
       console.log("🛠️ Invocando Migração Global NutriMay Oficial...");
       handleBulkImport();
    };

    (window as any).purgeCatalog = async () => {
       console.log("🗑️ [Purge] Iniciando limpeza do catálogo...");
       const { getDocs, collection: col, deleteDoc: del, doc: d } = await import("firebase/firestore");
       const snap = await getDocs(col(db, "products"));
       let count = 0;
       for (const docSnap of snap.docs) {
          await del(d(db, "products", docSnap.id));
          count++;
          console.log(`🗑️ [Purge] Apagado: ${docSnap.data().name}`);
       }
       console.log(`✅ [Purge] ${count} produtos removidos com sucesso!`);
    };

    console.log("✅ [CloudSetup] Funções 'importNutriMayBase()' e 'purgeCatalog()' Prontas.");

    return () => {
       unsubscribe();
       delete (window as any).importNutriMayBase;
       delete (window as any).purgeCatalog;
    };
  }, [products.length]);

  const updateMasterConfig = async (groups: string[], categories: string[]) => {
     try {
        await setDoc(doc(db, "settings", "catalog"), { groups, categories }, { merge: true });
     } catch (err) { console.error("Erro ao salvar config mestra:", err); }
  };

  const handleBulkImport = async () => {
     setSaving(true);
     try {
        console.log("🚀 [Migration] Preparando 6 Produtos Oficiais NutriMay...");
        const MOCK_DATA = [
           {
              name: "ALTA PERFORMANCE",
              tag: "PRÉ/PÓS-TREINO",
              price: 39.90,
              marketingCopy: "Sendo uma peça-chave para energia limpa, este mix premium garante vitaminas de forma rápida e eficiente.",
              image: "/fruits/orange-pack.png",
              status: "ACTIVE",
              stock: 50,
              orderIndex: 1,
              groups: ["TREINO", "ENERGIA"]
           },
           {
              name: "IMUNIDADE",
              tag: "DETOX/VITALIDADE",
              price: 39.90,
              marketingCopy: "Sendo uma peça-chave para vitamina c, este mix premium garante defesa de forma rápida e eficiente.",
              image: "/fruits/imunidade-pack.png",
              status: "ACTIVE",
              stock: 50,
              orderIndex: 2,
              groups: ["VITAMINAS", "SISTEMA IMUNE"]
           },
           {
              name: "RECUPERAÇÃO",
              tag: "PÓS-TREINO",
              price: 39.90,
              marketingCopy: "Sendo uma peça-chave para recuperação celular, este mix premium garante antioxidante de forma rápida e eficiente.",
              image: "/fruits/recuperacao-pack.png",
              status: "ACTIVE",
              stock: 50,
              orderIndex: 3,
              groups: ["TREINO", "RECUPERAÇÃO"]
           },
           {
              name: "ESTILO DE VIDA",
              tag: "BEM-ESTAR/LONGEVIDADE",
              price: 39.90,
              marketingCopy: "Sendo uma peça-chave para antioxidante, este mix premium garante longevidade de forma rápida e eficiente.",
              image: "/fruits/estilo-pack.png",
              status: "ACTIVE",
              stock: 50,
              orderIndex: 4,
              groups: ["BEM-ESTAR", "LONGEVIDADE"]
           },
           {
              name: "VITALIDADE MORANGO",
              tag: "DETOX/VITALIDADE",
              price: 39.90,
              marketingCopy: "Sendo uma peça-chave para vitaminas, este mix premium garante refrescância de forma rápida e eficiente.",
              image: "/fruits/morango-pack.png",
              status: "ACTIVE",
              stock: 50,
              orderIndex: 5,
              groups: ["DETOX", "VITALIDADE"]
           },
           {
              name: "ANTIOX FRUTAS VERMELHAS",
              tag: "PRÉ/PÓS-TREINO",
              price: 39.90,
              marketingCopy: "Sendo uma peça-chave para antioxidante, este mix premium garante saúde vascular de forma rápida e eficiente.",
              image: "/fruits/frutas-vermelhas-pack.png",
              status: "ACTIVE",
              stock: 50,
              orderIndex: 6,
              groups: ["ANTIOX", "ENERGIA"]
           }
        ];

        let i = 1;
        for (const item of MOCK_DATA) {
           console.log(`➡️ [Migration] Salvando Mix ${i}: ${item.name}...`);
           await addDoc(collection(db, "products"), {
              ...item,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
           });
           i++;
        }
        console.log("✅ [Migration] Base NutriMay Implantada com Sucesso!");
        alert("✅ Base Oficial NutriMay Implantada com 6 Mixes!");
     } catch (err) {
        console.error("❌ [Migration] Erro Fatal:", err);
     } finally {
        setSaving(false);
     }
  };

  const handleOpenCreate = () => {
     setFormData({ 
        id: "", name: "", tag: "", price: "", marketingCopy: "", 
        image: "", status: "ACTIVE", stock: 0, orderIndex: products.length + 1, groups: [] 
     });
     setIsFormOpen(true);
  };

  const handleOpenEdit = (prod: any) => {
     setFormData({ ...prod, groups: prod.groups || [] });
     setSelectedProduct(null); 
     setIsFormOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
        if (file.size > 800000) {
           alert("Imagem muito grande para base64! Use um LINK externo para melhor performance.");
           return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setFormData({ ...formData, image: reader.result as string });
        reader.readAsDataURL(file);
     }
  };

  const toggleGroup = (group: string) => {
     const currentGroups = [...(formData.groups || [])];
     if (currentGroups.includes(group)) {
        setFormData({ ...formData, groups: currentGroups.filter(g => g !== group) });
     } else {
        setFormData({ ...formData, groups: [...currentGroups, group] });
     }
  };

  const handleCreateNewGroup = () => {
     if (newGroupInput.trim() && !availableGroups.includes(newGroupInput.trim())) {
        const name = newGroupInput.trim();
        const updated = [...availableGroups, name];
        setAvailableGroups(updated);
        setFormData({ ...formData, groups: [...(formData.groups || []), name] });
        setNewGroupInput("");
        updateMasterConfig(updated, availableCategories);
     }
  };

  const handleCreateNewCategory = () => {
     if (newCategoryInput.trim() && !availableCategories.includes(newCategoryInput.trim())) {
        const name = newCategoryInput.trim();
        const updated = [...availableCategories, name];
        setAvailableCategories(updated);
        setFormData({ ...formData, tag: name });
        setNewCategoryInput("");
        updateMasterConfig(availableGroups, updated);
     }
  };

  const handleDelete = async (e: any, id: string) => {
      e.stopPropagation();
      e.preventDefault();
      console.log("🗑️ [Delete] Apagando produto:", id);
      try {
         await deleteDoc(doc(db, "products", id));
         console.log("✅ [Delete] Produto removido com sucesso!");
         
         const updatedProducts = products.filter(p => p.id !== id).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
         for (let i = 0; i < updatedProducts.length; i++) {
            await updateDoc(doc(db, "products", updatedProducts[i].id), { orderIndex: i + 1 });
         }
      } catch (err) {
         console.error("❌ [Delete] Erro ao deletar:", err);
         alert("Erro ao excluir do Firebase.");
      }
   };

  const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setSaving(true);
     try {
        const productPayload = {
           name: formData.name,
           tag: formData.tag || "",
           price: parseFloat(formData.price) || 0,
           marketingCopy: formData.marketingCopy || "",
           image: formData.image || "",
           status: formData.status,
           stock: parseInt(formData.stock) || 0,
           orderIndex: parseInt(formData.orderIndex) || 0,
           groups: formData.groups || [],
           updatedAt: new Date().toISOString()
        };

        if (formData.id) {
           await updateDoc(doc(db, "products", formData.id), productPayload);
        } else {
           await addDoc(collection(db, "products"), { ...productPayload, createdAt: new Date().toISOString() });
        }
        setIsFormOpen(false);
     } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro técnico ao salvar no Firestore.");
     } finally {
        setSaving(false);
     }
  };

  if (connError) {
     return (
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
           <div className="p-10 bg-red-500/10 border border-red-500/20 rounded-[3rem] flex flex-col items-center gap-6 max-w-md text-center">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <p className="text-[12px] font-black text-red-500 uppercase tracking-widest">Erro na Conexão Cloud</p>
           </div>
           <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-white/40"><RefreshCcw className="w-4 h-4" /> Tentar Reconectar</button>
        </div>
     );
  }

  if (loading) {
     return (
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
           <Loader2 className="w-12 h-12 text-[#22C55E] animate-spin" />
           <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Sincronizando Catálogo VIP...</p>
        </div>
     );
  }

  return (
    <div className="space-y-10">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">Catálogo Hub.</h2>
            <p className="text-white/20 text-xs font-medium uppercase tracking-[0.2em]">Infraestrutura Cloud Ageless (Ativa)</p>
         </div>

         <div className="flex gap-4">
            <button onClick={handleBulkImport} className="flex items-center gap-4 px-6 py-1.5 bg-white/5 text-white/40 text-[9px] font-black uppercase rounded-full hover:bg-white/10 transition-all border border-white/5 active:scale-95"><Layers className="w-3.5 h-3.5" /> Importar Base Oficial</button>
            <button onClick={handleOpenCreate} className="flex items-center gap-4 px-8 py-1.5 bg-[#22C55E] text-black text-[10px] font-black uppercase rounded-full hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-[#22C55E]/10"><Plus className="w-4 h-4" /> Criar Novo Mix</button>
         </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#0c0c0e] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
         <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                     <th className="px-8 py-6 text-[9px] font-black uppercase text-white/30 tracking-widest min-w-[50px] text-center">Pos.</th>
                     <th className="px-8 py-6 text-[9px] font-black uppercase text-white/30 tracking-widest">Mix / Produto</th>
                     <th className="px-8 py-6 text-[9px] font-black uppercase text-white/30 tracking-widest">Taxonomia</th>
                     <th className="px-8 py-6 text-[9px] font-black uppercase text-white/30 tracking-widest text-center">Inv.</th>
                     <th className="px-8 py-6 text-[9px] font-black uppercase text-white/30 tracking-widest text-right">Vitrine</th>
                     <th className="px-8 py-6 text-[9px] font-black uppercase text-white/30 tracking-widest text-right">Ações</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {products.map((prod) => (
                    <tr key={prod.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setSelectedProduct(prod)}>
                       <td className="px-8 py-6 text-center"><span className="text-[10px] font-black text-[#22C55E]">{prod.orderIndex}º</span></td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden">
                                {prod.image ? <img src={prod.image} className="w-10 h-10 object-contain drop-shadow-xl" alt="" /> : <ImageIcon className="w-5 h-5 text-white/10" />}
                             </div>
                             <div>
                                <p className="text-[11px] font-black text-white uppercase tracking-widest">{prod.name}</p>
                                <p className="text-[9px] font-medium text-white/20 uppercase mt-0.5">R$ {prod.price?.toFixed(2)}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex flex-col gap-1.5">
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-widest border border-white/5 px-3 py-1 rounded-full inline-block max-w-fit">{prod.tag}</span>
                             <div className="flex flex-wrap gap-1">{prod.groups?.map((g:string) => <span key={g} className="text-[7px] font-black text-[#22C55E]/40 uppercase tracking-widest">{g}</span>)}</div>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-center"><span className={`text-[10px] font-black uppercase tracking-widest ${prod.stock < 5 ? 'text-red-500 animate-pulse' : 'text-white/20'}`}>{prod.stock} un.</span></td>
                       <td className="px-8 py-6 text-right">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${prod.status === 'ACTIVE' ? 'bg-[#22C55E]/5 border-[#22C55E]/10 text-[#22C55E]' : 'bg-white/5 border-white/5 text-white/20'}`}>
                             <div className={`w-1 h-1 rounded-full ${prod.status === 'ACTIVE' ? 'bg-[#22C55E]' : 'bg-white/20'}`} />
                             <span className="text-[8px] font-black uppercase tracking-widest">{prod.status}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(prod); }} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:text-[#22C55E] hover:border-[#22C55E]/20 transition-all shadow-xl"><Edit2 className="w-4 h-4" /></button>
                             <button onClick={(e) => handleDelete(e, prod.id)} className="p-3 bg-white/5 border border-white/5 rounded-xl hover:text-red-500 hover:border-red-500/20 transition-all shadow-xl"><Trash2 className="w-4 h-4" /></button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Product Modals (Detailed & Form) */}
      <AnimatePresence>
         {selectedProduct && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 hide-scrollbar overflow-hidden">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setSelectedProduct(null)} />
               <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-4xl bg-[#060608] border border-white/5 rounded-[3.5rem] p-10 md:p-14 shadow-[0_80px_200px_rgba(0,0,0,1)] flex flex-col hide-scrollbar overflow-y-auto max-h-[90vh]">
                  <div className="flex items-start justify-between mb-12 relative z-10">
                     <div className="flex items-center gap-3">
                        <div className="px-4 py-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-[9px] font-black uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Memória Cloud Ativa</div>
                     </div>
                     <button onClick={() => setSelectedProduct(null)} className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all group"><X className="w-6 h-6 group-hover:rotate-90 transition-transform" /></button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10">
                     <div className="space-y-8 flex flex-col items-center justify-center p-12 bg-white/[0.02] border border-white/5 rounded-[3.5rem]"><img src={selectedProduct.image} className="max-h-[300px] drop-shadow-[0_45px_100px_rgba(0,0,0,1)] object-contain" /></div>
                     <div className="space-y-12">
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{selectedProduct.name}</h3>
                        <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8"><p className="text-xs font-bold text-white uppercase italic">"{selectedProduct.marketingCopy}"</p></div>
                        <div className="grid grid-cols-2 gap-8">
                           <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6"><p className="text-2xl font-black text-[#22C55E] tracking-tighter">R$ {selectedProduct.price?.toFixed(2)}</p></div>
                           <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6"><p className={`text-2xl font-black tracking-tighter ${selectedProduct.stock < 5 ? 'text-red-500' : 'text-white'}`}>{selectedProduct.stock}</p></div>
                        </div>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}

         {isFormOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 hide-scrollbar overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setIsFormOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-4xl bg-[#0c0c0e] border border-white/5 rounded-[3.5rem] p-12 shadow-[0_80px_200px_rgba(0,0,0,1)] max-h-[95vh] overflow-y-auto hide-scrollbar">
               <div className="flex items-center justify-between mb-12"><h3 className="text-2xl font-black text-white uppercase tracking-tighter">{formData.id ? 'Refinar Meta.' : 'Publicar Mix.'}</h3><X className="w-6 h-6 text-white/20 cursor-pointer" onClick={() => setIsFormOpen(false)} /></div>
               <form onSubmit={handleSubmit} className="space-y-14">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="space-y-10">
                        <div onClick={() => fileInputRef.current?.click()} className="w-full h-64 rounded-[3.5rem] bg-white/[0.02] border border-white/5 border-dashed flex items-center justify-center cursor-pointer relative overflow-hidden">{formData.image ? <img src={formData.image} className="w-full h-full object-contain p-8" /> : <Upload className="w-8 h-8 text-white/10" />}<input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" /></div>
                        <input type="text" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} placeholder="LINK DA IMAGEM..." className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-4 text-[10px] text-white font-bold uppercase outline-none" />
                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-2"><label className="text-[8px] font-black text-white/20 uppercase">Estoque</label><input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})} className="w-full bg-black border border-white/5 rounded-xl p-4 text-center font-black text-xs text-white outline-none" /></div>
                           <div className="space-y-2"><label className="text-[8px] font-black text-white/20 uppercase">Posição</label><input type="number" value={formData.orderIndex} onChange={(e) => setFormData({...formData, orderIndex: parseInt(e.target.value) || 0})} className="w-full bg-black border border-white/5 rounded-xl p-4 text-center font-black text-xs text-white outline-none" /></div>
                        </div>
                     </div>
                     <div className="space-y-8">
                        <input type="text" placeholder="NOME DO MIX..." value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-4 text-xs font-black text-white uppercase outline-none" />
                        <input type="number" step="0.01" placeholder="PREÇO R$..." value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-4 text-xs font-black text-white outline-none" />
                        <select value={formData.tag} onChange={(e) => setFormData({...formData, tag: e.target.value})} className="w-full bg-white/[0.03] border border-white/5 rounded-xl p-4 text-[10px] font-black text-white uppercase outline-none"><option value="" className="bg-neutral-900">SELECIONE TAG...</option>{availableCategories.map(c => <option key={c} value={c} className="bg-neutral-900">{c}</option>)}</select>
                        <textarea rows={4} placeholder="MARKETING SLOGAN..." value={formData.marketingCopy} onChange={(e) => setFormData({...formData, marketingCopy: e.target.value})} className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-6 text-xs font-bold text-white uppercase outline-none resize-none leading-relaxed italic" />
                     </div>
                  </div>
                  <div className="pt-8 border-t border-white/5 flex items-center justify-end"><button type="submit" disabled={saving} className="px-14 py-3 rounded-full bg-[#22C55E] text-black font-black text-[12px] uppercase shadow-2xl disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Mix na Nuvem'}</button></div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
