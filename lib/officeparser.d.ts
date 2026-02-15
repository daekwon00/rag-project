declare module "officeparser" {
  function parseOffice(buffer: Buffer): Promise<string>;
  export { parseOffice };
}
