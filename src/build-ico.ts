/** Pack multiple PNG sizes into a single multi-resolution .ico container (ICONDIR format). */
export function packIco(sizes: number[], pngs: Uint8Array[]): Uint8Array {
  const headerSize = 6 + 16 * sizes.length;
  const totalDataSize = pngs.reduce((a, p) => a + p.length, 0);
  const buf = new ArrayBuffer(headerSize + totalDataSize);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);

  // ICONDIR
  view.setUint16(0, 0, true);          // reserved
  view.setUint16(2, 1, true);          // type: icon
  view.setUint16(4, sizes.length, true); // count

  let offset = headerSize;
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const png = pngs[i];
    const e = 6 + 16 * i;
    view.setUint8(e + 0, size === 256 ? 0 : size);  // width  (0 means 256)
    view.setUint8(e + 1, size === 256 ? 0 : size);  // height
    view.setUint8(e + 2, 0);                         // colors (0 = 256+)
    view.setUint8(e + 3, 0);                         // reserved
    view.setUint16(e + 4, 1, true);                  // color planes
    view.setUint16(e + 6, 32, true);                 // bits per pixel
    view.setUint32(e + 8, png.length, true);         // size of icon data
    view.setUint32(e + 12, offset, true);            // offset in file
    bytes.set(png, offset);
    offset += png.length;
  }
  return bytes;
}
