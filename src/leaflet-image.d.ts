declare module 'leaflet-image' {
  import * as L from 'leaflet';

  type LeafletImageCallback = (error: unknown, canvas: HTMLCanvasElement) => void;

  function leafletImage(map: L.Map, callback: LeafletImageCallback): void;

  export default leafletImage;
}
