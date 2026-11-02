type Props = {
  message: string;
  onClose: () => void;
};

export function ErrorBar({ message, onClose }: Props) {
  return (
    <div class="error-bar" role="alert">
      <span class="error-bar-message">{message}</span>
      <button type="button" class="btn btn-icon" title="关闭" onClick={onClose}>
        ×
      </button>
    </div>
  );
}
