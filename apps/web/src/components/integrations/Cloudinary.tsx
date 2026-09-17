"use client";
import React from "react";
import Image from "next/image";
import { isIntegrationEnabled } from "@/lib/integrations-config";

// Safe fallback for Cloudinary media components using Next Image & HTML5 video
export function CldImage({ src, alt = "", width = 600, height = 400, className, ...props }: any) {
  if (!src) return null;
  // If absolute URL or path, use Next Image or regular img
  if (typeof src === "string" && (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/"))) {
    return <Image src={src} alt={alt} width={width} height={height} className={className} {...props} />;
  }
  return <img src={src} alt={alt} width={width} height={height} className={className} {...props} />;
}

export function CldVideo({ src, className, controls = true, ...props }: any) {
  if (!src) return null;
  return <video src={src} className={className} controls={controls} {...props} />;
}

export function CloudinaryIntegration() {
  if (!isIntegrationEnabled("cloudinary")) return null;
  return null;
}

export default CloudinaryIntegration;
