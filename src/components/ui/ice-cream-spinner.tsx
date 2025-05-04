import "./ice-cream-spinner.css";

export function IceCreamSpinner() {
  return (
    <div id="backdrop" className="flex items-center justify-center">
      <span className="loader"></span>
    </div>
  );
}
