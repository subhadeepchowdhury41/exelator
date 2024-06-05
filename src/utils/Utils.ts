export async function getHash(content: string) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", content);
  return bufferToHex(hashBuffer);
}

function bufferToHex(buffer: ArrayBuffer) {
  const byteArray = new Uint8Array(buffer);
  const hexCodes = [...byteArray].map((byte) => {
    const hexCode = byte.toString(16);
    return hexCode.padStart(2, "0");
  });
  return hexCodes.join("");
}
