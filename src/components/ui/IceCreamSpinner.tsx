import "./IceCreamSpinner.css";

export function IceCreamSpinner() {
  return (
    <div
      id="backdrop"
      className="is-flex is-align-items-center is-justify-content-center"
    >
      <span className="loader"></span>
    </div>
  );
}
