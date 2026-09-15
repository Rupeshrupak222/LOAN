import Link from 'next/link';
import { Package, Sliders, Cpu, Scale } from 'lucide-react';
import { ProductList } from '@/features/products';

export default function ProductsPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Products & Policies Governance Subnav */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <Link
          href="/products"
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-sm flex items-center gap-1.5"
        >
          <Package className="h-3.5 w-3.5" />
          Loan Products Catalog
        </Link>
        <Link
          href="/bre-studio"
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
        >
          <Cpu className="h-3.5 w-3.5 text-purple-500" />
          BRE Rules Studio
        </Link>
        <Link
          href="/pricing-policies"
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
        >
          <Sliders className="h-3.5 w-3.5 text-emerald-500" />
          Pricing Policies
        </Link>
        <Link
          href="/credit-policies"
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
        >
          <Scale className="h-3.5 w-3.5 text-amber-500" />
          Credit Policy Matrix
        </Link>
      </div>

      <ProductList />
    </div>
  );
}
