interface Props {
  size?: number;
  overLimit?: boolean;
}

export default function CakeIcon({ size = 18, overLimit = false }: Props) {
  return (
    <img
      src="/icons/cake.png"
      alt=""
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        mixBlendMode: 'multiply',
        filter: overLimit
          ? 'sepia(1) saturate(3) hue-rotate(-20deg) brightness(0.75)'
          : undefined,
      }}
    />
  );
}
