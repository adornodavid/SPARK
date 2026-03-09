declare module "crypto-js" {
  namespace AES {
    function encrypt(message: string, key: string): { toString(): string }
    function decrypt(ciphertext: string, key: string): { toString(encoding: typeof enc.Utf8): string }
  }

  namespace enc {
    const Utf8: object
  }

  export { AES, enc }
  export default { AES, enc }
}
