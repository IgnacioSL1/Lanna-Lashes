'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getProducts, formatPrice, getProductBadge, ShopifyProduct } from '@/services/shopify';
import { useCartStore } from '@/store/cartStore';
import styles from './shop.module.css';

const CATEGORIES = [
  { label: 'All Products',  handle: 'all-lash-products' },
  { label: 'Lash Trays',   handle: 'lash-trays' },
  { label: 'Bundles',      handle: 'bundles-1' },
  { label: 'eBooks',       handle: 'ebooks' },
  { label: 'Online Courses', handle: 'online-training' },
  { label: 'In-Person',    handle: 'in-person-lash-trainings' },
];
const SORTS = [
  { value: 'best_selling', label: 'Best Selling' },
  { value: 'price_asc',    label: 'Price: Low to High' },
  { value: 'price_desc',   label: 'Price: High to Low' },
  { value: 'newest',       label: 'Newest' },
];

export default function ShopPage() {
  return <Suspense fallback={<div style={{minHeight:'100vh'}} />}><ShopPageInner /></Suspense>;
}

function ShopPageInner() {
  const searchParams = useSearchParams();
  const { addItem } = useCartStore();
  const [products, setProducts]   = useState<ShopifyProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory]   = useState(CATEGORIES[0]); // All Products
  const [sort, setSort]           = useState('best_selling');
  const [search, setSearch]       = useState(searchParams.get('q') ?? '');
  const [addingId, setAddingId]   = useState<string | null>(null);
  const [addedId, setAddedId]     = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    getProducts(60, category.handle)
      .then(setProducts)
      .catch(e => setError(e.message ?? 'Failed to load products'))
      .finally(() => setIsLoading(false));
  }, [category]);

  const filtered = products.filter(p =>
    search ? p.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  const sorted = [...filtered].sort((a, b) => {
    const pa = parseFloat(a.priceRange.minVariantPrice.amount);
    const pb = parseFloat(b.priceRange.minVariantPrice.amount);
    if (sort === 'price_asc')  return pa - pb;
    if (sort === 'price_desc') return pb - pa;
    return 0;
  });

  const handleAddToCart = async (product: ShopifyProduct, e: React.MouseEvent) => {
    e.preventDefault();
    const variant = product.variants.edges[0]?.node;
    if (!variant?.availableForSale) return;
    setAddingId(product.id);
    await addItem(variant.id).catch(console.error);
    setAddingId(null);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <p className={styles.headerLabel}>Lanna Lashes</p>
            <h1 className={styles.headerTitle}>Shop</h1>
          </div>
          <div className={styles.headerSearch}>
            <SearchIcon />
            <input
              className={styles.searchInput}
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.body}>
        {/* Filters sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.filterGroup}>
            <p className={styles.filterLabel}>CATEGORY</p>
            {CATEGORIES.map(cat => (
              <button
                key={cat.label}
                className={`${styles.filterBtn} ${category.label === cat.label ? styles.filterBtnActive : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className={styles.filterGroup}>
            <p className={styles.filterLabel}>SORT BY</p>
            {SORTS.map(s => (
              <button
                key={s.value}
                className={`${styles.filterBtn} ${sort === s.value ? styles.filterBtnActive : ''}`}
                onClick={() => setSort(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Product grid */}
        <div className={styles.content}>
          <div className={styles.resultsBar}>
            <p className={styles.resultsCount}>
              {isLoading ? 'Loading...' : `${sorted.length} products`}
            </p>
            {/* Mobile filter chips */}
            <div className={styles.mobileFilters}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  className={`${styles.mobileChip} ${category.label === cat.label ? styles.mobileChipActive : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <div className={styles.empty}>
              <p className={styles.emptyText}>Could not load products</p>
              <p style={{ fontSize: 13, color: 'var(--light)', marginTop: 8 }}>{error}</p>
            </div>
          ) : isLoading ? (
            <div className={styles.grid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={`skeleton ${styles.skeletonImage}`} />
                  <div className={styles.skeletonBody}>
                    <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 14, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyLL}>LL</span>
              <p className={styles.emptyText}>No products found</p>
              <button className={styles.emptyReset} onClick={() => { setSearch(''); setCategory(CATEGORIES[0]); }}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {sorted.map((product, i) => {
                const price    = formatPrice(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode);
                const cmpAt    = parseFloat(product.compareAtPriceRange.minVariantPrice.amount);
                const minPrice = parseFloat(product.priceRange.minVariantPrice.amount);
                const badge    = getProductBadge(product);
                const inStock  = product.variants.edges[0]?.node.availableForSale ?? false;
                const isAdding = addingId === product.id;
                const wasAdded = addedId === product.id;

                return (
                  <Link
                    key={product.id}
                    href={`/shop/${product.handle}`}
                    className={`${styles.productCard} animate-fade-up`}
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <div className={styles.productImage}>
                      {product.images.edges[0]
                        ? <img src={product.images.edges[0].node.url} alt={product.title} className={styles.productImg} />
                        : <span className={styles.productLL}>LL</span>
                      }
                      {badge && <span className={styles.badge}>{badge}</span>}
                      {!inStock && <span className={`${styles.badge} ${styles.badgeOut}`}>Sold Out</span>}
                    </div>
                    <div className={styles.productInfo}>
                      <p className={styles.productCategory}>
                        {product.collections.edges[0]?.node.title ?? 'Lanna Lashes'}
                      </p>
                      <h3 className={styles.productName}>{product.title}</h3>
                      <div className={styles.productFooter}>
                        <div className={styles.priceRow}>
                          {cmpAt > minPrice && (
                            <span className={styles.oldPrice}>
                              {formatPrice(product.compareAtPriceRange.minVariantPrice.amount)}
                            </span>
                          )}
                          <span className={styles.price}>{price}</span>
                        </div>
                        <button
                          className={`${styles.addBtn} ${wasAdded ? styles.addBtnDone : ''}`}
                          onClick={e => handleAddToCart(product, e)}
                          disabled={!inStock || isAdding}
                          aria-label="Add to cart"
                        >
                          {isAdding ? '...' : wasAdded ? '✓' : '+'}
                        </button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0, color: 'var(--light)' }}>
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}
