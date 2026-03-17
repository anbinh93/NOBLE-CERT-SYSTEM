"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type FallbackImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
  fallbackSrc?: string;
};

export function FallbackImage({
  src,
  fallbackSrc = "/course.png",
  alt,
  onError,
  ...rest
}: FallbackImageProps) {
  const [hasError, setHasError] = useState(false);

  const effectiveSrc = !src || hasError ? fallbackSrc : src;

  return (
    <Image
      {...rest}
      alt={alt}
      src={effectiveSrc}
      onError={(e) => {
        if (!hasError) {
          setHasError(true);
        }
        onError?.(e);
      }}
    />
  );
}

