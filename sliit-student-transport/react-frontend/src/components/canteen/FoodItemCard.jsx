const FoodItemCard = ({ item, onRequest }) => {
  const inStock = Boolean(item.inStock);
  const quantity = item.quantity || 0;

  return (
    <article className="panel-glass overflow-hidden p-0">
      <img
        src={item.image}
        alt={item.name}
        className="h-40 w-full object-cover"
        onError={(e) => {
          e.currentTarget.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80";
        }}
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">{item.name}</h3>
            <p className="mt-1 text-sm text-slate-500">LKR {Number(item.price).toFixed(2)}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${inStock ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"}`}>
            {inStock ? "In Stock" : "Out of Stock"}
          </span>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 rounded-full px-2 py-1">
            {quantity > 0 ? `${quantity} left` : "Limited"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRequest(item)}
          disabled={!inStock}
          className="mt-4 w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Request Item
        </button>
      </div>
    </article>
  );
};

export default FoodItemCard;
