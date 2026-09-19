'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTelegram } from '@/hooks/useTelegram';
import { ShoppingBag, CheckCircle2 } from 'lucide-react';

interface Product {
  id: string | number;
  title: string;
  description: string;
  price: number;
  image_url: string;
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // የብዛት እና የትዕዛዝ ቅጽ መረጃዎች
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useTelegram();

  // የቴሌግራም ተጠቃሚ ስም ካለ በራስ-ሰር መሙላት
  useEffect(() => {
    if (user) {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
      setCustomerName(fullName);
    }
  }, [user]);

  // ምርቶችን ከ Supabase ማምጣት
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const { data, error } = await supabase.from('products').select('*');
      if (data && !error) {
        setProducts(data);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const handleOpenOrder = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setOrderSuccess(false);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setOrderSuccess(false);
    setQuantity(1);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSubmitting(true);
    const generatedOrderNo = `CHM-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalAmount = selectedProduct.price * quantity;

    const { error } = await supabase.from('orders').insert([
      {
        order_number: generatedOrderNo,
        customer_name: customerName,
        phone_number: phone,
        delivery_address: address,
        quantity: quantity,
        unit_price: selectedProduct.price,
        total_amount: totalAmount,
        order_status: 'pending'
      }
    ]);

    setSubmitting(false);

    if (error) {
      alert('ትዕዛዝዎን መመዝገብ አልተቻለም። እባክዎ እንደገና ይሞክሩ።');
    } else {
      setOrderNumber(generatedOrderNo);
      setOrderSuccess(true);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-16 text-gray-900">
      {/* 1. Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2">
          <div className="bg-gray-900 p-2 rounded-xl text-white">
            <ShoppingBag size={18} />
          </div>
          <span className="font-bold text-base tracking-tight">Chembaa Store</span>
        </div>
        <a
          href="/admin"
          className="text-xs font-semibold bg-gray-100 border border-gray-200 text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition"
        >
          ዳሽቦርድ
        </a>
      </header>

      {/* 2. Product List */}
      <div className="max-w-xl mx-auto p-4">
        <div className="mb-4">
          <h1 className="text-xl font-black text-gray-900">የዕቃዎች ዝርዝር</h1>
          <p className="text-xs text-gray-500">የሚፈልጉትን እቃ እና ብዛት መርጠው ያዝዙ</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-sm font-medium text-gray-400">
            ምርቶች እየጫኑ ነው...
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl p-3.5 border border-gray-200/80 shadow-xs flex items-center space-x-3.5"
              >
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-20 h-20 rounded-xl object-cover bg-gray-100 border border-gray-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-sm text-gray-900 truncate">{product.title}</h2>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.description}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="font-black text-emerald-600 text-sm">
                      {product.price.toLocaleString()} ETB
                    </span>
                    <button
                      onClick={() => handleOpenOrder(product)}
                      className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-xl active:scale-95 transition"
                    >
                      ይግዙ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Order & Quantity Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            {orderSuccess ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 size={56} className="text-emerald-500 mx-auto" />
                <h3 className="text-lg font-black text-gray-900">ትዕዛዝዎ ተመዝግቧል!</h3>
                <p className="text-xs text-gray-500">
                  የትዕዛዝ መለያ ቁጥርዎ፡ <span className="font-mono font-bold text-gray-900">{orderNumber}</span>
                </p>
                <p className="text-xs text-gray-600">በቅርቡ ደውለን ትዕዛዝዎን እናደርሳለን።</p>
                <button
                  onClick={handleCloseModal}
                  className="w-full mt-4 bg-gray-900 text-white py-3 rounded-xl font-bold text-sm"
                >
                  ወደ መደብር ተመለስ
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-3 border-b border-gray-100 pb-3 mb-3">
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.title}
                    className="w-12 h-12 rounded-lg object-cover border"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">{selectedProduct.title}</h3>
                    <p className="text-xs font-bold text-emerald-600">{selectedProduct.price.toLocaleString()} ETB / አንድ</p>
                  </div>
                </div>

                {/* የብዛት መምረጫ (+ / -) */}
                <div className="my-3 flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                  <span className="text-xs font-medium text-gray-700">ብዛት (Quantity):</span>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-lg text-base font-bold active:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-gray-900">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-900 text-white rounded-lg text-base font-bold active:bg-black"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* ጠቅላላ ዋጋ */}
                <div className="mb-3 flex items-center justify-between border-t border-dashed border-gray-200 pt-2.5">
                  <span className="text-xs font-semibold text-gray-600">ጠቅላላ ክፍያ:</span>
                  <span className="text-base font-black text-emerald-600">
                    {(selectedProduct.price * quantity).toLocaleString()} ETB
                  </span>
                </div>

                {/* የትዕዛዝ መሙያ ቅጽ */}
                <form onSubmit={handleSubmitOrder} className="space-y-2.5">
                  <input
                    type="text"
                    required
                    placeholder="ሙሉ ስምዎ"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs outline-none focus:border-gray-900 bg-gray-50/50"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="ስልክ ቁጥር (09... / 07...)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs outline-none focus:border-gray-900 bg-gray-50/50"
                  />
                  <input
                    type="text"
                    required
                    placeholder="የማድረሻ አድራሻ (ከተማ፣ ሰፈር)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs outline-none focus:border-gray-900 bg-gray-50/50"
                  />

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="w-1/3 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      ሰርዝ
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-2/3 rounded-xl bg-gray-900 py-2.5 text-xs font-bold text-white active:scale-98 transition disabled:opacity-50"
                    >
                      {submitting ? 'እየላከ ነው...' : 'ትዕዛዝ አረጋግጥ'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
