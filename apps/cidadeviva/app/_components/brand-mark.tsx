export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <div className="brand__mark" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" width={size * 0.56} height={size * 0.56}>
        <circle cx="32" cy="26" r="9" fill="#F4B73A" />
        <path d="M4 50 L20 28 L32 42 L46 22 L60 50 Z" fill="#fff" />
        <path d="M4 50 L60 50 L60 56 L4 56 Z" fill="#1F4A2C" />
      </svg>
    </div>
  );
}
