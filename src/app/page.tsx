'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useTelegram } from '@/hooks/useTelegram';
import { ShoppingBag, CheckCircle2 } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  deposit_percentage: number;
  image_url: string;
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user, isTMA } = useTelegram();

  useEffect(() => {
    if (user) {
      setCustomerName(`${user.first_name} ${user.last_name || ''}`.trim());
    }

    async function fetchProducts() {
      const { data } = await supabase.from('products').select('*').eq('is_available', true);
      if (data) setProducts(data);
      setLoading(false);
    }
    fetchProducts();
  }, [user]);

  const handlePreOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSubmitting(true);
    const depositAmount = (selectedProduct.price * selectedProduct.deposit_percentage) / 100;

    const { error } = await supabase.from('orders').insert([
      {
        product_id: selectedProduct.id,
        customer_name: customerName,
        phone_number: phone,
        telegram_id: user?.id ? String(user.id) : null,
        delivery_address: address,
        total_amount: selectedProduct.price,
        deposit_amount: depositAmount,
        payment_ref: paymentRef,
        order_status: 'pending',
      },
    ]);

    setSubmitting(false);
    if (!error) {
      setOrderSuccess(true);
      setSelectedProduct(null);
    } else {
      alert('ትዕዛዙን ማስገባት አልተቻለም፤ እባክዎ ደግመው ይሞክሩ።');
    }
  };

  return (
    <main className="max-w-xl mx-auto p-4 pb-20">
      <header className="mb-6 flex justify-between items-center border-b pb-3">
        <div>
          <h1 className="text-xl font-bold">የቅድመ-ትዕዛዝ መደብር</h1>
          <p className="text-xs text-slate-500">
            {isTMA ? `እንኳን ደህና መጡ፣ ${user?.first_name}` : 'በቀጥታ ይዘዙ፣ አድራሻዎ ድረስ እናደርሳለን'}
          </p>
        </div>
        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-medium">
          {isTMA ? 'Telegram App' : 'Web Store'}
        </span>
      </header>

      {orderSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl mb-6 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <p className="text-sm">ትዕዛዝዎ ተመዝግቧል! ቅድመ-ክፍያው ሲረጋገጥ እናሳውቅዎታለን።</p>
        </div>
      )}

      {loading ? (
        <p className="text-center text-slate-500 py-10">ምርቶች በመጫን ላይ ናቸው...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {products.map((p) => {
            const deposit = (p.price * p.deposit_percentage) / 100;
            return (
              <div key={p.id} className="bg-white border rounded-xl overflow-hidden shadow-sm p-4 flex gap-4 items-center">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="w-24 h-24 object-cover rounded-lg bg-slate-100" />
                ) : (
                  <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="text-slate-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-base">{p.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-sm font-bold text-slate-900">{p.price.toLocaleString()} ETB</span>
                    <span className="text-xs text-emerald-600 font-medium">
                      ቅድመ-ክፍያ: {deposit.toLocaleString()} ETB ({p.deposit_percentage}%)
                    </span>
                  </div>
                  <button
                    onClick={() => { setSelectedProduct(p); setOrderSuccess(false); }}
                    className="mt-3 w-full bg-slate-900 text-white text-xs py-2 rounded-lg font-medium hover:bg-slate-800"
                  >
                    ቅድመ-ትዕዛዝ ይዘዙ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-1">ትዕዛዝ ማረጋገጫ</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedProduct.title}</p>

            <form onSubmit={handlePreOrder} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">ሙሉ ስም</label>
                <input
                  required
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full mt-1 border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">ስልክ ቁጥር</label>
                <input
                  required
                  type="tel"
                  placeholder="0911..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full mt-1 border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">የማድረሻ አድራሻ (ከተማ፣ ሰፈር)</label>
                <input
                  required
                  type="text"
                  placeholder="አዲስ አበባ፣ ቦሌ..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full mt-1 border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 border">
                <p className="flex justify-between">
                  <span>የምርት ጠቅላላ ዋጋ:</span>
                  <span className="font-semibold">{selectedProduct.price.toLocaleString()} ETB</span>
                </p>
                <p className="flex justify-between text-emerald-700 font-bold">
                  <span>የሚከፈል ቅድመ-ክፍያ ({selectedProduct.deposit_percentage}%):</span>
                  <span>{((selectedProduct.price * selectedProduct.deposit_percentage) / 100).toLocaleString()} ETB</span>
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">የቴሌብር / ባንክ የግብይት ቁጥር (Transaction Ref)</label>
                <input
                  type="text"
                  placeholder="ለምሳሌ: FT23948..."
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full mt-1 border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 border py-2.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  ይቅር
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-slate-900 text-white py-2.5 rounded-lg text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
                >
                  {submitting ? 'በመላክ ላይ...' : 'ትዕዛዝ አረጋግጥ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
