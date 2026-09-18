'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  RefreshCw, 
  Receipt,
  Search
} from 'lucide-react';

interface Order {
  id: string;
  customer_name: string;
  phone_number: string;
  delivery_address: string;
  total_amount: number;
  deposit_amount: number;
  payment_ref: string;
  order_status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  telegram_id?: string;
}

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ትዕዛዞችን ከ Supabase ማምጣት
  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // የትዕዛዙን ሁኔታ (Status) መቀየር
  const updateStatus = async (id: string, newStatus: Order['order_status']) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from('orders')
      .update({ order_status: newStatus })
      .eq('id', id);

    if (!error) {
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? { ...order, order_status: newStatus } : order))
      );
    }
    setUpdatingId(null);
  };

  // ማጣሪያዎች
  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === 'all' || order.order_status === filter;
    const matchesSearch =
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone_number.includes(searchQuery) ||
      (order.payment_ref && order.payment_ref.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: Order['order_status']) => {
    switch (status) {
      case 'confirmed':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800"><CheckCircle2 className="w-3.5 h-3.5" /> ተረጋግጧል</span>;
      case 'completed':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-800"><CheckCircle2 className="w-3.5 h-3.5" /> ተጠናቋል</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-800"><XCircle className="w-3.5 h-3.5" /> ተሰርዟል</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800"><Clock className="w-3.5 h-3.5" /> በመጠባበቅ ላይ</span>;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 pb-20 max-w-2xl mx-auto">
      {/* ራስጌ */}
      <header className="flex items-center justify-between py-4 border-b border-slate-200 mb-5">
        <div>
          <h1 className="text-xl font-black text-slate-900">የትዕዛዞች አስተዳዳሪ</h1>
          <p className="text-xs text-slate-500">ጠቅላላ ትዕዛዞች: {orders.length}</p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-100 active:scale-95 transition"
          title="አድስ"
        >
          <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {/* መፈለጊያ ሳጥን */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="በስም፣ በስልክ ወይም በክፍያ ቁጥር ፈልግ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      {/* ማጣሪያ ታቦች */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 text-xs font-medium scrollbar-none">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition capitalize ${
              filter === tab
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {tab === 'all' ? 'ሁሉም' : tab === 'pending' ? 'በመጠባበቅ ላይ' : tab === 'confirmed' ? 'የተረጋገጡ' : tab === 'completed' ? 'የተጠናቀቁ' : 'የተሰረዙ'}
          </button>
        ))}
      </div>

      {/* የትዕዛዞች ዝርዝር ካርዶች */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-400 text-sm">
          ትዕዛዞች በመጫን ላይ ናቸው...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm">
          ምንም ትዕዛዝ አልተገኘም
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3"
            >
              {/* የካርዱ ራስጌ */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">{order.customer_name}</h2>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(order.created_at).toLocaleString('am-ET')}</span>
                  </div>
                </div>
                <div>{getStatusBadge(order.order_status)}</div>
              </div>

              {/* መረጃዎች */}
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="w-3.5 h-3.5" /> ስልክ ቁጥር:
                  </span>
                  <a
                    href={`tel:${order.phone_number}`}
                    className="font-semibold text-blue-600 underline"
                  >
                    {order.phone_number}
                  </a>
                </div>

                <div className="flex items-start justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5" /> አድራሻ:
                  </span>
                  <span className="font-medium text-slate-800 text-right max-w-[200px]">
                    {order.delivery_address}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Receipt className="w-3.5 h-3.5" /> የክፍያ ማረጋገጫ:
                  </span>
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                    {order.payment_ref || 'ያልተገለጸ'}
                  </span>
                </div>
              </div>

              {/* የክፍያ ስሌት ሳጥን */}
              <div className="bg-slate-50 rounded-xl p-2.5 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400">ቅድመ-ክፍያ:</span>{' '}
                  <span className="font-bold text-emerald-600">
                    {Number(order.deposit_amount).toLocaleString()} ETB
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">ጠቅላላ ዋጋ:</span>{' '}
                  <span className="font-bold text-slate-900">
                    {Number(order.total_amount).toLocaleString()} ETB
                  </span>
                </div>
              </div>

              {/* ሁኔታ መቀየሪያ አዝራሮች */}
              <div className="pt-2 border-t border-slate-100 flex gap-2">
                {order.order_status !== 'confirmed' && order.order_status !== 'completed' && (
                  <button
                    disabled={updatingId === order.id}
                    onClick={() => updateStatus(order.id, 'confirmed')}
                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    አረጋግጥ
                  </button>
                )}

                {order.order_status !== 'completed' && (
                  <button
                    disabled={updatingId === order.id}
                    onClick={() => updateStatus(order.id, 'completed')}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    ተጠናቀቀ
                  </button>
                )}

                {order.order_status !== 'cancelled' && (
                  <button
                    disabled={updatingId === order.id}
                    onClick={() => updateStatus(order.id, 'cancelled')}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    ሰርዝ
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
