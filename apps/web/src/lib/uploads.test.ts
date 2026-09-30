import { describe, expect, it } from 'vitest';
import { decodeDataUrl, readImage, saveImage, sniffImage } from './uploads';
import { useTempStore } from '../test/helpers';

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(16)]);
const url = (mime: string, b: Buffer) => `data:${mime};base64,${b.toString('base64')}`;

describe('image validation', () => {
  it('identifies images by magic bytes', () => {
    expect(sniffImage(PNG)).toBe('png');
    expect(sniffImage(JPG)).toBe('jpg');
    expect(sniffImage(WEBP)).toBe('webp');
    expect(sniffImage(Buffer.from('<svg onload=alert(1)></svg>                     '))).toBeNull();
    expect(sniffImage(Buffer.from('<?php echo 1; ?>                                '))).toBeNull();
    expect(sniffImage(Buffer.alloc(4))).toBeNull();
  });
  it('accepts real images sent as data URLs', () => {
    expect(decodeDataUrl(url('image/png', PNG)).ext).toBe('png');
    expect(decodeDataUrl(url('image/jpeg', JPG)).ext).toBe('jpg');
  });
  it('rejects SVG/HTML/text even when labelled as an image, and other bad input', () => {
    const html = Buffer.from('<html><script>alert(1)</script></html>          ');
    expect(() => decodeDataUrl(url('image/png', html))).toThrow(/not a valid image/);   // lying label
    expect(() => decodeDataUrl(url('image/svg+xml', PNG))).toThrow(/JPEG, PNG or WebP/);
    expect(() => decodeDataUrl(url('text/html', PNG))).toThrow();
    expect(() => decodeDataUrl('not a data url')).toThrow();
    expect(() => decodeDataUrl(undefined)).toThrow();
    expect(() => decodeDataUrl({})).toThrow();
  });
  it('enforces the 2 MB cap', () => {
    const big = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)]);
    expect(() => decodeDataUrl(url('image/png', big))).toThrow(/too large/);
  });
});

describe('image storage', () => {
  useTempStore();
  it('round-trips bytes and refuses path traversal', async () => {
    const id = await saveImage('HSY-ABC123', PNG, 'png');
    expect((await readImage('HSY-ABC123', id, 'png'))!.equals(PNG)).toBe(true);
    expect(await readImage('HSY-ABC123', '../../../etc/passwd', 'png')).toBeNull();
    expect(await readImage('HSY-ABC123', id, 'svg' as never)).toBeNull();
    await expect(saveImage('../evil', PNG, 'png')).rejects.toThrow();
  });
});
