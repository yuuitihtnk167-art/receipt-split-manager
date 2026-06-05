import type { ProductEntry, SplitSetting } from "../types";
import { formatDate, formatMonth } from "../utils/date";
import { formatMoney } from "../utils/money";

type ProductListProps = {
  products: ProductEntry[];
  splitSettings: SplitSetting[];
  onDeleteProduct: (productId: string) => void;
  notice?: string;
};

export function ProductList({
  products,
  splitSettings,
  onDeleteProduct,
  notice,
}: ProductListProps) {
  const settingsByProductId = new Map(
    splitSettings.map((setting) => [setting.productEntryId, setting]),
  );

  function handleDeleteClick(product: ProductEntry): void {
    const confirmed = window.confirm(
      `${product.officialItemName}を削除します。\n紐づく分割入力予定も一緒に削除されます。よろしいですか？`,
    );

    if (confirmed) {
      onDeleteProduct(product.id);
    }
  }

  return (
    <section className="screen">
      <div className="screen-heading">
        <p className="eyebrow">登録済み商品一覧</p>
        <h2>実支出の記録</h2>
      </div>

      {notice && <p className="info-message">{notice}</p>}

      {products.length === 0 ? (
        <p className="empty-message">登録済みの商品はありません。</p>
      ) : (
        <div className="card-list">
          {products.map((product) => {
            const setting = settingsByProductId.get(product.id);

            return (
              <article key={product.id} className="item-card">
                <div className="item-card-main">
                  <div>
                    <p className="item-title">{product.officialItemName}</p>
                    <p className="item-subtitle">
                      {product.storeName || "店舗名なし"} / {product.category}
                    </p>
                  </div>
                  <strong>{formatMoney(product.amountWithTax)}</strong>
                </div>
                <dl className="detail-grid">
                  <div>
                    <dt>購入日</dt>
                    <dd>{formatDate(product.purchaseDate)}</dd>
                  </div>
                  <div>
                    <dt>入力方法</dt>
                    <dd>{product.inputMethod === "split" ? "分割入力" : "通常入力"}</dd>
                  </div>
                  <div>
                    <dt>商品名</dt>
                    <dd>{product.receiptItemName}</dd>
                  </div>
                  {setting && (
                    <div>
                      <dt>配分</dt>
                      <dd>
                        {formatMonth(setting.startMonth)}から{setting.months}ヶ月
                      </dd>
                    </div>
                  )}
                </dl>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => handleDeleteClick(product)}
                >
                  削除
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
