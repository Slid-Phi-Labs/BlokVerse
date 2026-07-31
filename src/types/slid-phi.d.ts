declare module "slid-phi" {
  export function encode(
    mode: string,
    data: number[] | number,
    opts?: Record<string, unknown>,
  ): {
    mode: string;
    n: number;
    bitLen: number;
    bytes: Uint8Array;
    bits?: string;
    [key: string]: unknown;
  };

  export function decode(frame: {
    mode?: string;
    n?: number;
    bitLen?: number;
    bytes?: Uint8Array;
    [key: string]: unknown;
  }): number[] | number;

  export function encodeBytes(
    mode: string,
    data: number[] | number,
    opts?: Record<string, unknown>,
  ): {
    mode: string;
    n: number;
    bitLen: number;
    bytes: Uint8Array;
    [key: string]: unknown;
  };

  export function decodeBytes(frame: {
    bytes: Uint8Array;
    [key: string]: unknown;
  }): number[] | number;

  export const OMNI_META: Record<string, unknown>;
}
