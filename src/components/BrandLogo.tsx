import Image from "next/image";

export function BrandLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/ezcsv-lockup-light.svg"
      alt="ezcsv"
      width={233}
      height={96}
      className={className}
      unoptimized
    />
  );
}
