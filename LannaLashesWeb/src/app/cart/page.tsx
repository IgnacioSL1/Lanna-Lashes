'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/services/shopify';
import styles from './cart.module.css';

export default function CartPage() {
  const { cart, isLoading, removeItem, updateItem } = useCartStore();
  const lines = cart?.lines.edges.map(e => e.node) ?? [];

  if (isLoading) return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Your Cart</h1>
      <div className={styles.skel}>
        {[1, 2].map(i => <div key={i} className={`skeleton ${styles.itemSkel}`} />)}
      </div>
    </div>
  );

  if (!cart || lines.length === 0) return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Your Cart</h1>
      <div className={styles.empty}>
        <p>Your cart is empty.</p>
        <Link href="/shop" className={styles.shopLink}>Continue Shopping</Link>
      </div>
    </div>
  );

  const subtotal = cart.cost.subtotalAmount;

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Your Cart</h1>

      <div className={styles.layout}>
        {/* ── Line items ────────────────────────────────────────────────────── */}
        <div className={styles.items}>
          {lines.map(line => {
            const img = line.merchandise.product.images.edges[0]?.node.url;
            return (
              <div key={line.id} className={styles.item}>
                {img && (
                  <Link href={`/shop/${line.merchandise.product.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <div className={styles.itemImage}>
                      <Image src={img} alt={line.merchandise.product.title} fill style={{ objectFit: 'cover' }} />
                    </div>
                  </Link>
                )}
                <div className={styles.itemInfo}>
                  <p className={styles.itemTitle}>{line.merchandise.product.title}</p>
                  {line.merchandise.title !== 'Default Title' && (
                    <p className={styles.itemVariant}>{line.merchandise.title}</p>
                  )}
                  <p className={styles.itemPrice}>
                    {formatPrice(line.merchandise.price.amount, line.merchandise.price.currencyCode)}
                  </p>
                  <div className={styles.qty}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => line.quantity > 1 ? updateItem(line.id, line.quantity - 1) : removeItem(line.id)}
                    >−</button>
                    <span className={styles.qtyNum}>{line.quantity}</span>
                    <button
                      className={styles.qtyBtn}
                      onClick={() => updateItem(line.id, line.quantity + 1)}
                    >+</button>
                  </div>
                </div>
                <div className={styles.itemRight}>
                  <p className={styles.lineTotal}>
                    {formatPrice(line.cost.totalAmount.amount, line.cost.totalAmount.currencyCode)}
                  </p>
                  <button className={styles.remove} onClick={() => removeItem(line.id)}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Summary ───────────────────────────────────────────────────────── */}
        <div className={styles.summary}>
          <h2 className={styles.summaryTitle}>Order Summary</h2>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>{formatPrice(subtotal.amount, subtotal.currencyCode)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Shipping</span>
            <span className={styles.shippingNote}>Calculated at checkout</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
            <span>Total</span>
            <span>{formatPrice(subtotal.amount, subtotal.currencyCode)}</span>
          </div>
          <a
            href={cart.checkoutUrl}
            className={styles.checkoutBtn}
            rel="noopener noreferrer"
          >
            Checkout →
          </a>
          <Link href="/shop" className={styles.continueLink}>Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
