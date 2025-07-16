import Image from "next/image";
interface StarProps {
  top: number;
  left: number;
  size: number;
  rotate: number;
}
export default function Star({top, left, size, rotate}: StarProps) {
  return (
    <Image
      src="/svgs/Star.svg"
      alt="star"
      className={`fixed  pointer-events-none`}
      style={{
        top: `${(top + 67)/9.6 }vh`,
        left: `${(left + 54)/14.7 }vw`,
        width: `${size}px`,
        height: `${size}px`,
        transform: `rotate(${rotate}deg)`,
      }}
      height={400}
      width={400}
    />
  );
}
