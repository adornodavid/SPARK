import CryptoJS from "crypto-js"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-encryption-key-change-in-production"

/**
 * Encrypts data using AES encryption
 * @param data - The data to encrypt
 * @returns The encrypted string
 */
export function encryptData(data: string): string {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString()
}

/**
 * Decrypts data using AES decryption
 * @param encryptedData - The encrypted string to decrypt
 * @returns The decrypted string
 */
export function decryptData(encryptedData: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}
