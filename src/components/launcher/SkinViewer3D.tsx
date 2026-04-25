import { useEffect, useRef } from "react";
import { SkinViewer, WalkingAnimation } from "skinview3d";

type Props = {
  skinUrl: string;
  capeUrl?: string | null;
  model?: "default" | "slim";
  width?: number;
  height?: number;
  rotate?: boolean;
  walk?: boolean;
};

/**
 * Интерактивный 3D-просмотр скина Minecraft.
 * Перетаскиванием можно крутить скин, колесиком — зум.
 */
export const SkinViewer3D = ({
  skinUrl,
  capeUrl,
  model = "default",
  width = 240,
  height = 320,
  rotate = true,
  walk = false,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const viewer = new SkinViewer({
      canvas: canvasRef.current,
      width,
      height,
      skin: skinUrl,
      cape: capeUrl || undefined,
      model,
    });
    viewer.autoRotate = rotate;
    viewer.autoRotateSpeed = 0.6;
    viewer.zoom = 0.85;
    viewer.controls.enableZoom = true;
    viewer.controls.enablePan = false;
    if (walk) {
      viewer.animation = new WalkingAnimation();
    }
    viewerRef.current = viewer;
    return () => {
      viewer.dispose();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update skin/cape/model live
  useEffect(() => {
    const v = viewerRef.current;
    if (!v) return;
    v.loadSkin(skinUrl, { model });
  }, [skinUrl, model]);

  useEffect(() => {
    const v = viewerRef.current;
    if (!v) return;
    if (capeUrl) v.loadCape(capeUrl);
    else v.resetCape();
  }, [capeUrl]);

  useEffect(() => {
    const v = viewerRef.current;
    if (!v) return;
    v.setSize(width, height);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-xl cursor-grab active:cursor-grabbing"
      style={{ touchAction: "none" }}
    />
  );
};
