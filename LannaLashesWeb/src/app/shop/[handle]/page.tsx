'use client';
import { useState, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getProduct, ShopifyProduct, ShopifyVariant, formatPrice } from '@/services/shopify';
import { useCartStore } from '@/store/cartStore';
import styles from './product.module.css';

export default function ProductDetailPage({ params }: { params: { handle: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ShopifyVariant | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem } = useCartStore();

  useEffect(() => {
    getProduct(params.handle)
      .then(p => {
        if (!p) { notFound(); return; }
        setProduct(p);
        setSelectedVariant(p.variants.edges[0]?.node ?? null);
      })
      .catch(() => notFound())
      .finally(() => setLoading(false));
  }, [params.handle]);

  async function handleAddToCart() {
    if (!selectedVariant) return;
    setAdding(true);
    try {
      await addItem(selectedVariant.id);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setAdding(false);
    }
  }

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.grid}>
        <div className={`${styles.imageSkel} skeleton`} />
        <div className={styles.infoSkel}>
          <div className={`skeleton`} style={{ height: 32, width: '60%', marginBottom: 12 }} />
          <div className={`skeleton`} style={{ height: 20, width: '30%', marginBottom: 24 }} />
          <div className={`skeleton`} style={{ height: 80, marginBottom: 24 }} />
          <div className={`skeleton`} style={{ height: 48, borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );

  if (!product) return null;

  const images = product.images.edges.map(e => e.node);
  const variants = product.variants.edges.map(e => e.node);
  const price = selectedVariant?.price ?? product.priceRange.minVariantPrice;
  const compareAt = selectedVariant?.compareAtPrice ?? null;
  const inStock = selectedVariant?.availableForSale ?? true;

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => router.back()}>← Shop</button>

      <div className={styles.grid}>
        {/* ── Images ─────────────────────────────────────────────────────────── */}
        <div className={styles.images}>
          <div className={styles.mainImage}>
            {images[activeImage] && (
              <Image
                src={images[activeImage].url}
                alt={images[activeImage].altText || product.title}
                fill
                style={{ objectFit: 'cover' }}
                priority
              />
            )}
            {compareAt && <span className={styles.saleBadge}>Sale</span>}
          </div>
          {images.length > 1 && (
            <div className={styles.thumbs}>
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`${styles.thumb} ${i === activeImage ? styles.thumbActive : ''}`}
                  onClick={() => setActiveImage(i)}
                >
                  <Image src={img.url} alt={img.altText || ''} fill style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ───────────────────────────────────────────────────────────── */}
        <div className={styles.info}>
          <p className={styles.category}>
            {product.collections.edges[0]?.node.title ?? 'Product'}
          </p>
          <h1 className={styles.title}>{product.title}</h1>

          <div className={styles.pricing}>
            <span className={styles.price}>{formatPrice(price.amount, price.currencyCode)}</span>
            {compareAt && (
              <span className={styles.compareAt}>
                {formatPrice(compareAt.amount, compareAt.currencyCode)}
              </span>
            )}
          </div>

          {/* Variants */}
          {variants.length > 1 && (
            <div className={styles.variants}>
              <p className={styles.variantLabel}>
                {variants[0]?.selectedOptions[0]?.name}:{' '}
                <strong>{selectedVariant?.selectedOptions[0]?.value}</strong>
              </p>
              <div className={styles.variantGrid}>
                {variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    disabled={!v.availableForSale}
                    className={`${styles.variantBtn} ${v.id === selectedVariant?.id ? styles.variantActive : ''} ${!v.availableForSale ? styles.variantSoldOut : ''}`}
                  >
                    {v.selectedOptions[0]?.value}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock */}
          {!inStock && (
            <p className={styles.stockOut}>Out of stock</p>
          )}

          {/* Add to cart */}
          <button
            className={`${styles.addBtn} ${added ? styles.addedBtn : ''}`}
            onClick={handleAddToCart}
            disabled={!inStock || adding || added}
          >
            {added ? '✓ Added to Cart' : adding ? 'Adding…' : 'Add to Cart'}
          </button>

          {/* Description */}
          <div className={styles.description}>
            <h3>About this product</h3>
            <p>{product.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
