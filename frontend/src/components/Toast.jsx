export const Toast = ({ message, type = "info", onClose }) => {
  if (!message) return null;

  return (
    <div className={`toast-notification toast-${type}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="toast-close-btn">
          &times;
        </button>
      )}
    </div>
  );
};

export default Toast;
