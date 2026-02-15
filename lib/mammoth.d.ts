declare module "mammoth" {
  interface MammothResult {
    value: string;
    messages: { type: string; message: string }[];
  }
  function extractRawText(options: { buffer: Buffer }): Promise<MammothResult>;
  export default { extractRawText };
}
