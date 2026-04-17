const statusClass = {
  pending: "bg-amber-100 text-amber-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

const RequestCard = ({ request, actions, helperLocation }) => {
  const subtotal = Number(request.itemPrice || 0) * Number(request.quantity || 0);
  const deliveryCharge = Number(request.serviceCharge || 0);
  const totalAmount = Number(request.totalAmount || subtotal + deliveryCharge);
  const statusSteps = ["pending", "accepted", "completed"];
  const currentStepIndex = statusSteps.indexOf(request.status);

  return (
    <article className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-800">{request.foodName}</p>
          <p className="text-xs text-slate-500">Requester: {request.userName || "-"}</p>
          <p className="text-xs text-slate-500">Helper: {request.helperName || "-"}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass[request.status] || "bg-slate-100 text-slate-600"}`}>
          {request.status?.toUpperCase()}
        </span>
      </div>

      <div className="mt-3 mb-2">
        <div className="flex items-center justify-between text-xs">
          {statusSteps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isActive = idx === currentStepIndex;
            return (
              <div key={step} className="flex flex-col items-center flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mb-1 transition ${isCompleted ? (isActive ? "bg-blue-600" : "bg-emerald-600") : "bg-slate-300"}`}>
                  {isCompleted && !isActive ? "✓" : idx + 1}
                </div>
                <span className={`mt-0.5 text-center font-semibold capitalize text-xs ${isCompleted ? "text-slate-700" : "text-slate-400"}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-3">
        <p>Qty: {request.quantity}</p>
        <p>Delivery: LKR {deliveryCharge.toFixed(2)}</p>
        <p>Food: LKR {subtotal.toFixed(2)}</p>
      </div>

      {request.status === "pending" && (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-xs text-amber-800">
          <p className="font-semibold">Your Contact Details</p>
          <p>IT No: {request.itNumber || "Not provided"}</p>
          <p>Phone: {request.phoneNumber || "Not provided"}</p>
        </div>
      )}

      {request.status === "accepted" && (
        <div className="mt-2 space-y-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-xs text-emerald-800">
            <p className="font-semibold">✓ Selected Helper Accepted</p>
            <p>IT No: {request.helperItNumber || "N/A"}</p>
            <p>Phone: {request.helperPhoneNumber || "N/A"}</p>
          </div>
          {helperLocation && (
            <div className="rounded-lg border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-3 text-xs text-blue-800">
              <p className="font-bold text-sm mb-2">📍 Live Location Tracking</p>
              <p><span className="font-semibold">Distance:</span> {helperLocation.distance}</p>
              <p><span className="font-semibold">ETA:</span> {helperLocation.eta}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-2 grid grid-cols-1 gap-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700 sm:grid-cols-3">
        <p>Subtotal: LKR {subtotal.toFixed(2)}</p>
        <p>Service: LKR {deliveryCharge.toFixed(2)}</p>
        <p className="font-semibold text-slate-900">Total: LKR {totalAmount.toFixed(2)}</p>
      </div>

      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </article>
  );
};

export default RequestCard;
